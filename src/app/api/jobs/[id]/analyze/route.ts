import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import db, { JobApplication, Resume, JobAnalysis } from "@/lib/db";
import { analyzeJobDescription, ParsedResume, JobDetailsParsed } from "@/lib/gemini";

// GET /api/jobs/[id]/analyze - Get cached analysis or generate new one
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

  const { id } = await params;
  const jobId = parseInt(id);

  // Get user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get job application
  const job = db.prepare(`
    SELECT id, job_description, job_title, company_name, job_details_parsed, job_analysis
    FROM job_applications
    WHERE id = ? AND user_id = ?
  `).get(jobId, user.id) as Pick<JobApplication, 'id' | 'job_description' | 'job_title' | 'company_name' | 'job_details_parsed' | 'job_analysis'> | undefined;

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Check if we have a cached analysis
  if (job.job_analysis) {
    try {
      const analysis = JSON.parse(job.job_analysis) as JobAnalysis;
      return NextResponse.json({ analysis, cached: true });
    } catch {
      // If parsing fails, regenerate
    }
  }

  // No cached analysis - generate a new one
  if (!job.job_description) {
    return NextResponse.json({
      error: "No job description available for analysis"
    }, { status: 400 });
  }

  // Get user's resume
  const resume = db.prepare(`
    SELECT contact_info, work_experience, skills, education
    FROM resumes
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `).get(user.id) as Pick<Resume, 'contact_info' | 'work_experience' | 'skills' | 'education'> | undefined;

  if (!resume) {
    return NextResponse.json({
      error: "No resume found. Please set up your master resume first."
    }, { status: 400 });
  }

  // Parse resume data
  let parsedResume: ParsedResume;
  try {
    parsedResume = {
      contact_info: resume.contact_info ? JSON.parse(resume.contact_info) : { name: "", email: "", phone: "", location: "" },
      work_experience: resume.work_experience ? JSON.parse(resume.work_experience) : [],
      skills: resume.skills ? JSON.parse(resume.skills) : [],
      education: resume.education ? JSON.parse(resume.education) : [],
    };
  } catch {
    return NextResponse.json({ error: "Failed to parse resume data" }, { status: 500 });
  }

  // Parse job details if available
  let jobDetails: JobDetailsParsed | undefined;
  if (job.job_details_parsed) {
    try {
      jobDetails = JSON.parse(job.job_details_parsed);
    } catch {
      // Ignore parsing errors
    }
  }

  // Generate analysis
  const analysis = await analyzeJobDescription(
    job.job_description,
    job.job_title,
    job.company_name,
    parsedResume,
    jobDetails
  );

  // Cache the analysis
  db.prepare(`
    UPDATE job_applications
    SET job_analysis = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(analysis), jobId);

  return NextResponse.json({ analysis, cached: false });
}

// POST /api/jobs/[id]/analyze - Force regenerate analysis
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

  const { id } = await params;
  const jobId = parseInt(id);

  // Get user
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get job application
  const job = db.prepare(`
    SELECT id, job_description, job_title, company_name, job_details_parsed
    FROM job_applications
    WHERE id = ? AND user_id = ?
  `).get(jobId, user.id) as Pick<JobApplication, 'id' | 'job_description' | 'job_title' | 'company_name' | 'job_details_parsed'> | undefined;

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!job.job_description) {
    return NextResponse.json({
      error: "No job description available for analysis"
    }, { status: 400 });
  }

  // Get user's resume
  const resume = db.prepare(`
    SELECT contact_info, work_experience, skills, education
    FROM resumes
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `).get(user.id) as Pick<Resume, 'contact_info' | 'work_experience' | 'skills' | 'education'> | undefined;

  if (!resume) {
    return NextResponse.json({
      error: "No resume found. Please set up your master resume first."
    }, { status: 400 });
  }

  // Parse resume data
  let parsedResume: ParsedResume;
  try {
    parsedResume = {
      contact_info: resume.contact_info ? JSON.parse(resume.contact_info) : { name: "", email: "", phone: "", location: "" },
      work_experience: resume.work_experience ? JSON.parse(resume.work_experience) : [],
      skills: resume.skills ? JSON.parse(resume.skills) : [],
      education: resume.education ? JSON.parse(resume.education) : [],
    };
  } catch {
    return NextResponse.json({ error: "Failed to parse resume data" }, { status: 500 });
  }

  // Parse job details if available
  let jobDetails: JobDetailsParsed | undefined;
  if (job.job_details_parsed) {
    try {
      jobDetails = JSON.parse(job.job_details_parsed);
    } catch {
      // Ignore parsing errors
    }
  }

  // Generate fresh analysis
  const analysis = await analyzeJobDescription(
    job.job_description,
    job.job_title,
    job.company_name,
    parsedResume,
    jobDetails
  );

  // Cache the analysis
  db.prepare(`
    UPDATE job_applications
    SET job_analysis = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(analysis), jobId);

  return NextResponse.json({ analysis, cached: false });
}
