import { NextRequest, NextResponse } from "next/server";
import { queryOne, queryAll, execute, JobApplication } from "@/lib/db";
import { extractJobDetails } from "@/lib/gemini";

async function getUserFromToken(request: NextRequest): Promise<{ id: number; email: string } | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  const tokenRecord = await queryOne<{ user_id: number; email: string }>(
    "SELECT et.user_id, u.email FROM extension_tokens et JOIN users u ON et.user_id = u.id WHERE et.token = $1 AND (et.expires_at IS NULL OR et.expires_at > NOW())",
    [token]
  );

  if (!tokenRecord) {
    return null;
  }

  return { id: tokenRecord.user_id, email: tokenRecord.email };
}

// Get recent saved jobs
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10), 20);

    const jobs = await queryAll<Pick<JobApplication, "id" | "job_title" | "company_name" | "status" | "created_at">>(
      `SELECT id, job_title, company_name, status, created_at
       FROM job_applications
       WHERE user_id = $1 AND archived_at IS NULL
       ORDER BY created_at DESC
       LIMIT $2`,
      [user.id, limit]
    );

    return NextResponse.json({
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.job_title,
        company: job.company_name,
        status: job.status,
        createdAt: job.created_at,
      })),
    });
  } catch (error) {
    console.error("Extension get jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { job_description, job_title, company_name, company_url, source_url, apply_url, job_url, location, salary, is_easy_apply, source } = body;

    // Description is optional - we can still save the job without it
    const description = job_description || "No description available";

    // Only use actual external apply URLs, not LinkedIn source URLs
    // apply_url = external career page URL (what we want)
    // source_url = LinkedIn job posting URL (not useful for applying)
    const isLinkedInUrl = (url: string) => url?.includes('linkedin.com');
    let applicationUrl = apply_url || job_url || null;

    // If the URL is a LinkedIn URL, it's not a real application URL
    if (applicationUrl && isLinkedInUrl(applicationUrl)) {
      applicationUrl = null;
    }

    // Check for duplicate (same company and title for this user)
    const existing = await queryOne<{ id: number }>(
      "SELECT id FROM job_applications WHERE user_id = $1 AND company_name = $2 AND job_title = $3",
      [user.id, company_name || "Unknown Company", job_title || "Unknown Position"]
    );

    if (existing) {
      return NextResponse.json({ error: "Job already saved" }, { status: 409 });
    }

    // Extract job details (salary, location, etc.) from description
    let extractedDetails = null;
    if (description && description !== "No description available") {
      try {
        extractedDetails = await extractJobDetails(description);
        console.log("[extension/jobs] Extracted job details:", {
          salary: extractedDetails.salary_range,
          location: extractedDetails.location,
        });
      } catch (error) {
        console.error("[extension/jobs] Failed to extract job details:", error);
        // Continue without parsed details - job will still be saved
      }
    }

    // Combine extracted details with source metadata
    const jobDetails = {
      ...(extractedDetails || {}),
      source_url: source_url || null,
      is_easy_apply: is_easy_apply || false,
      source: source || 'unknown',
    };

    // Create job application
    const result = await execute(`
      INSERT INTO job_applications (user_id, company_name, job_title, job_description, job_details_parsed, job_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'review') RETURNING id
    `, [
      user.id,
      company_name || "Unknown Company",
      job_title || "Unknown Position",
      description,
      JSON.stringify(jobDetails),
      applicationUrl
    ]);

    console.log("[extension/jobs] Saved job with:", {
      applicationUrl,
      isEasyApply: is_easy_apply,
      sourceUrl: source_url,
    });

    return NextResponse.json({
      success: true,
      job_id: result.rows[0].id,
      message: `${job_title} at ${company_name} saved!`,
    });
  } catch (error) {
    console.error("Extension jobs error:", error);
    // Return more specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      error: "Failed to save job",
      details: errorMessage
    }, { status: 500 });
  }
}
