import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { ResumeData, CoverLetterData, TemplateName } from '@/types/resume';
import { generateProfessionalHTML } from './templates/professional-resume';
import { generateBasicHTML } from './templates/basic-resume';
import { generateInterviewGuideHTML } from './templates/interview-guide';
import { InterviewGuide } from './db';
import { generateTemplateHTML, TemplateOptions } from './templates';

async function launchBrowser() {
  const isLocal = !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL;

  if (isLocal) {
    // Local development: use system Chrome
    const possiblePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ];
    let executablePath: string | undefined;
    for (const p of possiblePaths) {
      try {
        const { accessSync } = require('fs');
        accessSync(p);
        executablePath = p;
        break;
      } catch {
        // not found, try next
      }
    }
    return puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  // Production (Vercel / AWS Lambda): use @sparticuz/chromium
  return puppeteer.launch({
    headless: true,
    executablePath: await chromium.executablePath(),
    args: chromium.args,
  });
}

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
  const browser = await launchBrowser();

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

  const browser = await launchBrowser();

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

export async function generateInterviewGuidePDF(
  guide: InterviewGuide,
  jobTitle: string,
  companyName: string,
  accentColor: string = '#3D5A80'
): Promise<Buffer> {
  const html = generateInterviewGuideHTML(guide, jobTitle, companyName, accentColor);

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function generatePDFFromTemplateHTML(
  data: ResumeData,
  templateId: string,
  options: TemplateOptions
): Promise<Buffer> {
  const html = generateTemplateHTML(templateId, data, options);

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      pageRanges: '1',
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

  // Use Inter font to match resume
  const fontFamily = "'Inter', sans-serif";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: ${fontFamily};
      font-size: 9.5pt;
      line-height: 1.5;
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
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 8px;
    }

    .contact-info {
      font-size: 9.5pt;
      color: #666;
      line-height: 1.4;
    }

    .date {
      margin: 30px 0;
      font-size: 9.5pt;
    }

    .salutation {
      margin-bottom: 20px;
      font-size: 9.5pt;
    }

    .body-paragraph {
      margin-bottom: 16px;
      font-size: 9.5pt;
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
