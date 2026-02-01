import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const minimalistOneMetadata: TemplateMetadata = {
  id: 'minimalist-one',
  name: 'Minimalist One',
  category: 'modern',
  layout: 'single',
  description: 'Ultra-minimalist single page design',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateMinimalistOneHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-dates">${exp.dates}</div>
      <div class="exp-content">
        <div class="exp-title">${exp.title}</div>
        <div class="exp-company">${exp.company}</div>
        <ul class="bullet-list">${bulletHTML}</ul>
      </div>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-row">
      <span class="edu-degree">${edu.degree}${edu.specialty ? `, ${edu.specialty}` : ''}</span>
      <span class="edu-divider">—</span>
      <span class="edu-school">${edu.school}</span>
      ${edu.dates ? `<span class="edu-dates">(${edu.dates})</span>` : ''}
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(' · ')
    : '';

  const contactParts = [
    data.contactInfo.email,
    data.contactInfo.phone,
    data.contactInfo.location
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      line-height: 1.6;
      color: #333;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.6in 0.75in;
    }

    .header {
      margin-bottom: 30px;
    }

    .name {
      font-size: 36pt;
      font-weight: 300;
      color: #1a1a1a;
      letter-spacing: -2px;
      line-height: 1;
    }

    .job-title {
      font-size: 10pt;
      font-weight: 400;
      color: ${accentColor};
      margin-top: 8px;
      letter-spacing: 1px;
    }

    .contact-line {
      font-size: 8pt;
      color: #888;
      margin-top: 12px;
      font-weight: 300;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 7pt;
      font-weight: 600;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 16px;
    }

    .summary-text {
      font-size: 9pt;
      color: #555;
      line-height: 1.8;
      font-weight: 300;
    }

    .experience-item {
      display: flex;
      gap: 24px;
      margin-bottom: 18px;
    }

    .exp-dates {
      width: 90px;
      flex-shrink: 0;
      font-size: 8pt;
      color: #999;
      font-weight: 400;
      padding-top: 2px;
    }

    .exp-content {
      flex: 1;
    }

    .exp-title {
      font-weight: 500;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-company {
      font-size: 9pt;
      color: #666;
      margin-bottom: 6px;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 8.5pt;
      line-height: 1.6;
      margin-bottom: 3px;
      padding-left: 12px;
      position: relative;
      font-weight: 300;
      color: #444;
    }

    .bullet-list li::before {
      content: "–";
      position: absolute;
      left: 0;
      color: ${accentColor};
    }

    .edu-row {
      font-size: 9pt;
      margin-bottom: 6px;
    }

    .edu-degree {
      font-weight: 500;
      color: #1a1a1a;
    }

    .edu-divider {
      color: #ccc;
      margin: 0 6px;
    }

    .edu-school {
      color: #666;
    }

    .edu-dates {
      color: #999;
      font-size: 8pt;
      margin-left: 6px;
    }

    .skills-text {
      font-size: 8.5pt;
      color: #555;
      font-weight: 300;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      <div class="contact-line">${contactParts.join(' / ')}</div>
    </div>

    ${data.summary ? `
    <div class="section">
      <div class="section-title">About</div>
      <div class="summary-text">${data.summary}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Experience</div>
      ${experienceHTML}
    </div>

    <div class="section">
      <div class="section-title">Education</div>
      ${educationHTML}
    </div>

    ${skillsHTML ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills-text">${skillsHTML}</div>
    </div>
    ` : ''}

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      <div class="skills-text">${data.certifications.map(c => c.name).join(' · ')}</div>
    </div>
    ` : ''}

    ${showLanguages && data.languages && data.languages.length > 0 ? `
    <div class="section">
      <div class="section-title">Languages</div>
      <div class="skills-text">${data.languages.join(' · ')}</div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
