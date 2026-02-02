import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, queryAll, execute } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

export interface JobContact {
  id: number;
  job_id: number;
  name: string;
  email: string | null;
  title: string | null;
  phone: string | null;
  linkedin: string | null;
  company: string | null;
  notes: string | null;
  is_primary: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/jobs/[id]/contacts - Get all contacts for a job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobIdOrError = parseIdParam(id);
  if (jobIdOrError instanceof NextResponse) return jobIdOrError;
  const jobId = jobIdOrError;

  // Verify job belongs to user
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const contacts = await queryAll<JobContact>(`
    SELECT * FROM job_contacts
    WHERE job_id = $1
    ORDER BY is_primary DESC, created_at ASC
  `, [jobId]);

  return NextResponse.json(contacts);
}

// POST /api/jobs/[id]/contacts - Add a contact to a job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const jobIdOrError = parseIdParam(id);
  if (jobIdOrError instanceof NextResponse) return jobIdOrError;
  const jobId = jobIdOrError;

  // Verify job belongs to user
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, email, title, phone, linkedin, company, notes, is_primary, source } = body as {
    name: string;
    email?: string;
    title?: string;
    phone?: string;
    linkedin?: string;
    company?: string;
    notes?: string;
    is_primary?: boolean;
    source?: string;
  };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
  }

  try {
    // If setting as primary, unset any existing primary contact
    if (is_primary) {
      await execute(`
        UPDATE job_contacts SET is_primary = FALSE WHERE job_id = $1 AND is_primary = TRUE
      `, [jobId]);
    }

    const result = await execute(`
      INSERT INTO job_contacts (job_id, name, email, title, phone, linkedin, company, notes, is_primary, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
    `, [jobId, name.trim(), email || null, title || null, phone || null, linkedin || null, company || null, notes || null, is_primary || false, source || 'manual']);

    // Update last_activity_at for the job
    await execute(`
      UPDATE job_applications
      SET last_activity_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `, [jobId]);

    const newContact = await queryOne<JobContact>("SELECT * FROM job_contacts WHERE id = $1", [result.rows[0].id]);

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error("Create contact error:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
