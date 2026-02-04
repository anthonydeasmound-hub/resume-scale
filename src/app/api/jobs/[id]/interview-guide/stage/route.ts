import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { queryOne, execute, JobApplication } from "@/lib/db";
import { generateStageContent, generateMorePrepCards, ParsedResume } from "@/lib/gemini";
import { parseIdParam } from "@/lib/params";
import { z } from "zod";

const generateStageSchema = z.object({
  stageName: z.string().min(1),
  stageType: z.string().min(1),
  roleType: z.string().optional(),
});

const generateCardsSchema = z.object({
  stageName: z.string().min(1),
  stageType: z.string().min(1),
  cardType: z.enum(["question", "star_story", "tip"]),
  existingCards: z.array(z.string()).optional(),
});

// POST - Generate content for a single stage or additional cards
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
    const jobIdOrError = parseIdParam(id);
    if (jobIdOrError instanceof NextResponse) return jobIdOrError;
    const jobId = jobIdOrError;

    const body = await request.json();
    const action = body.action || "generate_stage";

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
      return NextResponse.json({ error: "No resume found" }, { status: 400 });
    }

    const parsedResume: ParsedResume = {
      contact_info: resume.contact_info ? JSON.parse(resume.contact_info) : { name: "", email: "", phone: "", location: "" },
      work_experience: resume.work_experience ? JSON.parse(resume.work_experience) : [],
      skills: resume.skills ? JSON.parse(resume.skills) : [],
      education: resume.education ? JSON.parse(resume.education) : [],
    };

    if (action === "generate_stage") {
      // Generate content for a new stage
      const parsed = generateStageSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
      }

      const { stageName, stageType, roleType } = parsed.data;

      const stageContent = await generateStageContent(
        stageName,
        stageType,
        job.job_description || "",
        job.job_title,
        job.company_name,
        parsedResume,
        roleType
      );

      return NextResponse.json({
        stage: {
          id: `stage-${Date.now()}`,
          name: stageName,
          type: stageType,
          ...stageContent,
        },
      });
    } else if (action === "generate_cards") {
      // Generate additional cards for an existing stage
      const parsed = generateCardsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
      }

      const { stageName, stageType, cardType, existingCards } = parsed.data;

      const newCards = await generateMorePrepCards(
        stageName,
        stageType,
        cardType,
        job.job_title,
        job.company_name,
        parsedResume,
        existingCards || []
      );

      return NextResponse.json({ cards: newCards });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Generate stage content error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
