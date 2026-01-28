import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { fetchRecentEmails } from "@/lib/gmail";
import { classifyEmailEnhanced } from "@/lib/gemini";
import { queryOne, queryAll, execute, StageType } from "@/lib/db";

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

  const rateLimited = await checkRateLimit(session.user.email);
  if (rateLimited) return rateLimited;

  try {
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all job applications
    const jobs = await queryAll<JobApplication>(`
      SELECT id, company_name, status, recruiter_name, recruiter_email FROM job_applications
      WHERE user_id = $1 AND status IN ('applied', 'interview')
    `, [user.id]);

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
      const existingEmail = await queryOne<{ id: number }>(`
        SELECT id FROM email_actions
        WHERE job_id = $1 AND subject = $2 AND direction = 'inbound'
      `, [matchingJob.id, email.subject]);

      if (existingEmail) continue;

      // Record the detected email
      await execute(`
        INSERT INTO email_actions (job_id, email_type, direction, subject, body, status, detected_at)
        VALUES ($1, $2, 'inbound', $3, $4, 'detected', NOW())
      `, [
        matchingJob.id,
        classification.type,
        email.subject,
        email.snippet
      ]);

      // Update recruiter info if extracted and not already set
      if (classification.recruiter_name && !matchingJob.recruiter_name) {
        await execute(`
          UPDATE job_applications
          SET recruiter_name = $1, recruiter_email = $2, recruiter_title = $3, recruiter_source = 'email', updated_at = NOW()
          WHERE id = $4
        `, [
          classification.recruiter_name,
          classification.recruiter_email || null,
          classification.recruiter_title || null,
          matchingJob.id
        ]);
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
          await execute(`
            UPDATE job_applications
            SET archived_at = NOW() + INTERVAL '24 hours', updated_at = NOW()
            WHERE id = $1 AND archived_at IS NULL
          `, [matchingJob.id]);
          break;

        case "interview":
          newStatus = "interview";

          // Create a new dynamic interview stage
          if (classification.interview_details) {
            const details = classification.interview_details;

            // Get next stage number
            const maxStage = await queryOne<{ max_num: number | null }>(`
              SELECT MAX(stage_number) as max_num FROM interview_stages WHERE job_id = $1
            `, [matchingJob.id]);
            const stageNumber = (maxStage?.max_num || 0) + 1;

            // Map interview type
            const stageType: StageType = details.interview_type || 'other';

            // Insert new stage
            const stageResult = await execute(`
              INSERT INTO interview_stages (job_id, stage_number, stage_type, stage_name, status, scheduled_at, source, source_email_id)
              VALUES ($1, $2, $3, $4, $5, $6, 'email', $7) RETURNING id
            `, [
              matchingJob.id,
              stageNumber,
              stageType,
              null, // Will use default name based on type
              details.proposed_datetime ? 'scheduled' : 'pending',
              details.proposed_datetime || null,
              email.subject // Use subject as source reference
            ]);

            stageCreated = true;

            // If we have datetime info, create a calendar event
            if (details.proposed_datetime) {
              const startTime = new Date(details.proposed_datetime);
              const duration = details.duration_minutes || 60;
              const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

              await execute(`
                INSERT INTO calendar_events (job_id, stage_id, title, start_time, end_time, location, meeting_link, sync_status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'local')
              `, [
                matchingJob.id,
                stageResult.rows[0].id,
                `Interview - ${matchingJob.company_name}`,
                startTime.toISOString(),
                endTime.toISOString(),
                details.location || null,
                details.meeting_link || null
              ]);
            }
          } else {
            // No detailed info, still create a pending stage
            const maxStage = await queryOne<{ max_num: number | null }>(`
              SELECT MAX(stage_number) as max_num FROM interview_stages WHERE job_id = $1
            `, [matchingJob.id]);
            const stageNumber = (maxStage?.max_num || 0) + 1;

            await execute(`
              INSERT INTO interview_stages (job_id, stage_number, stage_type, status, source)
              VALUES ($1, $2, 'other', 'pending', 'email')
            `, [matchingJob.id, stageNumber]);

            stageCreated = true;
          }
          break;

        case "offer":
          newStatus = "offer";
          break;
      }

      if (newStatus) {
        await execute(`
          UPDATE job_applications
          SET status = $1, updated_at = NOW()
          WHERE id = $2
        `, [newStatus, matchingJob.id]);

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
