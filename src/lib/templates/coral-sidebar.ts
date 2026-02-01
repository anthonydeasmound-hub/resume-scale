import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const coralSidebarMetadata: TemplateMetadata = {
  id: 'coral-sidebar',
  name: 'Coral Sidebar',
  category: 'creative',
  layout: 'two-column-left',
  description: 'Warm coral/salmon sidebar with modern layout',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateCoralSidebarHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showIcons, showLanguages } = options;
  const photoUrl = data.profilePhotoUrl;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-header">
        <div class="exp-title">${exp.title}</div>
        <div class="exp-dates">${exp.dates}</div>
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
    ? data.skills.map(skill => `<div class="skill-pill">${skill}</div>`).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/></svg>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
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
      border-radius: 12px;
      background: white;
      margin: 0 auto 16px;
      overflow: hidden;
    }

    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sidebar-name {
      font-size: 15pt;
      font-weight: 700;
      text-align: center;
      margin-bottom: 4px;
    }

    .sidebar-title {
      font-size: 9pt;
      text-align: center;
      font-weight: 500;
      opacity: 0.9;
      margin-bottom: 24px;
    }

    .sidebar-section {
      margin-bottom: 18px;
    }

    .sidebar-section-title {
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid rgba(255,255,255,0.3);
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
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .edu-item {
      margin-bottom: 10px;
      opacity: 0.95;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 8.5pt;
    }

    .edu-field {
      font-size: 8pt;
      opacity: 0.85;
    }

    .edu-school {
      font-size: 8pt;
      opacity: 0.85;
    }

    .edu-dates {
      font-size: 7.5pt;
      opacity: 0.7;
    }

    .skill-pill {
      display: inline-block;
      font-size: 7.5pt;
      background: rgba(255,255,255,0.2);
      padding: 4px 10px;
      border-radius: 20px;
      margin: 2px;
    }

    .main {
      flex: 1;
      padding: 0.5in 0.5in 0.4in 0.4in;
      background: #fafafa;
    }

    .header-section {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${accentColor};
    }

    .main-name {
      font-size: 24pt;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.1;
    }

    .main-title {
      font-size: 11pt;
      color: ${accentColor};
      font-weight: 500;
      margin-top: 4px;
    }

    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 11pt;
      font-weight: 600;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
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
      content: "▪";
      position: absolute;
      left: 0;
      color: ${accentColor};
    }

    .languages-text {
      font-size: 8pt;
      opacity: 0.95;
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
        <div class="section-title">Work Experience</div>
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
