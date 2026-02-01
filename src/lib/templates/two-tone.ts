import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const twoToneMetadata: TemplateMetadata = {
  id: 'two-tone',
  name: 'Two Tone',
  category: 'modern',
  layout: 'single',
  description: 'Two-tone header with clean body',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateTwoToneHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-header">
        <span class="exp-title">${exp.title}</span>
        <span class="exp-dates">${exp.dates}</span>
      </div>
      <div class="exp-company">${exp.company}</div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <div class="edu-header">
        <span class="edu-degree">${edu.degree}${edu.specialty ? ` - ${edu.specialty}` : ''}</span>
        <span class="edu-dates">${edu.dates || ''}</span>
      </div>
      <div class="edu-school">${edu.school}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map(s => `<span class="skill-chip">${s}</span>`).join('')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Outfit', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #333;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
    }

    .header {
      display: flex;
    }

    .header-left {
      background: ${accentColor};
      color: white;
      padding: 0.4in;
      width: 55%;
    }

    .header-right {
      background: #f3f4f6;
      padding: 0.4in 0.3in;
      width: 45%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .name {
      font-size: 24pt;
      font-weight: 700;
      line-height: 1.1;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 400;
      opacity: 0.9;
      margin-top: 4px;
    }

    .contact-item {
      font-size: 8pt;
      color: #555;
      margin-bottom: 4px;
    }

    .content {
      padding: 0.4in 0.5in;
    }

    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid ${accentColor};
    }

    .summary-text {
      font-size: 9pt;
      color: #444;
      line-height: 1.6;
    }

    .experience-item {
      margin-bottom: 14px;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .exp-title {
      font-weight: 600;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-dates {
      font-size: 8pt;
      color: ${accentColor};
    }

    .exp-company {
      font-size: 9pt;
      color: #555;
      margin-bottom: 4px;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 9pt;
      line-height: 1.5;
      margin-bottom: 2px;
      padding-left: 14px;
      position: relative;
      color: #333;
    }

    .bullet-list li::before {
      content: "▸";
      position: absolute;
      left: 0;
      color: ${accentColor};
    }

    .edu-item {
      margin-bottom: 8px;
    }

    .edu-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .edu-degree {
      font-weight: 600;
      color: #1a1a1a;
    }

    .edu-dates {
      font-size: 8pt;
      color: #666;
    }

    .edu-school {
      font-size: 9pt;
      color: #555;
    }

    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .skill-chip {
      font-size: 8pt;
      color: ${accentColor};
      background: ${accentColor}15;
      padding: 4px 10px;
      border-radius: 4px;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      </div>
      <div class="header-right">
        ${data.contactInfo.email ? `<div class="contact-item">${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${data.contactInfo.location}</div>` : ''}
        ${data.contactInfo.linkedin ? `<div class="contact-item">${data.contactInfo.linkedin}</div>` : ''}
      </div>
    </div>

    <div class="content">
      ${data.summary ? `
      <div class="section">
        <div class="section-title">Summary</div>
        <div class="summary-text">${data.summary}</div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Experience</div>
        ${experienceHTML}
      </div>

      <div class="two-col">
        <div class="section">
          <div class="section-title">Education</div>
          ${educationHTML}
        </div>

        ${skillsHTML ? `
        <div class="section">
          <div class="section-title">Skills</div>
          <div class="skills-grid">${skillsHTML}</div>
        </div>
        ` : ''}
      </div>

      ${data.certifications && data.certifications.length > 0 ? `
      <div class="section">
        <div class="section-title">Certifications</div>
        <div class="skills-grid">${data.certifications.map(c => `<span class="skill-chip">${c.name}</span>`).join('')}</div>
      </div>
      ` : ''}

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="section">
        <div class="section-title">Languages</div>
        <div class="skills-grid">${data.languages.map(l => `<span class="skill-chip">${l}</span>`).join('')}</div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
