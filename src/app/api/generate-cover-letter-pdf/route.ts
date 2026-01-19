import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCoverLetterPDF } from '@/lib/pdf-generator-puppeteer';
import { CoverLetterData, TemplateName } from '@/types/resume';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, template, accentColor } = await request.json() as {
      data: CoverLetterData;
      template: TemplateName;
      accentColor?: string;
    };

    if (!data) {
      return NextResponse.json(
        { error: 'Missing required field: data' },
        { status: 400 }
      );
    }

    // Default to professional template
    const templateName = template || 'professional';
    const color = accentColor || '#3D5A80';

    console.log('Generating cover letter PDF with template:', templateName, 'color:', color);

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
