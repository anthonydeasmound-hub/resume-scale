import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { contact_info, work_experience, skills, education, certifications, languages, honors, profile_photo_path, raw_text, summary, resume_style } = await request.json();

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
            raw_text = ?, summary = ?, resume_style = ?, updated_at = CURRENT_TIMESTAMP
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
        user.id
      );
    } else {
      // Insert new resume
      db.prepare(`
        INSERT INTO resumes (user_id, contact_info, work_experience, skills, education, certifications, languages, honors, profile_photo_path, raw_text, summary, resume_style)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        resume_style || 'basic'
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
