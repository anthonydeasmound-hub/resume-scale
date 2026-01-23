import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateEnhancedSkillSuggestions } from "@/lib/gemini-enhanced";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Received skill suggestions request:", JSON.stringify(body));

    const { roles, existingSkills } = body;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: "Missing roles information" },
        { status: 400 }
      );
    }

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
