import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const sageBlocksMetadata: TemplateMetadata = {
  id: 'sage-blocks',
  name: 'Sage Blocks',
  category: 'modern',
  layout: 'two-column-left',
  description: 'Modern design with decorative block accents',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateSageBlocksHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showIcons, showLanguages } = options;
  const photoUrl = data.profilePhotoUrl;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-marker"></div>
      <div class="exp-content">
        <div class="exp-header">
          <span class="exp-company">${exp.company}</span>
          <span class="exp-dates">${exp.dates}</span>
        </div>
        <div class="exp-title">${exp.title}</div>
        <ul class="bullet-list">${bulletHTML}</ul>
      </div>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      ${edu.dates ? `<div class="edu-dates">${edu.dates}</div>` : ''}
      <div class="edu-school">${edu.school}</div>
      <ul class="edu-details">
        <li>${edu.degree}${edu.specialty ? `, ${edu.specialty}` : ''}</li>
      </ul>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map(skill => `<li>${skill}</li>`).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Montserrat', sans-serif;
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
      position: relative;
    }

    .decorative-blocks {
      position: absolute;
      top: 0;
      left: 0;
      width: 2.5in;
    }

    .block-1 {
      position: absolute;
      top: 0;
      left: 0;
      width: 60px;
      height: 140px;
      background: ${accentColor};
    }

    .block-2 {
      position: absolute;
      top: 0;
      left: 70px;
      width: 120px;
      height: 60px;
      background: #d1d5db;
    }

    .sidebar {
      width: 2.5in;
      padding: 0.4in 0.3in;
      padding-top: 2.2in;
    }

    .photo-container {
      position: absolute;
      top: 80px;
      left: 30px;
      width: 110px;
      height: 110px;
      border-radius: 50%;
      background: #e5e7eb;
      border: 4px solid white;
      overflow: hidden;
      z-index: 10;
    }
    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sidebar-section {
      margin-bottom: 18px;
    }

    .sidebar-title {
      font-size: 10pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
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
      margin-bottom: 12px;
    }

    .edu-dates {
      font-weight: 700;
      font-size: 8pt;
      color: #1a1a1a;
    }

    .edu-school {
      font-weight: 600;
      font-size: 8pt;
      color: ${accentColor};
    }

    .edu-details {
      list-style: disc;
      padding-left: 14px;
      font-size: 7.5pt;
      color: #555;
      margin-top: 2px;
    }

    .skills-list {
      list-style: disc;
      padding-left: 14px;
      font-size: 8pt;
      color: #444;
    }

    .skills-list li {
      margin-bottom: 2px;
    }

    .main {
      flex: 1;
      padding: 0.5in 0.5in 0.4in 0.3in;
    }

    .main-header {
      text-align: right;
      margin-bottom: 16px;
      padding-bottom: 16px;
    }

    .name {
      font-size: 26pt;
      font-weight: 700;
      color: ${accentColor};
      line-height: 1.1;
    }

    .job-title {
      font-size: 10pt;
      font-weight: 500;
      color: #666;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 6px;
      padding: 6px 12px;
      background: #f3f4f6;
      display: inline-block;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 10pt;
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
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }

    .exp-marker {
      width: 8px;
      height: 8px;
      background: ${accentColor};
      border-radius: 2px;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .exp-content {
      flex: 1;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .exp-company {
      font-weight: 600;
      font-size: 9pt;
      color: #1a1a1a;
    }

    .exp-dates {
      font-size: 8pt;
      color: #888;
    }

    .exp-title {
      font-size: 9pt;
      color: #555;
      margin-bottom: 4px;
    }

    .bullet-list {
      list-style: disc;
      padding-left: 14px;
    }

    .bullet-list li {
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 2px;
      color: #444;
    }

    .reference-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .ref-item {
      font-size: 8pt;
    }

    .ref-name {
      font-weight: 600;
      color: #1a1a1a;
    }

    .ref-title {
      color: #666;
    }

    .ref-detail {
      color: #888;
      font-size: 7.5pt;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="decorative-blocks">
      <div class="block-1"></div>
      <div class="block-2"></div>
    </div>
    ${showPhoto ? `<div class="photo-container">${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" />` : ''}</div>` : ''}

    <div class="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-title">Contact</div>
        ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
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

      ${data.summary ? `
      <div class="section">
        <div class="section-title">Profile</div>
        <div class="summary-text">${data.summary}</div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Work Experience</div>
        ${experienceHTML}
      </div>

      ${data.references && data.references.length > 0 ? `
      <div class="section">
        <div class="section-title">Reference</div>
        <div class="reference-grid">
          ${data.references.slice(0, 2).map(ref => `
            <div class="ref-item">
              <div class="ref-name">${ref.name}</div>
              <div class="ref-title">${ref.title}</div>
              <div class="ref-detail">Phone: ${ref.phone}</div>
              <div class="ref-detail">Email: ${ref.email}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
