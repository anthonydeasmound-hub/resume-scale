import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const swissDesignMetadata: TemplateMetadata = {
  id: 'swiss-design',
  name: 'Swiss Design',
  category: 'modern',
  layout: 'single',
  description: 'Clean Swiss-style typography layout',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateSwissDesignHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-header">
        <span class="exp-title">${exp.title}</span>
        <span class="exp-company">${exp.company}</span>
      </div>
      <div class="exp-dates">${exp.dates}</div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <div class="edu-main">
        <span class="edu-degree">${edu.degree}</span>
        ${edu.specialty ? `<span class="edu-field">${edu.specialty}</span>` : ''}
      </div>
      <div class="edu-sub">
        <span class="edu-school">${edu.school}</span>
        ${edu.dates ? `<span class="edu-dates">${edu.dates}</span>` : ''}
      </div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(', ')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.5;
      color: #000;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.6in;
      display: grid;
      grid-template-columns: 1.8in 1fr;
      gap: 0.4in;
    }

    .left-col {
      border-right: 1px solid #000;
      padding-right: 0.3in;
    }

    .name {
      font-size: 20pt;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 6px;
    }

    .job-title {
      font-size: 9pt;
      font-weight: 400;
      color: ${accentColor};
      margin-bottom: 20px;
    }

    .contact-section {
      font-size: 8pt;
      margin-bottom: 24px;
    }

    .contact-item {
      margin-bottom: 4px;
    }

    .left-section {
      margin-bottom: 20px;
    }

    .left-title {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      color: ${accentColor};
    }

    .edu-item {
      margin-bottom: 12px;
    }

    .edu-main {
      font-weight: 600;
      font-size: 8.5pt;
    }

    .edu-field {
      font-weight: 400;
      color: #555;
    }

    .edu-field::before {
      content: ' — ';
    }

    .edu-sub {
      font-size: 8pt;
      color: #666;
    }

    .edu-dates {
      font-size: 7.5pt;
      color: #999;
    }

    .edu-dates::before {
      content: ' · ';
    }

    .skills-text {
      font-size: 8pt;
      line-height: 1.6;
    }

    .right-col {
      padding-left: 0.1in;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      color: ${accentColor};
    }

    .summary-text {
      font-size: 9pt;
      line-height: 1.7;
    }

    .experience-item {
      margin-bottom: 16px;
    }

    .exp-header {
      margin-bottom: 2px;
    }

    .exp-title {
      font-weight: 600;
      font-size: 10pt;
    }

    .exp-company {
      font-weight: 400;
      color: #555;
    }

    .exp-company::before {
      content: ' — ';
      color: #999;
    }

    .exp-dates {
      font-size: 8pt;
      color: ${accentColor};
      margin-bottom: 6px;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 3px;
      padding-left: 10px;
      position: relative;
    }

    .bullet-list li::before {
      content: "–";
      position: absolute;
      left: 0;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="left-col">
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}

      <div class="contact-section">
        ${data.contactInfo.email ? `<div class="contact-item">${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${data.contactInfo.location}</div>` : ''}
        ${data.contactInfo.linkedin ? `<div class="contact-item">${data.contactInfo.linkedin}</div>` : ''}
      </div>

      <div class="left-section">
        <div class="left-title">Education</div>
        ${educationHTML}
      </div>

      ${skillsHTML ? `
      <div class="left-section">
        <div class="left-title">Skills</div>
        <div class="skills-text">${skillsHTML}</div>
      </div>
      ` : ''}

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="left-section">
        <div class="left-title">Languages</div>
        <div class="skills-text">${data.languages.join(', ')}</div>
      </div>
      ` : ''}

      ${data.certifications && data.certifications.length > 0 ? `
      <div class="left-section">
        <div class="left-title">Certifications</div>
        <div class="skills-text">${data.certifications.map(c => c.name).join(', ')}</div>
      </div>
      ` : ''}
    </div>

    <div class="right-col">
      ${data.summary ? `
      <div class="section">
        <div class="section-title">Profile</div>
        <div class="summary-text">${data.summary}</div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Experience</div>
        ${experienceHTML}
      </div>

      ${data.honors && data.honors.length > 0 ? `
      <div class="section">
        <div class="section-title">Awards</div>
        ${data.honors.map(h => `
          <div style="margin-bottom: 6px; font-size: 9pt;">
            <span style="font-weight: 600;">${h.title}</span>
            ${h.issuer || h.date ? `<span style="color: #666;"> — ${[h.issuer, h.date].filter(Boolean).join(', ')}</span>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
