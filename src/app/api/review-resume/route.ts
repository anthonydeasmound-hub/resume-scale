import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { reviewResume } from "@/lib/gemini-enhanced";
import { z } from "zod";

const inputSchema = z.object({
  bullets: z.array(z.string()).min(1),
  role: z.object({
    title: z.string().min(1),
    company: z.string().min(1),
  }),
  seniority: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(session.user.email!);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { bullets, role, seniority } = parsed.data;

    console.log(`Reviewing ${bullets.length} bullets for ${role.title} at ${role.company}`);

    const review = await reviewResume(bullets, role, seniority);

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error reviewing resume:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to review resume", details: errorMessage },
      { status: 500 }
    );
  }
}
