import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { tailorResume, generateCoverLetter, ParsedResume } from "@/lib/gemini";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get job application
    const job = db.prepare(`
      SELECT * FROM job_applications WHERE id = ? AND user_id = ?
    `).get(jobId, user.id) as {
      id: number;
      company_name: string;
      job_title: string;
      job_description: string;
    } | undefined;

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get user's resume
    const resume = db.prepare(`
      SELECT * FROM resumes WHERE user_id = ?
    `).get(user.id) as {
      contact_info: string;
      work_experience: string;
      skills: string;
      education: string;
    } | undefined;

    if (!resume) {
      return NextResponse.json({ error: "Resume not found. Please complete onboarding." }, { status: 400 });
    }

    const parsedResume: ParsedResume = {
      contact_info: JSON.parse(resume.contact_info),
      work_experience: JSON.parse(resume.work_experience),
      skills: JSON.parse(resume.skills),
      education: JSON.parse(resume.education),
    };

    // Generate tailored resume and cover letter
    const [tailoredResume, coverLetter] = await Promise.all([
      tailorResume(parsedResume, job.job_description, job.job_title, job.company_name),
      generateCoverLetter(parsedResume, job.job_description, job.job_title, job.company_name),
    ]);

    // Save to database
    db.prepare(`
      UPDATE job_applications
      SET tailored_resume = ?, cover_letter = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify({ ...tailoredResume, contact_info: parsedResume.contact_info }), coverLetter, jobId);

    return NextResponse.json({
      success: true,
      tailored_resume: { ...tailoredResume, contact_info: parsedResume.contact_info },
      cover_letter: coverLetter,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json({ error: "Failed to generate documents" }, { status: 500 });
  }
}
