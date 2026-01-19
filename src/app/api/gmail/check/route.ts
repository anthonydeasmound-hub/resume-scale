import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchRecentEmails } from "@/lib/gmail";
import { classifyEmail } from "@/lib/gemini";
import db from "@/lib/db";

interface JobApplication {
  id: number;
  company_name: string;
  status: string;
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized or missing Gmail access" }, { status: 401 });
  }

  try {
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all job applications
    const jobs = db.prepare(`
      SELECT id, company_name, status FROM job_applications
      WHERE user_id = ? AND status IN ('applied', 'interview')
    `).all(user.id) as JobApplication[];

    if (jobs.length === 0) {
      return NextResponse.json({ message: "No active applications to check", updates: [] });
    }

    const companyNames = jobs.map((j) => j.company_name);

    // Fetch recent emails
    const emails = await fetchRecentEmails(session.accessToken);

    const updates: { company: string; type: string; summary: string }[] = [];

    // Classify each email and update job status
    for (const email of emails) {
      const classification = await classifyEmail(email, companyNames);

      if (classification.type === "unrelated" || !classification.company || classification.confidence < 0.7) {
        continue;
      }

      // Find matching job
      const matchingJob = jobs.find(
        (j) => j.company_name.toLowerCase() === classification.company?.toLowerCase()
      );

      if (!matchingJob) continue;

      // Determine new status
      let newStatus: string | null = null;
      let interviewUpdate: Record<string, string> = {};

      switch (classification.type) {
        case "confirmation":
          // Already applied, no change needed
          break;
        case "rejection":
          newStatus = "rejected";
          break;
        case "interview":
          newStatus = "interview";
          // Find next empty interview slot
          const job = db.prepare("SELECT * FROM job_applications WHERE id = ?").get(matchingJob.id) as Record<string, string | null>;
          for (let i = 1; i <= 5; i++) {
            if (!job[`interview_${i}`]) {
              interviewUpdate[`interview_${i}`] = "scheduled";
              break;
            }
          }
          break;
        case "offer":
          newStatus = "offer";
          break;
      }

      if (newStatus || Object.keys(interviewUpdate).length > 0) {
        const updateFields: string[] = [];
        const values: (string | number)[] = [];

        if (newStatus) {
          updateFields.push("status = ?");
          values.push(newStatus);
        }

        for (const [key, value] of Object.entries(interviewUpdate)) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }

        if (updateFields.length > 0) {
          updateFields.push("updated_at = CURRENT_TIMESTAMP");
          values.push(matchingJob.id);

          db.prepare(`
            UPDATE job_applications
            SET ${updateFields.join(", ")}
            WHERE id = ?
          `).run(...values);

          updates.push({
            company: classification.company,
            type: classification.type,
            summary: classification.summary,
          });
        }
      }
    }

    return NextResponse.json({
      message: `Checked ${emails.length} emails`,
      updates,
    });
  } catch (error) {
    console.error("Gmail check error:", error);
    return NextResponse.json({ error: "Failed to check emails" }, { status: 500 });
  }
}
