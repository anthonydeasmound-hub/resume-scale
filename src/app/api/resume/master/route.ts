import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for profileId query param
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    // Get user's resume - either by profileId or primary profile
    let resume: {
      id: number;
      profile_name: string;
      is_primary: boolean;
      profile_description: string | null;
      contact_info: string;
      work_experience: string;
      skills: string;
      education: string;
      certifications: string | null;
      languages: string | null;
      honors: string | null;
      profile_photo_path: string | null;
      summary: string | null;
      resume_style: string | null;
      accent_color: string | null;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (profileId) {
      // Get specific profile by ID (ensure it belongs to this user)
      resume = await queryOne<typeof resume>(
        "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
        [parseInt(profileId), user.id]
      );
    } else {
      // Get primary profile (fallback to any profile for backwards compatibility)
      resume = await queryOne<typeof resume>(
        "SELECT * FROM resumes WHERE user_id = $1 AND is_primary = TRUE",
        [user.id]
      );

      // Fallback for existing users without is_primary set
      if (!resume) {
        resume = await queryOne<typeof resume>(
          "SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1",
          [user.id]
        );
      }
    }

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: resume.id,
      profile: {
        id: resume.id,
        name: resume.profile_name || "Master Resume",
        is_primary: resume.is_primary ?? true,
        description: resume.profile_description,
        created_at: resume.created_at,
        updated_at: resume.updated_at,
      },
      contact_info: JSON.parse(resume.contact_info),
      work_experience: JSON.parse(resume.work_experience),
      skills: JSON.parse(resume.skills),
      education: JSON.parse(resume.education),
      certifications: resume.certifications ? JSON.parse(resume.certifications) : [],
      languages: resume.languages ? JSON.parse(resume.languages) : [],
      honors: resume.honors ? JSON.parse(resume.honors) : [],
      profile_photo_path: resume.profile_photo_path,
      summary: resume.summary || "",
      resume_style: resume.resume_style || "basic",
      accent_color: resume.accent_color || "#2563eb",
      created_at: resume.created_at,
      updated_at: resume.updated_at,
    });
  } catch (error) {
    console.error("Get master resume error:", error);
    return NextResponse.json({ error: "Failed to get resume" }, { status: 500 });
  }
}
