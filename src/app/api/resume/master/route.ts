import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's master resume
    const resume = db.prepare(`
      SELECT * FROM resumes WHERE user_id = ?
    `).get(user.id) as {
      id: number;
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

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: resume.id,
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
