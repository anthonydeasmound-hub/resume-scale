import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const accentSidebarMetadata: TemplateMetadata = {
  id: 'accent-sidebar',
  name: 'Accent Sidebar',
  category: 'modern',
  layout: 'single',
  description: 'Thin accent sidebar with clean layout',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateAccentSidebarHTML(data: ResumeData, options: TemplateOptions): string {
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
      <div class="edu-degree">${edu.degree}${edu.specialty ? ` in ${edu.specialty}` : ''}</div>
      <div class="edu-school">${edu.school}${edu.dates ? ` | ${edu.dates}` : ''}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(' • ')
    : '';

  const contactLines = [
    data.contactInfo.email,
    data.contactInfo.phone,
    data.contactInfo.location,
    data.contactInfo.linkedin
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Rubik', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #1a1a1a;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      display: flex;
    }

    .accent-bar {
      width: 8px;
      background: ${accentColor};
    }

    .content {
      flex: 1;
      padding: 0.5in 0.6in 0.5in 0.5in;
    }

    .header {
      margin-bottom: 20px;
    }

    .name {
      font-size: 28pt;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.1;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 500;
      color: ${accentColor};
      margin-top: 4px;
    }

    .contact-info {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 8.5pt;
      color: #555;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 10pt;
      font-weight: 600;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid ${accentColor};
    }

    .summary-text {
      font-size: 9pt;
      color: #333;
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
      content: "•";
      position: absolute;
      left: 0;
      color: ${accentColor};
    }

    .edu-item {
      margin-bottom: 10px;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 9.5pt;
      color: #1a1a1a;
    }

    .edu-school {
      font-size: 8.5pt;
      color: #555;
    }

    .skills-text {
      font-size: 9pt;
      color: #333;
      line-height: 1.8;
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
    <div class="accent-bar"></div>
    <div class="content">
      <div class="header">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
        <div class="contact-info">
          ${contactLines.map(c => `<span>${c}</span>`).join('')}
        </div>
      </div>

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
          <div class="skills-text">${skillsHTML}</div>
        </div>
        ` : ''}
      </div>

      ${data.certifications && data.certifications.length > 0 ? `
      <div class="section">
        <div class="section-title">Certifications</div>
        ${data.certifications.map(cert => `
          <div class="edu-item">
            <div class="edu-degree">${cert.name}</div>
            ${cert.issuer ? `<div class="edu-school">${cert.issuer}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="section">
        <div class="section-title">Languages</div>
        <div class="skills-text">${data.languages.join(' • ')}</div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
