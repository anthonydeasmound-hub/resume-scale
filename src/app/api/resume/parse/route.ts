import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseResume } from "@/lib/gemini";
import { z } from "zod";

const inputSchema = z.object({
  resumeText: z.string().min(1).max(100000),
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
    const { resumeText } = parsed.data;

    const parsedResume = await parseResume(resumeText);
    return NextResponse.json(parsedResume);
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
