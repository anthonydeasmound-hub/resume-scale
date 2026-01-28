import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { enhanceBulletWithExamples } from "@/lib/gemini-enhanced";
import { z } from "zod";

const inputSchema = z.object({
  bullet: z.string().min(1).max(50000),
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
    const { bullet, role, seniority } = parsed.data;


    const enhanced = await enhanceBulletWithExamples(bullet, role, seniority);

    return NextResponse.json(enhanced);
  } catch (error) {
    console.error("Error enhancing bullet:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to enhance bullet point", details: errorMessage },
      { status: 500 }
    );
  }
}
