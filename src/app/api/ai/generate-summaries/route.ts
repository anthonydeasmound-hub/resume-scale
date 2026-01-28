import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import db from "@/lib/db";
import { generateSummaryOptions, ParsedResume } from "@/lib/gemini";
import { z } from "zod";

const inputSchema = z.object({
  jobId: z.number(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await checkRateLimit(session.user.email);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { jobId } = parsed.data;

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get job application
    const job = db.prepare(`
      SELECT * FROM job_applications WHERE id = ? AND user_id = ?
    `).get(jobId, user.id) as {
      job_description: string;
      job_title: string;
      company_name: string;
    } | undefined;

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get user's master resume
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

    // Generate 3 summary options
    const summaries = await generateSummaryOptions(
      parsedResume,
      job.job_description,
      job.job_title,
      job.company_name
    );

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error("Generate summaries error:", error);
    return NextResponse.json({ error: "Failed to generate summaries" }, { status: 500 });
  }
}
