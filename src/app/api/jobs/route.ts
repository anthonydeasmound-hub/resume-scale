import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { queryOne, queryAll, execute } from "@/lib/db";
import { extractJobInfo, extractJobDetails } from "@/lib/gemini";
import { z } from "zod";

const inputSchema = z.object({
  job_description: z.string().min(1).max(100000),
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
    const { job_description } = parsed.data;

    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract company name, job title, and detailed sections from description using AI
    const [{ company_name, job_title }, jobDetails] = await Promise.all([
      extractJobInfo(job_description),
      extractJobDetails(job_description),
    ]);

    const result = await execute(`
      INSERT INTO job_applications (user_id, company_name, job_title, job_description, job_details_parsed, status)
      VALUES ($1, $2, $3, $4, $5, 'review') RETURNING id
    `, [user.id, company_name, job_title, job_description, JSON.stringify(jobDetails)]);

    return NextResponse.json({
      success: true,
      job_id: result.rows[0].id,
      company_name,
      job_title
    });
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: "Failed to create job application" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json([]);
    }

    const jobs = await queryAll<{ id: number }>(`
      SELECT * FROM job_applications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [user.id]);

    // Check if we need to include related data
    const url = new URL(request.url);
    const include = url.searchParams.get("include")?.split(",") || [];

    if (include.length > 0) {
      const jobsWithRelations = await Promise.all(jobs.map(async (job) => {
        const result: Record<string, unknown> = { ...job };

        if (include.includes("stages")) {
          const stages = await queryAll(`
            SELECT * FROM interview_stages
            WHERE job_id = $1
            ORDER BY stage_number ASC
          `, [job.id]);
          result.interview_stages = stages;
        }

        if (include.includes("emails")) {
          const emails = await queryAll(`
            SELECT * FROM email_actions
            WHERE job_id = $1
            ORDER BY created_at DESC
          `, [job.id]);
          result.email_actions = emails;
        }

        return result;
      }));

      return NextResponse.json(jobsWithRelations);
    }

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
