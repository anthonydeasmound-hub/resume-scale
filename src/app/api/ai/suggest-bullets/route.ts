import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobTitle, company } = await request.json();

    if (!jobTitle) {
      return NextResponse.json(
        { error: "Job title is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate 5 strong resume bullet points for someone who worked as a "${jobTitle}"${company ? ` at ${company}` : ""}.

REQUIREMENTS:
- Each bullet must start with a strong action verb (Led, Developed, Implemented, Achieved, Managed, etc.)
- Include specific metrics and numbers (percentages, dollar amounts, team sizes, time saved)
- Focus on achievements and impact, not just responsibilities
- Make them specific to this role but general enough to be customizable
- Each bullet should be 1-2 lines maximum

FORMAT:
Return ONLY a JSON array of 5 strings, no other text.
Example: ["Led team of 8 engineers...", "Increased revenue by 40%..."]

Generate bullets now:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON from response
    let bullets: string[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        bullets = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing bullets JSON:", parseError);
      // Fallback: try to split by newlines if JSON parsing fails
      bullets = text
        .split("\n")
        .filter(line => line.trim().startsWith("-") || line.trim().startsWith("•"))
        .map(line => line.replace(/^[-•]\s*/, "").trim())
        .filter(line => line.length > 20)
        .slice(0, 5);
    }

    // Ensure we have valid bullets
    bullets = bullets
      .filter(b => typeof b === "string" && b.length > 20)
      .slice(0, 5);

    return NextResponse.json({ bullets });
  } catch (error) {
    console.error("Error generating bullet suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
