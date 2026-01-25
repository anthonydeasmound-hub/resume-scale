import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateProfessionalHTML } from "@/lib/templates/professional-resume";
import { ResumeData } from "@/types/resume";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, accentColor } = await request.json() as {
      data: ResumeData;
      accentColor?: string;
    };

    if (!data) {
      return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
    }

    const html = generateProfessionalHTML(data, accentColor || "#3D5A80");

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating preview HTML:", error);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
