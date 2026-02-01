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

    // Build the prompt
    const prompt = `You are an expert resume writer who helps optimize bullet points for ATS (Applicant Tracking System) compatibility.

The user is applying for: ${job.job_title} at ${job.company_name}

Current bullet point:
"${bullet}"

${missingKeywords?.length > 0 ? `Missing keywords from job description that could be incorporated: ${missingKeywords.slice(0, 5).join(', ')}` : ''}
${missingSkills?.length > 0 ? `Missing skills that could be incorporated if relevant: ${missingSkills.slice(0, 5).join(', ')}` : ''}

Instructions:
1. Rewrite this bullet point to be more ATS-friendly while keeping it truthful and professional
2. Try to naturally incorporate 1-2 of the missing keywords/skills IF they are genuinely relevant to the accomplishment
3. Keep the same level of specificity (numbers, percentages, outcomes)
4. Maintain professional tone and avoid buzzwords
5. Keep it concise (similar length to original, max 2 lines)
6. Do NOT add skills or accomplishments that weren't implied in the original

Return ONLY the improved bullet point text, nothing else. No quotes, no explanation, just the bullet text.`;

    const improved = await callAI(prompt);

    // Clean up the response
    const cleanedBullet = improved
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^[-•]\s*/, '') // Remove bullet markers
      .trim();

    return NextResponse.json({ improved: cleanedBullet });
  } catch (error) {
    console.error("Improve bullet error:", error);
    return NextResponse.json({ error: "Failed to improve bullet" }, { status: 500 });
  }
}
