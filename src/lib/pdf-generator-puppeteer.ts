import puppeteer from 'puppeteer';
import { ResumeData, CoverLetterData, TemplateName } from '@/types/resume';
import { generateProfessionalHTML } from './templates/professional-resume';
import { generateBasicHTML } from './templates/basic-resume';

export async function generateResumePDF(
  data: ResumeData,
  template: TemplateName,
  accentColor: string = '#3D5A80'
): Promise<Buffer> {
  // Generate HTML based on template (always use professional now)
  const html = template === 'professional'
    ? generateProfessionalHTML(data, accentColor)
    : generateBasicHTML(data);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0', // Wait for fonts to load
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function generateCoverLetterPDF(
  data: CoverLetterData,
  template: TemplateName,
  accentColor: string = '#3D5A80'
): Promise<Buffer> {
  // Generate cover letter HTML
  const html = generateCoverLetterHTML(data, template, accentColor);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function generateCoverLetterHTML(data: CoverLetterData, template: TemplateName, accentColor: string = '#3D5A80'): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Always use professional fonts now
  const fontFamily = "'Lora', serif";
  const bodyFont = "'Poppins', sans-serif";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Poppins:wght@400;500&family=DM+Serif+Display&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: ${bodyFont};
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      height: 11in;
      padding: 1in;
    }

    .header {
      margin-bottom: 30px;
    }

    .name {
      font-family: ${fontFamily};
      font-size: 24pt;
      color: ${accentColor};
      margin-bottom: 8px;
    }

    .contact-info {
      font-size: 10pt;
      color: #666;
      line-height: 1.4;
    }

    .date {
      margin: 30px 0;
      font-size: 11pt;
    }

    .salutation {
      margin-bottom: 20px;
      font-size: 11pt;
    }

    .body-paragraph {
      margin-bottom: 16px;
      font-size: 11pt;
      text-align: justify;
    }

    .closing {
      margin-top: 30px;
    }

    .signature {
      margin-top: 40px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="name">${data.contactInfo.name}</div>
      <div class="contact-info">
        ${data.contactInfo.email}<br>
        ${data.contactInfo.phone}<br>
        ${data.contactInfo.location}
      </div>
    </div>

    <div class="date">${today}</div>

    <div class="salutation">Dear Hiring Manager,</div>

    <div class="body-paragraph">${data.opening}</div>
    <div class="body-paragraph">${data.body}</div>
    <div class="body-paragraph">${data.closing}</div>

    <div class="closing">Sincerely,</div>
    <div class="signature">${data.contactInfo.name}</div>
  </div>
</body>
</html>
  `;
}
