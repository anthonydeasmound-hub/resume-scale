import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { parseIdParam } from "@/lib/params";

interface JobContact {
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

// PATCH /api/jobs/[id]/contacts/[contactId] - Update a contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, contactId } = await params;
  const jobIdOrError = parseIdParam(id);
  if (jobIdOrError instanceof NextResponse) return jobIdOrError;
  const jobId = jobIdOrError;

  const contactIdOrError = parseIdParam(contactId);
  if (contactIdOrError instanceof NextResponse) return contactIdOrError;
  const parsedContactId = contactIdOrError;

  // Verify job belongs to user
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Verify contact belongs to job
  const existingContact = await queryOne<JobContact>("SELECT * FROM job_contacts WHERE id = $1 AND job_id = $2", [parsedContactId, jobId]);
  if (!existingContact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, email, title, phone, linkedin, company, notes, is_primary } = body as {
    name?: string;
    email?: string;
    title?: string;
    phone?: string;
    linkedin?: string;
    company?: string;
    notes?: string;
    is_primary?: boolean;
  };

  try {
    // If setting as primary, unset any existing primary contact
    if (is_primary && !existingContact.is_primary) {
      await execute(`
        UPDATE job_contacts SET is_primary = FALSE WHERE job_id = $1 AND is_primary = TRUE
      `, [jobId]);
    }

    await execute(`
      UPDATE job_contacts
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        title = COALESCE($3, title),
        phone = COALESCE($4, phone),
        linkedin = COALESCE($5, linkedin),
        company = COALESCE($6, company),
        notes = COALESCE($7, notes),
        is_primary = COALESCE($8, is_primary),
        updated_at = NOW()
      WHERE id = $9
    `, [
      name || null,
      email !== undefined ? email : null,
      title !== undefined ? title : null,
      phone !== undefined ? phone : null,
      linkedin !== undefined ? linkedin : null,
      company !== undefined ? company : null,
      notes !== undefined ? notes : null,
      is_primary !== undefined ? is_primary : null,
      parsedContactId
    ]);

    const updatedContact = await queryOne<JobContact>("SELECT * FROM job_contacts WHERE id = $1", [parsedContactId]);

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error("Update contact error:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

// DELETE /api/jobs/[id]/contacts/[contactId] - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, contactId } = await params;
  const jobIdOrError = parseIdParam(id);
  if (jobIdOrError instanceof NextResponse) return jobIdOrError;
  const jobId = jobIdOrError;

  const contactIdOrError = parseIdParam(contactId);
  if (contactIdOrError instanceof NextResponse) return contactIdOrError;
  const parsedContactId = contactIdOrError;

  // Verify job belongs to user
  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await queryOne<{ id: number }>("SELECT id FROM job_applications WHERE id = $1 AND user_id = $2", [jobId, user.id]);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Verify contact belongs to job
  const existingContact = await queryOne<{ id: number }>("SELECT id FROM job_contacts WHERE id = $1 AND job_id = $2", [parsedContactId, jobId]);
  if (!existingContact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  try {
    await execute("DELETE FROM job_contacts WHERE id = $1", [parsedContactId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contact error:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
