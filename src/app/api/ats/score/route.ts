import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { calculateATSScore, ATSScore } from "@/lib/ats-scorer";
import { z } from "zod";

const inputSchema = z.object({
  resume: z.object({
    summary: z.string().optional(),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      bullets: z.array(z.string()),
    })),
    skills: z.array(z.string()),
    education: z.array(z.object({
      degree: z.string(),
      field: z.string().optional(),
      institution: z.string(),
    })),
  }),
  jobDescription: z.string().min(1).max(100000),
  jobTitle: z.string().min(1).max(500),
});

interface ResumeContent {
  summary?: string;
  experience: { title: string; company: string; bullets: string[] }[];
  skills: string[];
  education: { degree: string; field?: string; institution: string }[];
}

interface ScoreRequest {
  resume: ResumeContent;
  jobDescription: string;
  jobTitle: string;
}

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
    const { resume, jobDescription, jobTitle } = parsed.data;

    const score: ATSScore = calculateATSScore(resume, jobDescription, jobTitle);

    return NextResponse.json(score);
  } catch (error) {
    console.error("Error calculating ATS score:", error);
    return NextResponse.json(
      { error: "Failed to calculate ATS score" },
      { status: 500 }
    );
  }
}
