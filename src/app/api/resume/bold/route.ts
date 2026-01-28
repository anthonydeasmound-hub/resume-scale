import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { boldAchievements } from "@/lib/gemini";
import { z } from "zod";

const inputSchema = z.object({
  descriptions: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimited = await checkRateLimit(session.user.email);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { descriptions } = parsed.data;

    const boldedDescriptions = await boldAchievements(descriptions);
    return NextResponse.json({ descriptions: boldedDescriptions });
  } catch (error) {
    console.error("Bold achievements error:", error);
    return NextResponse.json(
      { error: "Failed to bold achievements" },
      { status: 500 }
    );
  }
}
