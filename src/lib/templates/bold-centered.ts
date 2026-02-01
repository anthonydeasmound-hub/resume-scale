import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const boldCenteredMetadata: TemplateMetadata = {
  id: 'bold-centered',
  name: 'Bold Centered',
  category: 'modern',
  layout: 'single',
  description: 'Bold name with centered header layout',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateBoldCenteredHTML(data: ResumeData, options: TemplateOptions): string {
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
    ? data.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')
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
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Open Sans', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #1a1a1a;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in 0.65in;
    }

    .header {
      text-align: center;
      margin-bottom: 24px;
    }

    .name {
      font-family: 'Oswald', sans-serif;
      font-size: 36pt;
      font-weight: 700;
      color: ${accentColor};
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .job-title {
      font-family: 'Oswald', sans-serif;
      font-size: 12pt;
      font-weight: 400;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-top: 8px;
    }

    .contact-line {
      font-size: 9pt;
      color: #666;
      margin-top: 12px;
    }

    .divider {
      height: 3px;
      background: ${accentColor};
      margin: 0 auto 20px;
      width: 60px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-family: 'Oswald', sans-serif;
      font-size: 12pt;
      font-weight: 600;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }

    .summary-text {
      font-size: 9pt;
      color: #333;
      line-height: 1.7;
      text-align: center;
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
      justify-content: center;
    }

    .skill-tag {
      font-size: 8pt;
      color: ${accentColor};
      border: 1px solid ${accentColor};
      padding: 3px 10px;
      border-radius: 3px;
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
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      <div class="contact-line">${contactParts.join(' • ')}</div>
    </div>

    <div class="divider"></div>

    ${data.summary ? `
    <div class="section">
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
      <div class="skills-grid">
        ${data.certifications.map(c => `<span class="skill-tag">${c.name}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${showLanguages && data.languages && data.languages.length > 0 ? `
    <div class="section">
      <div class="section-title">Languages</div>
      <div class="skills-grid">${data.languages.map(l => `<span class="skill-tag">${l}</span>`).join('')}</div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
