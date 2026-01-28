import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { z } from "zod";

const inputSchema = z.object({
  contact_info: z.any(),
  work_experience: z.any(),
  skills: z.any(),
  education: z.any(),
  certifications: z.any().optional(),
  languages: z.any().optional(),
  honors: z.any().optional(),
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
    let user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      const result = db.prepare(
        "INSERT INTO users (email, name, image) VALUES (?, ?, ?)"
      ).run(session.user.email, session.user.name, session.user.image);
      user = { id: result.lastInsertRowid as number };
    }

    // Check if resume exists
    const existingResume = db.prepare("SELECT id FROM resumes WHERE user_id = ?").get(user.id);

    if (existingResume) {
      // Update existing resume
      db.prepare(`
        UPDATE resumes
        SET contact_info = ?, work_experience = ?, skills = ?, education = ?,
            certifications = ?, languages = ?, honors = ?, profile_photo_path = ?,
            raw_text = ?, summary = ?, resume_style = ?, accent_color = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
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
      );
    } else {
      // Insert new resume
      db.prepare(`
        INSERT INTO resumes (user_id, contact_info, work_experience, skills, education, certifications, languages, honors, profile_photo_path, raw_text, summary, resume_style, accent_color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
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
      );
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
