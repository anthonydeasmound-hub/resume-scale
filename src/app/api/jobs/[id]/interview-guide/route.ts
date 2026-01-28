import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { queryOne, execute, JobApplication, InterviewGuide } from "@/lib/db";
import { generateInterviewGuide, extractRecruiterFromDescription, ParsedResume, JobDetailsParsed } from "@/lib/gemini";

// GET - Retrieve cached interview guide
export async function GET(
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

    const job = await queryOne<{ interview_guide: string | null; interview_guide_generated_at: string | null }>(`
      SELECT interview_guide, interview_guide_generated_at
      FROM job_applications WHERE id = $1 AND user_id = $2
    `, [jobId, user.id]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.interview_guide) {
      return NextResponse.json({ guide: null, generated_at: null });
    }

    return NextResponse.json({
      guide: JSON.parse(job.interview_guide) as InterviewGuide,
      generated_at: job.interview_guide_generated_at,
    });
  } catch (error) {
    console.error("Get interview guide error:", error);
    return NextResponse.json({ error: "Failed to fetch interview guide" }, { status: 500 });
  }
}

// POST - Generate and cache interview guide
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

    // Get job details
    const job = await queryOne<JobApplication>(`
      SELECT * FROM job_applications WHERE id = $1 AND user_id = $2
    `, [jobId, user.id]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get user's resume
    const resume = await queryOne<{
      contact_info: string | null;
      work_experience: string | null;
      skills: string | null;
      education: string | null;
    }>(`
      SELECT * FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1
    `, [user.id]);

    if (!resume) {
      return NextResponse.json({ error: "No resume found. Please complete your profile first." }, { status: 400 });
    }

    // Parse resume data
    const parsedResume: ParsedResume = {
      contact_info: resume.contact_info ? JSON.parse(resume.contact_info) : { name: "", email: "", phone: "", location: "" },
      work_experience: resume.work_experience ? JSON.parse(resume.work_experience) : [],
      skills: resume.skills ? JSON.parse(resume.skills) : [],
      education: resume.education ? JSON.parse(resume.education) : [],
    };

    // Parse job details if available
    const jobDetails: JobDetailsParsed | undefined = job.job_details_parsed
      ? JSON.parse(job.job_details_parsed)
      : undefined;

    // Generate interview guide
    const guide = await generateInterviewGuide(
      job.job_description || "",
      job.job_title,
      job.company_name,
      parsedResume,
      jobDetails
    );

    // Also extract recruiter info if not already present
    let recruiterUpdate: Record<string, string> = {};
    if (!job.recruiter_name && job.job_description) {
      const recruiterInfo = await extractRecruiterFromDescription(job.job_description);
      if (recruiterInfo.recruiter_name && recruiterInfo.confidence > 0.5) {
        recruiterUpdate = {
          recruiter_name: recruiterInfo.recruiter_name,
          recruiter_email: recruiterInfo.recruiter_email || "",
          recruiter_title: recruiterInfo.recruiter_title || "",
          recruiter_source: "job_description",
        };
      }
    }

    // Save guide to database
    const updateFields = ["interview_guide = $1", "interview_guide_generated_at = NOW()", "updated_at = NOW()"];
    const values: (string | number)[] = [JSON.stringify(guide)];

    let paramIndex = 2;
    for (const [key, value] of Object.entries(recruiterUpdate)) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(jobId, user.id);

    await execute(`
      UPDATE job_applications
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
    `, values);

    return NextResponse.json({
      guide,
      generated_at: new Date().toISOString(),
      recruiter_extracted: Object.keys(recruiterUpdate).length > 0,
    });
  } catch (error) {
    console.error("Generate interview guide error:", error);
    return NextResponse.json({ error: "Failed to generate interview guide" }, { status: 500 });
  }
}
