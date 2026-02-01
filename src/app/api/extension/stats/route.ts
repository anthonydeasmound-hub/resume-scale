import { NextRequest, NextResponse } from "next/server";
import { queryOne, queryAll, execute, UserSettings } from "@/lib/db";

interface TokenUser {
  user_id: number;
  email: string;
  name: string;
}

async function validateToken(request: NextRequest): Promise<TokenUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const tokenRecord = await queryOne<TokenUser>(
    `SELECT et.user_id, u.email, u.name
     FROM extension_tokens et
     JOIN users u ON et.user_id = u.id
     WHERE et.token = $1 AND (et.expires_at IS NULL OR et.expires_at > NOW())`,
    [token]
  );

  return tokenRecord || null;
}

export async function GET(request: NextRequest) {
  const user = await validateToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user settings (create if doesn't exist)
    let settings = await queryOne<UserSettings>(
      "SELECT * FROM user_settings WHERE user_id = $1",
      [user.user_id]
    );

    if (!settings) {
      // Create default settings
      await execute(
        `INSERT INTO user_settings (user_id) VALUES ($1)`,
        [user.user_id]
      );
      settings = await queryOne<UserSettings>(
        "SELECT * FROM user_settings WHERE user_id = $1",
        [user.user_id]
      );
    }

    // Default values if settings still doesn't exist
    const weeklyJobsGoal = settings?.weekly_jobs_goal ?? 10;
    const weeklyReviewsGoal = settings?.weekly_reviews_goal ?? 5;
    const weeklyApplicationsGoal = settings?.weekly_applications_goal ?? 5;
    const showWelcomeCard = settings?.show_welcome_card ?? 1;

    // Calculate start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Calculate end of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get weekly stats
    const stats = await queryOne<{
      jobs_saved: string;
      resumes_reviewed: string;
      applications_sent: string;
    }>(
      `SELECT
        COUNT(*) FILTER (WHERE created_at >= $2 AND created_at <= $3) as jobs_saved,
        COUNT(*) FILTER (WHERE created_at >= $2 AND created_at <= $3 AND tailored_resume IS NOT NULL) as resumes_reviewed,
        COUNT(*) FILTER (WHERE created_at >= $2 AND created_at <= $3 AND status IN ('applied', 'interview', 'offer')) as applications_sent
      FROM job_applications
      WHERE user_id = $1`,
      [user.user_id, weekStart.toISOString(), weekEnd.toISOString()]
    );

    // Format week range string
    const formatDate = (d: Date) => {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const weekRange = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;

    return NextResponse.json({
      weekRange,
      stats: {
        jobsSaved: parseInt(stats?.jobs_saved || "0", 10),
        resumesReviewed: parseInt(stats?.resumes_reviewed || "0", 10),
        applicationsSent: parseInt(stats?.applications_sent || "0", 10),
      },
      goals: {
        jobsSaved: weeklyJobsGoal,
        resumesReviewed: weeklyReviewsGoal,
        applicationsSent: weeklyApplicationsGoal,
      },
      showWelcomeCard: showWelcomeCard === 1,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Extension stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

// Update user settings/goals
export async function PATCH(request: NextRequest) {
  const user = await validateToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { weeklyJobsGoal, weeklyReviewsGoal, weeklyApplicationsGoal, showWelcomeCard } = body;

    // Ensure settings row exists
    await execute(
      `INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [user.user_id]
    );

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (weeklyJobsGoal !== undefined) {
      updates.push(`weekly_jobs_goal = $${paramIndex++}`);
      values.push(weeklyJobsGoal);
    }
    if (weeklyReviewsGoal !== undefined) {
      updates.push(`weekly_reviews_goal = $${paramIndex++}`);
      values.push(weeklyReviewsGoal);
    }
    if (weeklyApplicationsGoal !== undefined) {
      updates.push(`weekly_applications_goal = $${paramIndex++}`);
      values.push(weeklyApplicationsGoal);
    }
    if (showWelcomeCard !== undefined) {
      updates.push(`show_welcome_card = $${paramIndex++}`);
      values.push(showWelcomeCard ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(user.user_id);
      await execute(
        `UPDATE user_settings SET ${updates.join(", ")} WHERE user_id = $${paramIndex}`,
        values
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update extension settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
