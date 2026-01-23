import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reviewResume } from "@/lib/gemini-enhanced";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bullets, role, seniority } = body;

    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty bullets array" },
        { status: 400 }
      );
    }

    if (!role?.title || !role?.company) {
      return NextResponse.json(
        { error: "Missing role information (title and company required)" },
        { status: 400 }
      );
    }

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
