import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateEnhancedOnboardingBullets } from "@/lib/gemini-enhanced";
import { buildEnhancementContext, formatBulletsForPrompt } from "@/lib/resume-examples";
import { z } from "zod";

const inputSchema = z.object({
  role: z.object({
    company: z.string().min(1),
    title: z.string().min(1),
  }),
  existingBullets: z.array(z.string()).optional(),
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
    const { role, existingBullets } = parsed.data;

    // Debug: Check what examples are being loaded
    let context;
    try {
      context = buildEnhancementContext(role.title);
      if (context.exampleBullets.length > 0) {
      }
    } catch (contextError) {
      console.error("Error building context:", contextError);
      throw contextError;
    }

    // Use enhanced version with curated resume examples
    const bullets = await generateEnhancedOnboardingBullets(role, existingBullets || []);

    return NextResponse.json({ bullets });
  } catch (error) {
    console.error("Error generating onboarding bullets:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate bullet suggestions", details: errorMessage },
      { status: 500 }
    );
  }
}
