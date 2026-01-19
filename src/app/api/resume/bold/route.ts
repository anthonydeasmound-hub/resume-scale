import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { boldAchievements } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { descriptions } = await request.json();

    if (!descriptions || !Array.isArray(descriptions)) {
      return NextResponse.json(
        { error: "Descriptions array is required" },
        { status: 400 }
      );
    }

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
