import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { queryOne, JobApplication } from "@/lib/db";
import { callAI } from "@/lib/gemini";

// POST /api/ai/improve-bullet - Generate an ATS-optimized version of a bullet point
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await checkRateLimit(session.user.email);
  if (rateLimited) return rateLimited;

  try {
    const { jobId, bullet, missingKeywords, missingSkills } = await request.json();

    if (!jobId || !bullet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get user
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get job for context
    const job = await queryOne<Pick<JobApplication, 'job_title' | 'company_name' | 'job_description'>>(`
      SELECT job_title, company_name, job_description
      FROM job_applications
      WHERE id = $1 AND user_id = $2
    `, [jobId, user.id]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Build the prompt with strict length constraint
    const originalLength = bullet.length;
    const maxLength = Math.max(originalLength, 150); // At least 150 chars, but match original if longer

    const prompt = `You are an expert resume writer who helps optimize bullet points for ATS (Applicant Tracking System) compatibility.

The user is applying for: ${job.job_title} at ${job.company_name}

Current bullet point (${originalLength} characters):
"${bullet}"

${missingKeywords?.length > 0 ? `Missing keywords that could be incorporated: ${missingKeywords.slice(0, 3).join(', ')}` : ''}
${missingSkills?.length > 0 ? `Missing skills that could be incorporated: ${missingSkills.slice(0, 3).join(', ')}` : ''}

CRITICAL LENGTH REQUIREMENT:
- The original bullet is ${originalLength} characters
- Your improved version MUST be ${maxLength} characters or fewer
- Staying within this length limit is MORE IMPORTANT than adding keywords
- Only add a keyword if it fits naturally without exceeding the length

Instructions:
1. Rewrite to be more ATS-friendly while staying WITHIN ${maxLength} characters
2. Only incorporate 1 keyword IF it fits naturally and doesn't make the bullet longer than the original
3. Keep the same specificity (numbers, percentages, outcomes)
4. If you cannot improve it without making it longer, return the original text unchanged
5. Do NOT add skills or accomplishments that weren't implied in the original

Return ONLY the improved bullet point text. No quotes, no explanation, just the bullet text.`;

    const improved = await callAI(prompt);

    // Clean up the response
    const cleanedBullet = improved
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^[-•]\s*/, '') // Remove bullet markers
      .trim();

    // Enforce length constraint - if AI exceeded limit, return original
    // Allow 10% tolerance for minor variations
    const lengthTolerance = Math.ceil(maxLength * 1.1);
    if (cleanedBullet.length > lengthTolerance) {
      // AI didn't respect the length limit, return original
      return NextResponse.json({ improved: bullet });
    }

    return NextResponse.json({ improved: cleanedBullet });
  } catch (error) {
    console.error("Improve bullet error:", error);
    return NextResponse.json({ error: "Failed to improve bullet" }, { status: 500 });
  }
}
