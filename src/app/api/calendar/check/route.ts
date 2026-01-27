import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchUpcomingEvents } from "@/lib/calendar";
import { classifyCalendarEvent } from "@/lib/gemini";
import db from "@/lib/db";

interface JobApplication {
  id: number;
  company_name: string;
  status: string;
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized or missing Calendar access" },
      { status: 401 }
    );
  }

  try {
    const user = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all active job applications
    const jobs = db
      .prepare(
        `
      SELECT id, company_name, status FROM job_applications
      WHERE user_id = ? AND status IN ('applied', 'interview')
    `
      )
      .all(user.id) as JobApplication[];

    if (jobs.length === 0) {
      return NextResponse.json({
        message: "No active applications to check",
        updates: [],
      });
    }

    const companyNames = jobs.map((j) => j.company_name);

    // Fetch upcoming calendar events
    const events = await fetchUpcomingEvents(session.accessToken);

    const updates: {
      company: string;
      type: string;
      summary: string;
      startTime: string;
      title: string;
    }[] = [];

    // Classify each event
    for (const event of events) {
      const classification = await classifyCalendarEvent(
        {
          title: event.title,
          description: event.description,
          location: event.location,
          attendees: event.attendees,
        },
        companyNames
      );

      if (
        classification.type === "unrelated" ||
        !classification.company ||
        classification.confidence < 0.7
      ) {
        continue;
      }

      // Find matching job
      const matchingJob = jobs.find(
        (j) =>
          j.company_name.toLowerCase() === classification.company?.toLowerCase()
      );

      if (!matchingJob) continue;

      // For interviews, update job status if not already in interview
      if (classification.type === "interview" && matchingJob.status !== "interview") {
        db.prepare(`
          UPDATE job_applications
          SET status = 'interview', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(matchingJob.id);
      }

      updates.push({
        company: classification.company,
        type: classification.type,
        summary: classification.summary,
        startTime: event.startTime,
        title: event.title,
      });
    }

    return NextResponse.json({
      message: `Checked ${events.length} calendar events`,
      updates,
    });
  } catch (error) {
    console.error("Calendar check error:", error);
    return NextResponse.json(
      { error: "Failed to check calendar" },
      { status: 500 }
    );
  }
}
