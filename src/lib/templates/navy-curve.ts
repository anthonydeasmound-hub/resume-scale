import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const navyCurveMetadata: TemplateMetadata = {
  id: 'navy-curve',
  name: 'Navy Curve',
  category: 'modern',
  layout: 'two-column-left',
  description: 'Elegant curved header with navy accent',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateNavyCurveHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showIcons, showLanguages } = options;
  const photoUrl = data.profilePhotoUrl;

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
    ? data.skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
      web: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    };
    return icons[name] || '';
  };

  const certsHTML = data.certifications && data.certifications.length > 0
    ? data.certifications.map(cert => `<li>${cert.name}</li>`).join('')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Poppins', sans-serif;
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

    .sidebar {
      width: 2.6in;
      background: #f8f9fa;
      padding-top: 0;
      position: relative;
    }

    .sidebar-header {
      background: ${accentColor};
      padding: 0.4in 0.3in 0.6in;
      position: relative;
      min-height: ${showPhoto ? '2in' : '0.8in'};
    }

    .sidebar-header::after {
      content: '';
      position: absolute;
      bottom: -30px;
      left: 0;
      right: 0;
      height: 60px;
      background: ${accentColor};
      border-radius: 0 0 50% 50%;
    }

    .photo-container {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: #ddd;
      border: 4px solid white;
      margin: 0 auto;
      position: relative;
      z-index: 2;
      overflow: hidden;
    }
    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sidebar-content {
      padding: 0.5in 0.3in 0.4in;
    }

    .sidebar-section {
      margin-bottom: 18px;
    }

    .sidebar-title {
      font-size: 11pt;
      font-weight: 600;
      color: ${accentColor};
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 8pt;
      margin-bottom: 8px;
      color: #555;
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

    .edu-degree {
      font-weight: 600;
      font-size: 9pt;
      color: #1a1a1a;
    }

    .edu-field {
      font-size: 8pt;
      color: #666;
    }

    .edu-school {
      font-size: 8pt;
      color: #555;
    }

    .edu-dates {
      font-size: 7.5pt;
      color: #888;
    }

    .cert-list {
      list-style: disc;
      padding-left: 16px;
      font-size: 8pt;
      color: #555;
    }

    .cert-list li {
      margin-bottom: 4px;
    }

    .skill-item {
      font-size: 8pt;
      color: #555;
      margin-bottom: 4px;
    }

    .language-item {
      font-size: 8pt;
      color: #555;
      margin-bottom: 4px;
    }

    .main {
      flex: 1;
      padding: 0.5in 0.5in 0.4in 0.4in;
    }

    .main-header {
      margin-bottom: 20px;
    }

    .name {
      font-size: 28pt;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.1;
      text-transform: uppercase;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 500;
      color: ${accentColor};
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 6px;
    }

    .contact-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 14px;
      padding: 10px 0;
      border-top: 1px solid #ddd;
      border-bottom: 1px solid #ddd;
      font-size: 7.5pt;
      color: #555;
    }

    .contact-bar-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 600;
      color: ${accentColor};
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid ${accentColor};
    }

    .summary-text {
      font-size: 9pt;
      color: #444;
      line-height: 1.6;
      text-align: justify;
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
      color: #666;
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
      padding-left: 12px;
      position: relative;
    }

    .bullet-list li::before {
      content: "●";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-size: 5pt;
      top: 3px;
    }

    .reference-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .reference-item {
      font-size: 8pt;
    }

    .ref-name {
      font-weight: 600;
      color: #1a1a1a;
    }

    .ref-title {
      color: #666;
    }

    .ref-contact {
      color: #888;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sidebar">
      <div class="sidebar-header">
        ${showPhoto ? `<div class="photo-container">${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" />` : ''}</div>` : ''}
      </div>
      <div class="sidebar-content">
        <div class="sidebar-section">
          <div class="sidebar-title">Education</div>
          ${educationHTML}
        </div>

        ${certsHTML ? `
        <div class="sidebar-section">
          <div class="sidebar-title">Certifications</div>
          <ul class="cert-list">${certsHTML}</ul>
        </div>
        ` : ''}

        ${skillsHTML ? `
        <div class="sidebar-section">
          <div class="sidebar-title">Skills</div>
          ${skillsHTML}
        </div>
        ` : ''}

        ${showLanguages && data.languages && data.languages.length > 0 ? `
        <div class="sidebar-section">
          <div class="sidebar-title">Languages</div>
          ${data.languages.map(lang => `<div class="language-item">${lang}</div>`).join('')}
        </div>
        ` : ''}
      </div>
    </div>

    <div class="main">
      <div class="main-header">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
        <div class="contact-bar">
          ${data.contactInfo.phone ? `<span class="contact-bar-item">${icon('phone')}${data.contactInfo.phone}</span>` : ''}
          ${data.contactInfo.email ? `<span class="contact-bar-item">${icon('email')}${data.contactInfo.email}</span>` : ''}
          ${data.contactInfo.linkedin ? `<span class="contact-bar-item">${icon('web')}${data.contactInfo.linkedin}</span>` : ''}
          ${data.contactInfo.location ? `<span class="contact-bar-item">${icon('location')}${data.contactInfo.location}</span>` : ''}
        </div>
      </div>

      ${data.summary ? `
      <div class="section">
        <div class="section-title">About me</div>
        <div class="summary-text">${data.summary}</div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Experience</div>
        ${experienceHTML}
      </div>

      ${data.references && data.references.length > 0 ? `
      <div class="section">
        <div class="section-title">Reference</div>
        <div class="reference-grid">
          ${data.references.slice(0, 2).map(ref => `
            <div class="reference-item">
              <div class="ref-name">${ref.name} | ${ref.title}</div>
              <div class="ref-title">${ref.title}</div>
              <div class="ref-contact">${ref.phone}</div>
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
