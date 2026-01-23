import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateEnhancedOnboardingBullets } from "@/lib/gemini-enhanced";
import { buildEnhancementContext, formatBulletsForPrompt } from "@/lib/resume-examples";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Received request body:", JSON.stringify(body));

    const { role, existingBullets } = body;

    if (!role?.company || !role?.title) {
      console.log("Missing role info - company:", role?.company, "title:", role?.title);
      return NextResponse.json(
        { error: "Missing role information", received: { company: role?.company, title: role?.title } },
        { status: 400 }
      );
    }

    // Debug: Check what examples are being loaded
    let context;
    try {
      context = buildEnhancementContext(role.title);
      console.log("=== RESUME EXAMPLES DEBUG ===");
      console.log(`Role: ${role.title}`);
      console.log(`Example bullets found: ${context.exampleBullets.length}`);
      console.log(`Suggested verbs: ${context.suggestedVerbs.length}`);
      console.log(`Suggested metrics: ${context.suggestedMetrics.length}`);
      console.log(`Role skills found: ${context.roleSkills ? 'yes' : 'no'}`);
      if (context.exampleBullets.length > 0) {
        console.log("First example bullet:", context.exampleBullets[0].bullet);
      }
      console.log("Formatted examples preview:", formatBulletsForPrompt(context.exampleBullets.slice(0, 2)));
      console.log("=== END DEBUG ===");
    } catch (contextError) {
      console.error("Error building context:", contextError);
      throw contextError;
    }

    // Use enhanced version with curated resume examples
    console.log("About to call generateEnhancedOnboardingBullets...");
    const bullets = await generateEnhancedOnboardingBullets(role, existingBullets || []);
    console.log("Got bullets:", bullets?.length || 0);

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
