import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCoverLetterPDF } from '@/lib/pdf-generator-puppeteer';
import { CoverLetterData, TemplateName } from '@/types/resume';
import { z } from 'zod';

const inputSchema = z.object({
  data: z.record(z.string(), z.any()),
  template: z.string().optional(),
  accentColor: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { data, template, accentColor } = parsed.data as {
      data: CoverLetterData;
      template: TemplateName;
      accentColor?: string;
    };

    // Default to professional template
    const templateName = template || 'professional';
    const color = accentColor || '#3D5A80';


    const pdfBuffer = await generateCoverLetterPDF(data, templateName, color);

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cover-letter-${templateName}-${Date.now()}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error('Cover letter PDF generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate cover letter PDF';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
