import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { z } from "zod";

const contactInfoSchema = z.object({
  name: z.string().max(200),
  email: z.string().max(200),
  phone: z.string().max(50),
  location: z.string().max(200),
  linkedin: z.string().max(500).optional().default(""),
});

const workExperienceSchema = z.array(z.object({
  company: z.string().max(200),
  title: z.string().max(200),
  start_date: z.string().max(50),
  end_date: z.string().max(50),
  description: z.array(z.string().max(2000)),
})).max(50);

const educationSchema = z.array(z.object({
  institution: z.string().max(200),
  degree: z.string().max(200),
  field: z.string().max(200),
  graduation_date: z.string().max(50),
})).max(20);

const certificationSchema = z.array(z.object({
  name: z.string().max(200),
  issuer: z.string().max(200),
  date: z.string().max(50),
})).max(50);

const honorSchema = z.array(z.object({
  title: z.string().max(200),
  issuer: z.string().max(200),
  date: z.string().max(50),
})).max(50);

const inputSchema = z.object({
  contact_info: contactInfoSchema,
  work_experience: workExperienceSchema,
  skills: z.array(z.string().max(200)).max(100),
  education: educationSchema,
  certifications: certificationSchema.optional(),
  languages: z.array(z.string().max(100)).max(50).optional(),
  honors: honorSchema.optional(),
  profile_photo_path: z.string().max(1000).optional().nullable(),
  raw_text: z.string().max(100000).optional(),
  summary: z.string().max(50000).optional().nullable(),
  resume_style: z.string().max(100).optional(),
  accent_color: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { contact_info, work_experience, skills, education, certifications, languages, honors, profile_photo_path, raw_text, summary, resume_style, accent_color } = parsed.data;

    // Get or create user
    let user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      const result = await execute(
        "INSERT INTO users (email, name, image) VALUES ($1, $2, $3) RETURNING id",
        [session.user.email, session.user.name, session.user.image]
      );
      user = { id: result.rows[0].id as number };
    }

    // Check if resume exists
    const existingResume = await queryOne<{ id: number }>("SELECT id FROM resumes WHERE user_id = $1", [user.id]);

    if (existingResume) {
      // Update existing resume
      await execute(`
        UPDATE resumes
        SET contact_info = $1, work_experience = $2, skills = $3, education = $4,
            certifications = $5, languages = $6, honors = $7, profile_photo_path = $8,
            raw_text = $9, summary = $10, resume_style = $11, accent_color = $12, updated_at = NOW()
        WHERE user_id = $13
      `, [
        JSON.stringify(contact_info),
        JSON.stringify(work_experience),
        JSON.stringify(skills),
        JSON.stringify(education),
        certifications ? JSON.stringify(certifications) : null,
        languages ? JSON.stringify(languages) : null,
        honors ? JSON.stringify(honors) : null,
        profile_photo_path || null,
        raw_text,
        summary || null,
        resume_style || 'basic',
        accent_color || '#2563eb',
        user.id
      ]);
    } else {
      // Insert new resume
      await execute(`
        INSERT INTO resumes (user_id, contact_info, work_experience, skills, education, certifications, languages, honors, profile_photo_path, raw_text, summary, resume_style, accent_color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        user.id,
        JSON.stringify(contact_info),
        JSON.stringify(work_experience),
        JSON.stringify(skills),
        JSON.stringify(education),
        certifications ? JSON.stringify(certifications) : null,
        languages ? JSON.stringify(languages) : null,
        honors ? JSON.stringify(honors) : null,
        profile_photo_path || null,
        raw_text,
        summary || null,
        resume_style || 'basic',
        accent_color || '#2563eb'
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume save error:", error);
    return NextResponse.json(
      { error: "Failed to save resume" },
      { status: 500 }
    );
  }
}
