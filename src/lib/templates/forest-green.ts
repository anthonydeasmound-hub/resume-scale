import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const forestGreenMetadata: TemplateMetadata = {
  id: 'forest-green',
  name: 'Forest Green',
  category: 'professional',
  layout: 'two-column-left',
  description: 'Natural tones with forest green sidebar',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateForestGreenHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showIcons, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-title">${exp.title}</div>
      <div class="exp-meta">
        <span class="exp-company">${exp.company}</span>
        <span class="exp-dates">${exp.dates}</span>
      </div>
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
    ? data.skills.map(skill => `<span class="skill-chip">${skill}</span>`).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
      linkedin: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Lato', sans-serif;
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
      background: ${accentColor};
      padding: 0.5in 0.3in;
      color: white;
    }

    .photo-container {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      margin: 0 auto 20px;
      border: 3px solid white;
      overflow: hidden;
    }

    .sidebar-name {
      font-size: 14pt;
      font-weight: 900;
      text-align: center;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .sidebar-title {
      font-size: 9pt;
      text-align: center;
      opacity: 0.9;
      margin-bottom: 20px;
    }

    .sidebar-section {
      margin-bottom: 18px;
    }

    .sidebar-section-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(255,255,255,0.3);
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 8pt;
      margin-bottom: 8px;
      opacity: 0.95;
    }

    .icon {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
      margin-top: 2px;
      fill: white;
    }

    .edu-item {
      margin-bottom: 12px;
    }

    .edu-degree {
      font-weight: 700;
      font-size: 9pt;
    }

    .edu-field {
      font-size: 8pt;
      opacity: 0.9;
    }

    .edu-school {
      font-size: 8pt;
      opacity: 0.85;
    }

    .edu-dates {
      font-size: 7.5pt;
      opacity: 0.7;
    }

    .skill-chip {
      display: inline-block;
      font-size: 7.5pt;
      background: rgba(255,255,255,0.2);
      padding: 3px 8px;
      border-radius: 12px;
      margin: 2px;
    }

    .main {
      flex: 1;
      padding: 0.5in 0.5in 0.4in 0.4in;
    }

    .main-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${accentColor};
    }

    .name {
      font-size: 28pt;
      font-weight: 900;
      color: #1a1a1a;
      text-transform: uppercase;
      line-height: 1.1;
    }

    .job-title {
      font-size: 11pt;
      color: ${accentColor};
      margin-top: 4px;
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

    .exp-title {
      font-weight: 700;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .exp-company {
      font-size: 9pt;
      color: #555;
    }

    .exp-dates {
      font-size: 8pt;
      color: ${accentColor};
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 2px;
      padding-left: 14px;
      position: relative;
    }

    .bullet-list li::before {
      content: "●";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-size: 6pt;
      top: 3px;
    }

    .cert-item {
      margin-bottom: 6px;
    }

    .cert-name {
      font-weight: 700;
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
      <div class="sidebar-name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="sidebar-title">${data.jobTitle}</div>` : ''}

      <div class="sidebar-section">
        <div class="sidebar-section-title">Contact</div>
        ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
        ${data.contactInfo.linkedin ? `<div class="contact-item">${icon('linkedin')}${data.contactInfo.linkedin}</div>` : ''}
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Education</div>
        ${educationHTML}
      </div>

      ${skillsHTML ? `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Skills</div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">${skillsHTML}</div>
      </div>
      ` : ''}

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Languages</div>
        <div style="font-size: 8pt; opacity: 0.9;">${data.languages.join(' • ')}</div>
      </div>
      ` : ''}
    </div>

    <div class="main">
      <div class="main-header">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      </div>

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

      ${data.certifications && data.certifications.length > 0 ? `
      <div class="section">
        <div class="section-title">Certifications</div>
        ${data.certifications.map(cert => `
          <div class="cert-item">
            <span class="cert-name">${cert.name}</span>
            ${cert.issuer ? `<span class="cert-issuer"> - ${cert.issuer}</span>` : ''}
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
