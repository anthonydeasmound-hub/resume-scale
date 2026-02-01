import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const minimalistBarsMetadata: TemplateMetadata = {
  id: 'minimalist-bars',
  name: 'Minimalist Bars',
  category: 'modern',
  layout: 'single',
  description: 'Clean minimalist design with colored section bars',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateMinimalistBarsHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-header">
        <div class="exp-left">
          <div class="exp-title">${exp.title}</div>
          <div class="exp-company">${exp.company}</div>
        </div>
        <div class="exp-dates">${exp.dates}</div>
      </div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <div class="edu-row">
        <div class="edu-left">
          <span class="edu-degree">${edu.degree}${edu.specialty ? ` in ${edu.specialty}` : ''}</span>
          <span class="edu-school"> | ${edu.school}</span>
        </div>
        ${edu.dates ? `<div class="edu-dates">${edu.dates}</div>` : ''}
      </div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(' • ')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #333;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in 0.6in;
    }

    .header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid ${accentColor};
    }

    .name {
      font-size: 28pt;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.5px;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 500;
      color: ${accentColor};
      margin-top: 4px;
    }

    .contact-row {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 10px;
      font-size: 9pt;
      color: #555;
    }

    .contact-item {
      display: flex;
      align-items: center;
    }

    .section {
      margin-bottom: 18px;
    }

    .section-bar {
      background: ${accentColor};
      color: white;
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 6px 14px;
      margin-bottom: 12px;
    }

    .summary-text {
      font-size: 9pt;
      color: #444;
      line-height: 1.7;
      padding: 0 4px;
    }

    .experience-item {
      margin-bottom: 14px;
      padding: 0 4px;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .exp-left {
      flex: 1;
    }

    .exp-title {
      font-weight: 600;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-company {
      font-size: 9pt;
      color: #555;
    }

    .exp-dates {
      font-size: 8pt;
      color: #777;
      text-align: right;
      flex-shrink: 0;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
      margin-top: 4px;
    }

    .bullet-list li {
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 2px;
      padding-left: 14px;
      position: relative;
      color: #444;
    }

    .bullet-list li::before {
      content: "—";
      position: absolute;
      left: 0;
      color: ${accentColor};
    }

    .edu-item {
      padding: 0 4px;
      margin-bottom: 6px;
    }

    .edu-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 9pt;
      color: #1a1a1a;
    }

    .edu-school {
      font-size: 9pt;
      color: #555;
    }

    .edu-dates {
      font-size: 8pt;
      color: #777;
    }

    .skills-text {
      font-size: 9pt;
      color: #444;
      padding: 0 4px;
      line-height: 1.7;
    }

    .languages-text {
      font-size: 9pt;
      color: #444;
      padding: 0 4px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      <div class="contact-row">
        ${data.contactInfo.email ? `<div class="contact-item">${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${data.contactInfo.location}</div>` : ''}
      </div>
    </div>

    ${data.summary ? `
    <div class="section">
      <div class="section-bar">Summary</div>
      <div class="summary-text">${data.summary}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-bar">Experience</div>
      ${experienceHTML}
    </div>

    <div class="section">
      <div class="section-bar">Education</div>
      ${educationHTML}
    </div>

    ${skillsHTML ? `
    <div class="section">
      <div class="section-bar">Skills</div>
      <div class="skills-text">${skillsHTML}</div>
    </div>
    ` : ''}

    ${showLanguages && data.languages && data.languages.length > 0 ? `
    <div class="section">
      <div class="section-bar">Languages</div>
      <div class="languages-text">${data.languages.join(' • ')}</div>
    </div>
    ` : ''}

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-bar">Certifications</div>
      ${data.certifications.map(cert => `
        <div style="padding: 0 4px; margin-bottom: 4px;">
          <span style="font-weight: 600; font-size: 9pt;">${cert.name}</span>
          ${cert.issuer ? `<span style="font-size: 8pt; color: #666;"> — ${cert.issuer}</span>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
