import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const warmCopperMetadata: TemplateMetadata = {
  id: 'warm-copper',
  name: 'Warm Copper',
  category: 'professional',
  layout: 'two-column-left',
  description: 'Warm tones with clean sidebar layout',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateWarmCopperHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showIcons, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-title">${exp.title}</div>
      <div class="exp-company">${exp.company}</div>
      <div class="exp-dates">${exp.dates}</div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => {
    const bullets = [];
    if (edu.specialty) bullets.push(`Specialization in ${edu.specialty}`);
    return `
    <div class="edu-item">
      <div class="edu-degree">${edu.degree}</div>
      <div class="edu-school">${edu.school}</div>
      ${edu.dates ? `<div class="edu-dates">${edu.dates}</div>` : ''}
      ${bullets.length > 0 ? `<ul class="edu-bullets">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
  `;
  }).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map(skill => `<li>${skill}</li>`).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
      web: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Open Sans', sans-serif;
      font-size: 9pt;
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
      background: white;
      padding: 0.4in 0.3in;
      border-right: 3px solid ${accentColor};
    }

    .photo-container {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      background: #e5e7eb;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .sidebar-section {
      margin-bottom: 20px;
    }

    .sidebar-title {
      font-size: 10pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid ${accentColor};
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 8pt;
      margin-bottom: 6px;
      color: #444;
    }

    .icon {
      width: 12px;
      height: 12px;
      color: ${accentColor};
      flex-shrink: 0;
      margin-top: 2px;
    }

    .edu-item {
      margin-bottom: 14px;
    }

    .edu-degree {
      font-weight: 700;
      font-size: 9pt;
      color: #1a1a1a;
    }

    .edu-school {
      font-size: 8pt;
      color: #555;
    }

    .edu-dates {
      font-size: 7.5pt;
      color: #888;
    }

    .edu-bullets {
      list-style: disc;
      padding-left: 14px;
      font-size: 7.5pt;
      color: #666;
      margin-top: 4px;
    }

    .skills-list {
      list-style: disc;
      padding-left: 14px;
      font-size: 8pt;
      color: #444;
    }

    .skills-list li {
      margin-bottom: 3px;
    }

    .main {
      flex: 1;
      padding: 0.4in 0.5in 0.4in 0.4in;
    }

    .main-header {
      margin-bottom: 16px;
    }

    .name {
      font-size: 26pt;
      font-weight: 700;
      color: ${accentColor};
      line-height: 1.1;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .summary-text {
      font-size: 9pt;
      color: #444;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 10pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid ${accentColor};
    }

    .experience-item {
      margin-bottom: 14px;
    }

    .exp-title {
      font-weight: 700;
      font-size: 9.5pt;
      color: #1a1a1a;
    }

    .exp-company {
      font-size: 9pt;
      color: #555;
    }

    .exp-dates {
      font-size: 8pt;
      color: #888;
      margin-bottom: 4px;
    }

    .bullet-list {
      list-style: disc;
      padding-left: 16px;
    }

    .bullet-list li {
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 2px;
      color: #444;
    }

    .cert-item {
      margin-bottom: 6px;
    }

    .cert-name {
      font-weight: 600;
      font-size: 9pt;
      color: #1a1a1a;
    }

    .cert-issuer {
      font-size: 8pt;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sidebar">
      ${showPhoto ? '<div class="photo-container"></div>' : ''}

      <div class="sidebar-section">
        <div class="sidebar-title">Contact</div>
        ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.linkedin ? `<div class="contact-item">${icon('web')}${data.contactInfo.linkedin}</div>` : ''}
      </div>

      <div class="sidebar-section">
        <div class="sidebar-title">Education</div>
        ${educationHTML}
      </div>

      ${skillsHTML ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Skills</div>
        <ul class="skills-list">${skillsHTML}</ul>
      </div>
      ` : ''}

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Languages</div>
        <ul class="skills-list">
          ${data.languages.map(lang => `<li>${lang}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>

    <div class="main">
      <div class="main-header">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      </div>

      ${data.summary ? `<div class="summary-text">${data.summary}</div>` : ''}

      <div class="section">
        <div class="section-title">Work Experience</div>
        ${experienceHTML}
      </div>

      ${data.certifications && data.certifications.length > 0 ? `
      <div class="section">
        <div class="section-title">Certifications</div>
        ${data.certifications.map(cert => `
          <div class="cert-item">
            <div class="cert-name">${cert.name}</div>
            ${cert.issuer ? `<div class="cert-issuer">${cert.issuer}</div>` : ''}
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
