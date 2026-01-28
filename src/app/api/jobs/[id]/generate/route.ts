import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { queryOne, execute } from "@/lib/db";
import { tailorResume, generateCoverLetter, ParsedResume } from "@/lib/gemini";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await checkRateLimit(session.user.email);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;
    const jobId = parseInt(id);

    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get job application
    const job = await queryOne<{
      id: number;
      company_name: string;
      job_title: string;
      job_description: string;
    }>(`
      SELECT * FROM job_applications WHERE id = $1 AND user_id = $2
    `, [jobId, user.id]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get user's resume
    const resume = await queryOne<{
      contact_info: string;
      work_experience: string;
      skills: string;
      education: string;
    }>(`
      SELECT * FROM resumes WHERE user_id = $1
    `, [user.id]);

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
    await execute(`
      UPDATE job_applications
      SET tailored_resume = $1, cover_letter = $2, updated_at = NOW()
      WHERE id = $3
    `, [JSON.stringify({ ...tailoredResume, contact_info: parsedResume.contact_info }), coverLetter, jobId]);

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
