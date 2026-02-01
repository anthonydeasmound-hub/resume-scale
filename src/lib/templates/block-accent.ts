import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const blockAccentMetadata: TemplateMetadata = {
  id: 'block-accent',
  name: 'Block Accent',
  category: 'modern',
  layout: 'two-column-left',
  description: 'Two-column with colored accent blocks and badges',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateBlockAccentHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showIcons, showLanguages } = options;
  const photoUrl = data.profilePhotoUrl;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-header">
        <div class="exp-title">${exp.title}</div>
        <div class="exp-badge">${exp.dates}</div>
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
    ? data.skills.map(skill => `<div class="skill-block">${skill}</div>`).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 6l-10 7L2 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="2" width="14" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="18" x2="12" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Work Sans', sans-serif;
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
      background: #f8f8f8;
      padding: 0.5in 0.3in;
      border-right: 4px solid ${accentColor};
    }

    .photo-container {
      width: 100px;
      height: 100px;
      background: ${accentColor};
      margin: 0 auto 16px;
      overflow: hidden;
    }

    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sidebar-name {
      font-size: 14pt;
      font-weight: 700;
      color: #1a1a1a;
      text-align: center;
      margin-bottom: 4px;
    }

    .sidebar-title {
      font-size: 9pt;
      color: ${accentColor};
      text-align: center;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .sidebar-section {
      margin-bottom: 18px;
    }

    .sidebar-section-title {
      font-size: 9pt;
      font-weight: 700;
      color: white;
      background: ${accentColor};
      padding: 4px 10px;
      margin-bottom: 10px;
      margin-left: -0.3in;
      margin-right: -0.3in;
      padding-left: 0.3in;
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 8pt;
      margin-bottom: 8px;
      color: #444;
    }

    .icon {
      width: 14px;
      height: 14px;
      color: ${accentColor};
      flex-shrink: 0;
      margin-top: 1px;
    }

    .edu-item {
      margin-bottom: 10px;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 8.5pt;
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
      color: ${accentColor};
    }

    .skill-block {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 500;
      color: #1a1a1a;
      background: white;
      padding: 4px 10px;
      margin: 2px;
      border-left: 3px solid ${accentColor};
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
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 3px solid ${accentColor};
      display: inline-block;
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
      align-items: center;
      margin-bottom: 2px;
    }

    .exp-title {
      font-weight: 600;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-badge {
      font-size: 7pt;
      font-weight: 600;
      color: white;
      background: ${accentColor};
      padding: 2px 8px;
      border-radius: 2px;
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
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 2px;
      padding-left: 14px;
      position: relative;
      color: #444;
    }

    .bullet-list li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 6px;
      width: 6px;
      height: 6px;
      background: ${accentColor};
    }

    .languages-text {
      font-size: 8pt;
      color: #444;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sidebar">
      ${showPhoto ? `<div class="photo-container">${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" />` : ''}</div>` : ''}

      <div class="sidebar-name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="sidebar-title">${data.jobTitle}</div>` : ''}

      <div class="sidebar-section">
        <div class="sidebar-section-title">Contact</div>
        ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-title">Education</div>
        ${educationHTML}
      </div>

      ${skillsHTML ? `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Skills</div>
        <div style="display: flex; flex-wrap: wrap; margin: -2px;">${skillsHTML}</div>
      </div>
      ` : ''}

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Languages</div>
        <div class="languages-text">${data.languages.join(' • ')}</div>
      </div>
      ` : ''}
    </div>

    <div class="main">
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
  </div>
</body>
</html>
  `;
}
