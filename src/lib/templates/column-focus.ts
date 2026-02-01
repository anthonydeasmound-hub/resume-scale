import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const columnFocusMetadata: TemplateMetadata = {
  id: 'column-focus',
  name: 'Column Focus',
  category: 'professional',
  layout: 'two-column-left',
  description: 'Focus column layout with subtle colors',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateColumnFocusHTML(data: ResumeData, options: TemplateOptions): string {
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
      <div class="edu-degree">${edu.degree}</div>
      ${edu.specialty ? `<div class="edu-field">${edu.specialty}</div>` : ''}
      <div class="edu-school">${edu.school}</div>
      ${edu.dates ? `<div class="edu-dates">${edu.dates}</div>` : ''}
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map(skill => `<div class="skill-line">${skill}</div>`).join('')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Fira Sans', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #333;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      display: flex;
    }

    .sidebar {
      width: 2.5in;
      background: #fafafa;
      padding: 0.5in 0.3in;
    }

    .sidebar-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${accentColor};
    }

    .name {
      font-size: 16pt;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.2;
    }

    .job-title {
      font-size: 9pt;
      font-weight: 500;
      color: ${accentColor};
      margin-top: 4px;
    }

    .contact-section {
      margin-bottom: 20px;
    }

    .contact-item {
      font-size: 8pt;
      color: #444;
      margin-bottom: 6px;
      padding-left: 8px;
      border-left: 2px solid ${accentColor};
    }

    .sidebar-section {
      margin-bottom: 20px;
    }

    .sidebar-title {
      font-size: 9pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }

    .edu-item {
      margin-bottom: 12px;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 9pt;
      color: #1a1a1a;
    }

    .edu-field {
      font-size: 8pt;
      color: #555;
    }

    .edu-school {
      font-size: 8pt;
      color: #666;
    }

    .edu-dates {
      font-size: 7.5pt;
      color: #888;
    }

    .skill-line {
      font-size: 8pt;
      color: #333;
      padding: 4px 8px;
      margin-bottom: 4px;
      background: white;
      border-left: 2px solid ${accentColor};
    }

    .main {
      flex: 1;
      padding: 0.5in 0.5in 0.4in 0.4in;
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
      margin-bottom: 12px;
      padding-bottom: 4px;
      border-bottom: 2px solid ${accentColor};
    }

    .summary-text {
      font-size: 9pt;
      color: #444;
      line-height: 1.7;
    }

    .experience-item {
      margin-bottom: 16px;
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
      margin-bottom: 6px;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 9pt;
      line-height: 1.5;
      margin-bottom: 3px;
      padding-left: 14px;
      position: relative;
      color: #333;
    }

    .bullet-list li::before {
      content: "●";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-size: 5pt;
      top: 5px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      </div>

      <div class="contact-section">
        ${data.contactInfo.email ? `<div class="contact-item">${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${data.contactInfo.location}</div>` : ''}
        ${data.contactInfo.linkedin ? `<div class="contact-item">${data.contactInfo.linkedin}</div>` : ''}
      </div>

      <div class="sidebar-section">
        <div class="sidebar-title">Education</div>
        ${educationHTML}
      </div>

      ${skillsHTML ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Skills</div>
        ${skillsHTML}
      </div>
      ` : ''}

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Languages</div>
        ${data.languages.map(l => `<div class="skill-line">${l}</div>`).join('')}
      </div>
      ` : ''}

      ${data.certifications && data.certifications.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Certifications</div>
        ${data.certifications.map(cert => `
          <div class="edu-item">
            <div class="edu-degree">${cert.name}</div>
            ${cert.issuer ? `<div class="edu-school">${cert.issuer}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>

    <div class="main">
      ${data.summary ? `
      <div class="section">
        <div class="section-title">Profile</div>
        <div class="summary-text">${data.summary}</div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Professional Experience</div>
        ${experienceHTML}
      </div>

      ${data.honors && data.honors.length > 0 ? `
      <div class="section">
        <div class="section-title">Awards & Recognition</div>
        ${data.honors.map(h => `
          <div style="margin-bottom: 6px;">
            <span style="font-weight: 600; font-size: 9pt;">${h.title}</span>
            ${h.issuer || h.date ? `<span style="font-size: 8pt; color: #666;"> - ${[h.issuer, h.date].filter(Boolean).join(', ')}</span>` : ''}
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
