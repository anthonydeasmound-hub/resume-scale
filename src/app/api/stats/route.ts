import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({
        resumes_created: 0,
        cover_letters_created: 0,
        jobs_applied: 0,
        rejections: 0,
        interviews: 0,
        offers: 0,
        review_count: 0,
      });
    }

    // Get counts
    const stats = await queryOne<{
      resumes_created: number;
      cover_letters_created: number;
      jobs_applied: number;
      rejections: number;
      interviews: number;
      offers: number;
      review_count: number;
    }>(`
      SELECT
        COUNT(CASE WHEN tailored_resume IS NOT NULL THEN 1 END) as resumes_created,
        COUNT(CASE WHEN cover_letter IS NOT NULL THEN 1 END) as cover_letters_created,
        COUNT(CASE WHEN status = 'applied' OR status = 'interview' OR status = 'rejected' OR status = 'offer' THEN 1 END) as jobs_applied,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejections,
        COUNT(CASE WHEN status = 'interview' THEN 1 END) as interviews,
        COUNT(CASE WHEN status = 'offer' THEN 1 END) as offers,
        COUNT(CASE WHEN status = 'review' AND (reviewed = 0 OR reviewed IS NULL) THEN 1 END) as review_count
      FROM job_applications
      WHERE user_id = $1
    `, [user.id]);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
