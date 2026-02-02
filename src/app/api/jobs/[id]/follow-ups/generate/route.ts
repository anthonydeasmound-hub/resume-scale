import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { parseIdParam } from "@/lib/params";
import { callAI } from "@/lib/gemini";

interface JobInfo {
  id: number;
  company_name: string;
  job_title: string;
  date_applied: string | null;
}

interface ContactInfo {
  name: string;
  email: string;
  title: string | null;
}

interface UserInfo {
  name: string;
  email: string;
}

// POST /api/jobs/[id]/follow-ups/generate - Generate AI follow-up emails
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

  // Get user info
  const user = await queryOne<UserInfo & { id: number }>(
    "SELECT id, email FROM users WHERE email = $1",
    [session.user.email]
  );
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get user's name from primary resume
  const masterResume = await queryOne<{ contact_info: string }>(
    "SELECT contact_info FROM resumes WHERE user_id = $1 AND is_primary = TRUE ORDER BY id DESC LIMIT 1",
    [user.id]
  );

  let userName = session.user.name || "Job Seeker";
  if (masterResume?.contact_info) {
    try {
      const contactInfo = JSON.parse(masterResume.contact_info);
      userName = contactInfo.name || userName;
    } catch (e) {
      // Use default
    }
  }

  // Get job info
  const job = await queryOne<JobInfo>(
    "SELECT id, company_name, job_title, date_applied FROM job_applications WHERE id = $1 AND user_id = $2",
    [jobId, user.id]
  );
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Get contact info from request body
  const body = await request.json();
  const { contact_id } = body;

  let contact: ContactInfo | null = null;
  if (contact_id) {
    const contactResult = await queryOne<ContactInfo>(
      "SELECT name, email, title FROM job_contacts WHERE id = $1 AND job_id = $2",
      [contact_id, jobId]
    );
    contact = contactResult || null;
  }

  const recruiterName = contact?.name || "Hiring Team";
  const recruiterTitle = contact?.title || "";

  try {
    const prompt = `Generate 3 professional follow-up emails for a job application.

Context:
- Applicant Name: ${userName}
- Company: ${job.company_name}
- Position: ${job.job_title}
- Recruiter/Contact Name: ${recruiterName}
- Recruiter Title: ${recruiterTitle}
- Application Date: ${job.date_applied || "recently"}

Generate 3 emails with increasing urgency but always professional:

Email 1 (Week 1 - Friendly check-in):
- Brief, friendly tone
- Express continued interest
- Ask if there are any updates

Email 2 (Week 2 - Polite reminder):
- Acknowledge they're busy
- Reiterate enthusiasm for the role
- Mention specific value you'd bring

Email 3 (Week 3 - Final follow-up):
- Respectful final check-in
- Express understanding if they've moved forward
- Leave door open for future opportunities

For each email, provide:
1. Subject line (concise, professional)
2. Body (3-4 short paragraphs, professional but personable)

Sign off as "${userName}" (no contact info needed).

Return as JSON in this exact format:
{
  "email_1": {
    "subject": "...",
    "body": "..."
  },
  "email_2": {
    "subject": "...",
    "body": "..."
  },
  "email_3": {
    "subject": "...",
    "body": "..."
  }
}`;

    const response = await callAI(prompt);

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const emails = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      emails,
      context: {
        userName,
        companyName: job.company_name,
        jobTitle: job.job_title,
        recruiterName,
      },
    });
  } catch (error) {
    console.error("Generate follow-up emails error:", error);
    return NextResponse.json(
      { error: "Failed to generate emails" },
      { status: 500 }
    );
  }
}
