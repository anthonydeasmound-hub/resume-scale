import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import db from "@/lib/db";
import { generateThankYouEmail, generateFollowUpEmail } from "@/lib/gemini";
import { z } from "zod";

const inputSchema = z.object({
  email_type: z.enum(["thank_you", "follow_up"]),
  stage_id: z.number().optional(),
  interviewer_names: z.array(z.string()).optional(),
  interview_type: z.string().max(500).optional(),
  notes: z.string().max(50000).optional(),
});

// POST /api/jobs/[id]/emails/generate - Generate email draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await checkRateLimit(session.user.email);
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const jobId = parseInt(id);

  // Verify job belongs to user
  const user = db.prepare("SELECT id, name FROM users WHERE email = ?").get(session.user.email) as { id: number; name: string | null } | undefined;
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = db.prepare(`
    SELECT id, company_name, job_title, recruiter_name, recruiter_email, date_applied
    FROM job_applications
    WHERE id = ? AND user_id = ?
  `).get(jobId, user.id) as {
    id: number;
    company_name: string;
    job_title: string;
    recruiter_name: string | null;
    recruiter_email: string | null;
    date_applied: string | null;
  } | undefined;

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { email_type, stage_id, interviewer_names, interview_type, notes } = parsed.data;

  const candidateName = user.name || session.user.email.split('@')[0];

  let generatedEmail;

  if (email_type === 'thank_you') {
    generatedEmail = await generateThankYouEmail(
      job.company_name,
      job.job_title,
      interviewer_names || [],
      interview_type || 'interview',
      candidateName,
      notes
    );
  } else {
    // follow_up
    const lastContact = job.date_applied || new Date().toISOString();
    generatedEmail = await generateFollowUpEmail(
      job.company_name,
      job.job_title,
      lastContact,
      candidateName,
      job.recruiter_name || undefined,
      notes
    );
  }

  // Create a draft email action
  const result = db.prepare(`
    INSERT INTO email_actions (job_id, stage_id, email_type, direction, subject, body, recipient_email, status)
    VALUES (?, ?, ?, 'outbound', ?, ?, ?, 'draft')
  `).run(
    jobId,
    stage_id || null,
    email_type,
    generatedEmail.subject,
    generatedEmail.body,
    job.recruiter_email || null
  );

  const newEmail = db.prepare("SELECT * FROM email_actions WHERE id = ?").get(result.lastInsertRowid);

  return NextResponse.json({
    email: newEmail,
    generated: generatedEmail,
  }, { status: 201 });
}
