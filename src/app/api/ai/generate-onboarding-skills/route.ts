import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateEnhancedSkillSuggestions } from "@/lib/gemini-enhanced";
import { z } from "zod";

const inputSchema = z.object({
  roles: z.array(z.object({
    company: z.string(),
    title: z.string(),
  })).min(1),
  existingSkills: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(session.user.email!);
    if (rateLimited) return rateLimited;

    const body = await request.json();

    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { roles, existingSkills } = parsed.data;

    const suggestions = await generateEnhancedSkillSuggestions(
      roles,
      existingSkills || []
    );

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error generating skill suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate skill suggestions", details: errorMessage },
      { status: 500 }
    );
  }
}
