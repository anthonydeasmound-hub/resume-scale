import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, queryAll, execute } from "@/lib/db";
import { z } from "zod";

const MAX_PROFILES_PER_USER = 10;

// GET - List all user's resume profiles
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profiles = await queryAll<{
      id: number;
      profile_name: string;
      is_primary: boolean;
      profile_description: string | null;
      work_experience: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, profile_name, is_primary, profile_description, work_experience, created_at, updated_at
       FROM resumes
       WHERE user_id = $1
       ORDER BY is_primary DESC, created_at ASC`,
      [user.id]
    );

    // Extract job title preview from first work experience
    const formattedProfiles = profiles.map((profile) => {
      let jobTitlePreview: string | undefined;
      if (profile.work_experience) {
        try {
          const workExp = JSON.parse(profile.work_experience);
          if (Array.isArray(workExp) && workExp.length > 0) {
            jobTitlePreview = workExp[0].title;
          }
        } catch {
          // Ignore parse errors
        }
      }

      return {
        id: profile.id,
        name: profile.profile_name || "Master Resume",
        is_primary: profile.is_primary ?? true,
        description: profile.profile_description,
        job_title_preview: jobTitlePreview,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    });

    return NextResponse.json({ profiles: formattedProfiles });
  } catch (error) {
    console.error("Get profiles error:", error);
    return NextResponse.json({ error: "Failed to get profiles" }, { status: 500 });
  }
}

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  duplicate_from: z.number(),
});

// POST - Create new profile (always copies from specified profile)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, duplicate_from } = parsed.data;

    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check profile limit
    const profileCount = await queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM resumes WHERE user_id = $1",
      [user.id]
    );

    if (profileCount && parseInt(profileCount.count) >= MAX_PROFILES_PER_USER) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_PROFILES_PER_USER} profiles allowed` },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingName = await queryOne<{ id: number }>(
      "SELECT id FROM resumes WHERE user_id = $1 AND profile_name = $2",
      [user.id, name]
    );

    if (existingName) {
      return NextResponse.json(
        { error: "A profile with this name already exists" },
        { status: 400 }
      );
    }

    // Get source profile to copy from
    const sourceProfile = await queryOne<{
      id: number;
      contact_info: string | null;
      work_experience: string | null;
      skills: string | null;
      education: string | null;
      certifications: string | null;
      languages: string | null;
      honors: string | null;
      profile_photo_path: string | null;
      summary: string | null;
      resume_style: string | null;
      accent_color: string | null;
      raw_text: string | null;
    }>(
      "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
      [duplicate_from, user.id]
    );

    if (!sourceProfile) {
      return NextResponse.json(
        { error: "Source profile not found" },
        { status: 404 }
      );
    }

    // Create new profile (not primary)
    const result = await execute(
      `INSERT INTO resumes (
        user_id, profile_name, is_primary, profile_description,
        contact_info, work_experience, skills, education,
        certifications, languages, honors, profile_photo_path,
        summary, resume_style, accent_color, raw_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, created_at, updated_at`,
      [
        user.id,
        name,
        false, // New profiles are not primary
        description || null,
        sourceProfile.contact_info,
        sourceProfile.work_experience,
        sourceProfile.skills,
        sourceProfile.education,
        sourceProfile.certifications,
        sourceProfile.languages,
        sourceProfile.honors,
        sourceProfile.profile_photo_path,
        sourceProfile.summary,
        sourceProfile.resume_style,
        sourceProfile.accent_color,
        sourceProfile.raw_text,
      ]
    );

    const newProfile = result.rows[0];

    return NextResponse.json({
      profile: {
        id: newProfile.id,
        name,
        is_primary: false,
        description: description || null,
        created_at: newProfile.created_at,
        updated_at: newProfile.updated_at,
      },
    });
  } catch (error) {
    console.error("Create profile error:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
