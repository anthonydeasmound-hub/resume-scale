import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateATSScore, ATSScore } from "@/lib/ats-scorer";

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

  try {
    const body: ScoreRequest = await request.json();
    const { resume, jobDescription, jobTitle } = body;

    if (!resume || !jobDescription || !jobTitle) {
      return NextResponse.json(
        { error: "Missing required fields: resume, jobDescription, jobTitle" },
        { status: 400 }
      );
    }

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
