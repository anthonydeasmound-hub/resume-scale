import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { enhanceBulletWithExamples } from "@/lib/gemini-enhanced";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bullet, role, seniority } = body;

    if (!bullet) {
      return NextResponse.json(
        { error: "Missing bullet point to enhance" },
        { status: 400 }
      );
    }

    if (!role?.title || !role?.company) {
      return NextResponse.json(
        { error: "Missing role information (title and company required)" },
        { status: 400 }
      );
    }

    console.log(`Enhancing bullet for ${role.title} at ${role.company}`);

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
