import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateResumePDF, generatePDFFromTemplateHTML } from '@/lib/pdf-generator-puppeteer';
import { DEFAULT_TEMPLATE_OPTIONS, TemplateOptions } from '@/lib/templates';
import { ResumeData, TemplateName } from '@/types/resume';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, template, accentColor, templateId, templateOptions } = await request.json() as {
      data: ResumeData;
      template?: TemplateName;
      accentColor?: string;
      templateId?: string;
      templateOptions?: Partial<TemplateOptions>;
    };

    if (!data) {
      return NextResponse.json(
        { error: 'Missing required field: data' },
        { status: 400 }
      );
    }

    const color = accentColor || '#2563eb';
    let pdfBuffer: Buffer;

    if (templateId) {
      // New template system
      const options = {
        ...DEFAULT_TEMPLATE_OPTIONS,
        ...templateOptions,
        accentColor: color,
      };
      console.log('Generating PDF with new template:', templateId, 'color:', color);
      pdfBuffer = await generatePDFFromTemplateHTML(data, templateId, options);
    } else {
      // Legacy path for backward compatibility
      const templateName = template || 'professional';
      console.log('Generating PDF with legacy template:', templateName, 'color:', color);
      pdfBuffer = await generateResumePDF(data, templateName, color);
    }

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${templateId || template || 'professional'}-${Date.now()}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
