import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { queryOne } from "@/lib/db";
import { generateSkillRecommendations } from "@/lib/gemini";
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

    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get job application
    const job = await queryOne<{
      job_description: string;
      job_title: string;
      company_name: string;
    }>(`
      SELECT * FROM job_applications WHERE id = $1 AND user_id = $2
    `, [jobId, user.id]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get user's master resume for skills
    const resume = await queryOne<{ skills: string }>(`
      SELECT skills FROM resumes WHERE user_id = $1
    `, [user.id]);

    if (!resume) {
      return NextResponse.json({ error: "Resume not found. Please complete onboarding." }, { status: 400 });
    }

    const candidateSkills: string[] = JSON.parse(resume.skills);

    // Generate skill recommendations
    const skillRecommendations = await generateSkillRecommendations(
      candidateSkills,
      job.job_description,
      job.job_title,
      job.company_name
    );

    return NextResponse.json(skillRecommendations);
  } catch (error) {
    console.error("Generate skills error:", error);
    return NextResponse.json({ error: "Failed to generate skill recommendations" }, { status: 500 });
  }
}
