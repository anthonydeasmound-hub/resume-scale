import { NextRequest, NextResponse } from "next/server";
import { queryAll, queryOne, execute } from "@/lib/db";
import { sendEmail } from "@/lib/gmail";

// This endpoint is called by Vercel Cron daily to:
// 1. Send due follow-up emails
// 2. Auto-archive jobs past their archive date

interface FollowUpJob {
  follow_up_id: number;
  job_id: number;
  contact_id: number | null;
  enabled: boolean;
  email_1_subject: string | null;
  email_1_body: string | null;
  email_1_scheduled: string | null;
  email_1_sent_at: string | null;
  email_2_subject: string | null;
  email_2_body: string | null;
  email_2_scheduled: string | null;
  email_2_sent_at: string | null;
  email_3_subject: string | null;
  email_3_body: string | null;
  email_3_scheduled: string | null;
  email_3_sent_at: string | null;
  auto_archive_date: string | null;
  archived_at: string | null;
  user_id: number;
  user_email: string;
  contact_email: string | null;
  contact_name: string | null;
  company_name: string;
  job_title: string;
}

interface UserToken {
  access_token: string;
  refresh_token: string | null;
}

export async function POST(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const results = {
    emailsSent: 0,
    emailsFailed: 0,
    jobsArchived: 0,
    errors: [] as string[],
  };

  try {
    // Get all enabled follow-ups with job and user info
    const followUps = await queryAll<FollowUpJob>(`
      SELECT
        f.id as follow_up_id,
        f.job_id,
        f.contact_id,
        f.enabled,
        f.email_1_subject, f.email_1_body, f.email_1_scheduled, f.email_1_sent_at,
        f.email_2_subject, f.email_2_body, f.email_2_scheduled, f.email_2_sent_at,
        f.email_3_subject, f.email_3_body, f.email_3_scheduled, f.email_3_sent_at,
        f.auto_archive_date, f.archived_at,
        j.user_id,
        u.email as user_email,
        c.email as contact_email,
        c.name as contact_name,
        j.company_name,
        j.job_title
      FROM job_follow_ups f
      JOIN job_applications j ON f.job_id = j.id
      JOIN users u ON j.user_id = u.id
      LEFT JOIN job_contacts c ON f.contact_id = c.id
      WHERE f.enabled = true
        AND j.status NOT IN ('rejected', 'accepted', 'archived')
    `);

    for (const followUp of followUps) {
      // Skip if no contact email
      if (!followUp.contact_email) {
        continue;
      }

      // Get user's access token from NextAuth account
      // Note: This requires storing tokens in the database
      // For now, we'll skip if we can't get a token
      const account = await queryOne<UserToken>(`
        SELECT access_token, refresh_token
        FROM accounts
        WHERE "userId" = $1 AND provider = 'google'
      `, [followUp.user_id]);

      if (!account?.access_token) {
        results.errors.push(`No access token for user ${followUp.user_id}`);
        continue;
      }

      // Check and send each email
      for (let emailNum = 1; emailNum <= 3; emailNum++) {
        const subject = followUp[`email_${emailNum}_subject` as keyof FollowUpJob] as string | null;
        const body = followUp[`email_${emailNum}_body` as keyof FollowUpJob] as string | null;
        const scheduled = followUp[`email_${emailNum}_scheduled` as keyof FollowUpJob] as string | null;
        const sentAt = followUp[`email_${emailNum}_sent_at` as keyof FollowUpJob] as string | null;

        // Check if due and not sent
        if (subject && body && scheduled && scheduled <= today && !sentAt) {
          const result = await sendEmail(
            account.access_token,
            followUp.user_email,
            {
              to: followUp.contact_email,
              subject,
              body,
            }
          );

          if (result.success) {
            // Mark as sent
            await execute(
              `UPDATE job_follow_ups SET email_${emailNum}_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
              [followUp.follow_up_id]
            );
            results.emailsSent++;

            // Record in email_actions
            await execute(`
              INSERT INTO email_actions (job_id, email_type, direction, subject, body, recipient_email, status, sent_at)
              VALUES ($1, 'follow_up', 'outbound', $2, $3, $4, 'sent', NOW())
            `, [followUp.job_id, subject, body, followUp.contact_email]);
          } else {
            results.emailsFailed++;
            results.errors.push(
              `Failed to send email ${emailNum} for job ${followUp.job_id}: ${result.error}`
            );
          }
        }
      }

      // Check for auto-archive
      if (
        followUp.auto_archive_date &&
        followUp.auto_archive_date <= today &&
        !followUp.archived_at
      ) {
        await execute(`
          UPDATE job_applications
          SET status = 'archived', archived_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [followUp.job_id]);

        await execute(`
          UPDATE job_follow_ups
          SET archived_at = NOW(), updated_at = NOW()
          WHERE id = $1
        `, [followUp.follow_up_id]);

        results.jobsArchived++;
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      ...results,
    });
  } catch (error) {
    console.error("Cron send-follow-ups error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
