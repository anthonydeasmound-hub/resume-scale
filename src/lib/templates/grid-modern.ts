import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const gridModernMetadata: TemplateMetadata = {
  id: 'grid-modern',
  name: 'Grid Modern',
  category: 'modern',
  layout: 'two-column-right',
  description: 'Modern grid-based layout',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateGridModernHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showIcons, showLanguages } = options;

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
    ? data.skills.map(skill => `<span class="skill-box">${skill}</span>`).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Space Grotesk', sans-serif;
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

    .main {
      flex: 1;
      padding: 0.5in 0.4in 0.4in 0.5in;
    }

    .main-header {
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
      margin-top: 6px;
    }

    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 10pt;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 3px solid ${accentColor};
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
      color: #666;
    }

    .exp-company {
      font-size: 9pt;
      color: ${accentColor};
      margin-bottom: 4px;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 2px;
      padding-left: 16px;
      position: relative;
    }

    .bullet-list li::before {
      content: "▪";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-size: 10pt;
      top: -1px;
    }

    .sidebar {
      width: 2.3in;
      background: #1a1a1a;
      padding: 0.5in 0.3in;
      color: white;
    }

    .sidebar-section {
      margin-bottom: 20px;
    }

    .sidebar-title {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid ${accentColor};
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 8pt;
      margin-bottom: 8px;
      opacity: 0.9;
    }

    .icon {
      width: 12px;
      height: 12px;
      color: ${accentColor};
      flex-shrink: 0;
      margin-top: 1px;
    }

    .edu-item {
      margin-bottom: 12px;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 8.5pt;
    }

    .edu-field {
      font-size: 8pt;
      opacity: 0.8;
    }

    .edu-school {
      font-size: 8pt;
      opacity: 0.7;
    }

    .edu-dates {
      font-size: 7.5pt;
      opacity: 0.6;
    }

    .skill-box {
      display: inline-block;
      font-size: 7pt;
      background: ${accentColor};
      color: white;
      padding: 3px 8px;
      margin: 2px;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="main">
      <div class="main-header">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
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

      ${data.certifications && data.certifications.length > 0 ? `
      <div class="section">
        <div class="section-title">Certifications</div>
        ${data.certifications.map(cert => `
          <div style="margin-bottom: 6px;">
            <span style="font-weight: 600; font-size: 9pt;">${cert.name}</span>
            ${cert.issuer ? `<span style="font-size: 8pt; color: #666;"> - ${cert.issuer}</span>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>

    <div class="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-title">Contact</div>
        ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
      </div>

      <div class="sidebar-section">
        <div class="sidebar-title">Education</div>
        ${educationHTML}
      </div>

      ${skillsHTML ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Skills</div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">${skillsHTML}</div>
      </div>
      ` : ''}

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Languages</div>
        <div style="font-size: 8pt; opacity: 0.9;">${data.languages.join(' • ')}</div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
