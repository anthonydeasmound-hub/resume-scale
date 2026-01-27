import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateTemplateHTML, DEFAULT_TEMPLATE_OPTIONS, TemplateOptions } from "@/lib/templates";
import { ResumeData } from "@/types/resume";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { data, accentColor, templateId, templateOptions } = body as {
      data: ResumeData;
      accentColor?: string;
      templateId?: string;
      templateOptions?: Partial<TemplateOptions>;
    };

    if (!data) {
      return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
    }

    // Merge options with defaults
    const options: TemplateOptions = {
      ...DEFAULT_TEMPLATE_OPTIONS,
      ...templateOptions,
      accentColor: accentColor || templateOptions?.accentColor || DEFAULT_TEMPLATE_OPTIONS.accentColor,
    };

    // Generate HTML using the selected template (default to executive)
    const html = generateTemplateHTML(templateId || 'executive', data, options);

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
