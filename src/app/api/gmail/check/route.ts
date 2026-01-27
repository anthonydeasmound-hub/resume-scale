import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchRecentEmails } from "@/lib/gmail";
import { classifyEmailEnhanced } from "@/lib/gemini";
import db, { StageType } from "@/lib/db";

interface JobApplication {
  id: number;
  company_name: string;
  status: string;
  recruiter_name: string | null;
  recruiter_email: string | null;
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
      SELECT id, company_name, status, recruiter_name, recruiter_email FROM job_applications
      WHERE user_id = ? AND status IN ('applied', 'interview')
    `).all(user.id) as JobApplication[];

    if (jobs.length === 0) {
      return NextResponse.json({ message: "No active applications to check", updates: [] });
    }

    const companyNames = jobs.map((j) => j.company_name);

    // Fetch recent emails
    const emails = await fetchRecentEmails(session.accessToken);

    const updates: { company: string; type: string; summary: string; stageCreated?: boolean }[] = [];

    // Classify each email and update job status
    for (const email of emails) {
      const classification = await classifyEmailEnhanced(email, companyNames);

      if (classification.type === "unrelated" || !classification.company || classification.confidence < 0.7) {
        continue;
      }

      // Find matching job
      const matchingJob = jobs.find(
        (j) => j.company_name.toLowerCase() === classification.company?.toLowerCase()
      );

      if (!matchingJob) continue;

      // Check if we've already processed this email (by gmail_message_id if available)
      // For now, use subject + company as a simple dedup
      const existingEmail = db.prepare(`
        SELECT id FROM email_actions
        WHERE job_id = ? AND subject = ? AND direction = 'inbound'
      `).get(matchingJob.id, email.subject);

      if (existingEmail) continue;

      // Record the detected email
      db.prepare(`
        INSERT INTO email_actions (job_id, email_type, direction, subject, body, status, detected_at)
        VALUES (?, ?, 'inbound', ?, ?, 'detected', CURRENT_TIMESTAMP)
      `).run(
        matchingJob.id,
        classification.type,
        email.subject,
        email.snippet
      );

      // Update recruiter info if extracted and not already set
      if (classification.recruiter_name && !matchingJob.recruiter_name) {
        db.prepare(`
          UPDATE job_applications
          SET recruiter_name = ?, recruiter_email = ?, recruiter_title = ?, recruiter_source = 'email', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          classification.recruiter_name,
          classification.recruiter_email || null,
          classification.recruiter_title || null,
          matchingJob.id
        );
      }

      // Determine new status and create interview stage if needed
      let newStatus: string | null = null;
      let stageCreated = false;

      switch (classification.type) {
        case "confirmation":
          // Already applied, no change needed
          break;

        case "rejection":
          newStatus = "rejected";
          // Schedule auto-archive after 24 hours
          db.prepare(`
            UPDATE job_applications
            SET archived_at = datetime('now', '+24 hours'), updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND archived_at IS NULL
          `).run(matchingJob.id);
          break;

        case "interview":
          newStatus = "interview";

          // Create a new dynamic interview stage
          if (classification.interview_details) {
            const details = classification.interview_details;

            // Get next stage number
            const maxStage = db.prepare(`
              SELECT MAX(stage_number) as max_num FROM interview_stages WHERE job_id = ?
            `).get(matchingJob.id) as { max_num: number | null };
            const stageNumber = (maxStage?.max_num || 0) + 1;

            // Map interview type
            const stageType: StageType = details.interview_type || 'other';

            // Insert new stage
            const stageResult = db.prepare(`
              INSERT INTO interview_stages (job_id, stage_number, stage_type, stage_name, status, scheduled_at, source, source_email_id)
              VALUES (?, ?, ?, ?, ?, ?, 'email', ?)
            `).run(
              matchingJob.id,
              stageNumber,
              stageType,
              null, // Will use default name based on type
              details.proposed_datetime ? 'scheduled' : 'pending',
              details.proposed_datetime || null,
              email.subject // Use subject as source reference
            );

            stageCreated = true;

            // If we have datetime info, create a calendar event
            if (details.proposed_datetime) {
              const startTime = new Date(details.proposed_datetime);
              const duration = details.duration_minutes || 60;
              const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

              db.prepare(`
                INSERT INTO calendar_events (job_id, stage_id, title, start_time, end_time, location, meeting_link, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'local')
              `).run(
                matchingJob.id,
                stageResult.lastInsertRowid,
                `Interview - ${matchingJob.company_name}`,
                startTime.toISOString(),
                endTime.toISOString(),
                details.location || null,
                details.meeting_link || null
              );
            }
          } else {
            // No detailed info, still create a pending stage
            const maxStage = db.prepare(`
              SELECT MAX(stage_number) as max_num FROM interview_stages WHERE job_id = ?
            `).get(matchingJob.id) as { max_num: number | null };
            const stageNumber = (maxStage?.max_num || 0) + 1;

            db.prepare(`
              INSERT INTO interview_stages (job_id, stage_number, stage_type, status, source)
              VALUES (?, ?, 'other', 'pending', 'email')
            `).run(matchingJob.id, stageNumber);

            stageCreated = true;
          }
          break;

        case "offer":
          newStatus = "offer";
          break;
      }

      if (newStatus) {
        db.prepare(`
          UPDATE job_applications
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newStatus, matchingJob.id);

        updates.push({
          company: classification.company,
          type: classification.type,
          summary: classification.summary,
          stageCreated,
        });
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
