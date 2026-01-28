import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { queryOne } from "@/lib/db";
import { generateBulletOptions } from "@/lib/gemini";
import { z } from "zod";

const inputSchema = z.object({
  jobId: z.number(),
  role: z.object({
    company: z.string().min(1),
    title: z.string().min(1),
    description: z.array(z.string()).min(1),
  }),
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
    const { jobId, role } = parsed.data;

    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get job application
    const job = await queryOne<{
      job_description: string;
      job_title: string;
      company_name: string;
    }>(`
      SELECT * FROM job_applications WHERE id = $1 AND user_id = $2
    `, [jobId, user.id]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Generate 8 bullet options for the role
    const bullets = await generateBulletOptions(
      role,
      job.job_description,
      job.job_title,
      job.company_name
    );

    return NextResponse.json({ bullets });
  } catch (error) {
    console.error("Generate bullets error:", error);
    return NextResponse.json({ error: "Failed to generate bullets" }, { status: 500 });
  }
}
