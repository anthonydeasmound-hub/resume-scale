import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";

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

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { job_description, job_title, company_name, company_url, source_url } = body;

    // Description is optional - we can still save the job without it
    const description = job_description || "No description available";

    // Check for duplicate (same company and title for this user)
    const existing = await queryOne<{ id: number }>(
      "SELECT id FROM job_applications WHERE user_id = $1 AND company_name = $2 AND job_title = $3",
      [user.id, company_name || "Unknown Company", job_title || "Unknown Position"]
    );

    if (existing) {
      return NextResponse.json({ error: "Job already saved" }, { status: 409 });
    }

    // Create job application
    const result = await execute(`
      INSERT INTO job_applications (user_id, company_name, job_title, job_description, status)
      VALUES ($1, $2, $3, $4, 'review') RETURNING id
    `, [
      user.id,
      company_name || "Unknown Company",
      job_title || "Unknown Position",
      description
    ]);

    return NextResponse.json({
      success: true,
      job_id: result.rows[0].id,
      message: `${job_title} at ${company_name} saved!`,
    });
  } catch (error) {
    console.error("Extension jobs error:", error);
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 });
  }
}
