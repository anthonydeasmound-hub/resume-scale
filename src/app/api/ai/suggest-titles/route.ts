import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { callAI } from "@/lib/gemini";

interface RoleInput {
  roleIndex: number;
  currentTitle: string;
  company: string;
}

// POST /api/ai/suggest-titles - Generate optimized job title suggestions
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await checkRateLimit(session.user.email);
  if (rateLimited) return rateLimited;

  try {
    const { roles, targetJobTitle, targetJobDescription } = await request.json();

    if (!roles || !Array.isArray(roles) || roles.length === 0 || !targetJobTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rolesText = roles
      .map((r: RoleInput, i: number) => `${i + 1}. "${r.currentTitle}" at ${r.company}`)
      .join("\n");

    const prompt = `You are a career coach helping someone optimize their resume for a specific job application.

TARGET POSITION: ${targetJobTitle}

CURRENT JOB TITLES ON RESUME:
${rolesText}

Your task is to suggest alternative job titles that:
1. Are HONEST - they must represent the same type of work (don't suggest "VP of Sales" for an entry-level role)
2. Are COMMON VARIATIONS - use titles that are widely recognized and ATS-friendly
3. BETTER ALIGN with the target position "${targetJobTitle}"
4. Sound professional and industry-standard

Examples of acceptable changes:
- "Account Executive" → "Sales Executive" or "Business Development Executive"
- "Software Engineer" → "Software Developer" or "Full Stack Engineer"
- "Marketing Coordinator" → "Marketing Specialist" or "Digital Marketing Coordinator"
- "Customer Success Manager" → "Client Success Manager" or "Account Manager"

If a title already aligns well with the target or there's no good alternative, you can suggest keeping it the same.

Return your suggestions as a JSON array with this exact format:
[
  {
    "roleIndex": 0,
    "currentTitle": "Account Executive",
    "suggestedTitle": "Sales Executive",
    "reasoning": "Aligns better with Sales Manager role while accurately reflecting sales responsibilities"
  }
]

Only include roles where you have a meaningful suggestion. If the current title is already optimal, don't include it.

Return ONLY the JSON array, no other text.`;

    const response = await callAI(prompt);

    // Parse JSON from response
    let suggestions = [];
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing title suggestions JSON:", parseError);
      return NextResponse.json({ suggestions: [] });
    }

    // Validate and enrich with company names
    const enrichedSuggestions = suggestions
      .filter((s: { roleIndex: number; suggestedTitle: string }) =>
        typeof s.roleIndex === "number" &&
        typeof s.suggestedTitle === "string" &&
        s.suggestedTitle.length > 0
      )
      .map((s: { roleIndex: number; currentTitle: string; suggestedTitle: string; reasoning: string }) => {
        const role = roles[s.roleIndex];
        return {
          roleIndex: s.roleIndex,
          currentTitle: role?.currentTitle || s.currentTitle,
          company: role?.company || "",
          suggestedTitle: s.suggestedTitle,
          reasoning: s.reasoning || "Better aligns with target position",
          selected: true,
        };
      });

    return NextResponse.json({ suggestions: enrichedSuggestions });
  } catch (error) {
    console.error("Suggest titles error:", error);
    return NextResponse.json({ error: "Failed to generate title suggestions" }, { status: 500 });
  }
}
