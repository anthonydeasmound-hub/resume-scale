import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseResume } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { resumeText } = await request.json();

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    const parsed = await parseResume(resumeText);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Resume parsing error:", error);

    // Check for rate limit error
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests") || errorMessage.includes("quota")) {
      return NextResponse.json(
        { error: "rate_limit", message: "AI service is temporarily busy. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}
