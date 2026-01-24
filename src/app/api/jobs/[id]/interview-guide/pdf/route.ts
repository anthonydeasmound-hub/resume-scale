import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db, { InterviewGuide } from "@/lib/db";
import { generateInterviewGuidePDF } from "@/lib/pdf-generator-puppeteer";

// GET - Download interview guide as PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const jobId = parseInt(id);

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const job = db.prepare(`
      SELECT company_name, job_title, interview_guide, resume_color
      FROM job_applications WHERE id = ? AND user_id = ?
    `).get(jobId, user.id) as {
      company_name: string;
      job_title: string;
      interview_guide: string | null;
      resume_color: string;
    } | undefined;

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.interview_guide) {
      return NextResponse.json({ error: "Interview guide not generated yet" }, { status: 400 });
    }

    const guide = JSON.parse(job.interview_guide) as InterviewGuide;

    const pdfBuffer = await generateInterviewGuidePDF(
      guide,
      job.job_title,
      job.company_name,
      job.resume_color || "#3D5A80"
    );

    const filename = `Interview_Guide_${job.company_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Generate interview guide PDF error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
