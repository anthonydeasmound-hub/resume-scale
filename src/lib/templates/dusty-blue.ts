import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const dustyBlueMetadata: TemplateMetadata = {
  id: 'dusty-blue',
  name: 'Dusty Blue',
  category: 'professional',
  layout: 'two-column-left',
  description: 'Soft dusty blue sidebar with refined typography',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateDustyBlueHTML(data: ResumeData, options: TemplateOptions): string {
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
    ? data.skills.map(skill => `<div class="skill-tag">${skill}</div>`).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
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
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Source Sans Pro', sans-serif;
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
      width: 2.4in;
      background: ${accentColor}18;
      padding: 0.5in 0.3in;
      border-right: 4px solid ${accentColor};
    }

    .photo-container {
      width: 95px;
      height: 95px;
      border-radius: 50%;
      background: #ddd;
      margin: 0 auto 16px;
      border: 3px solid ${accentColor};
      overflow: hidden;
    }

    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sidebar-name {
      font-family: 'Libre Baskerville', serif;
      font-size: 14pt;
      font-weight: 700;
      color: ${accentColor};
      text-align: center;
      margin-bottom: 4px;
    }

    .sidebar-title {
      font-size: 9pt;
      color: #555;
      text-align: center;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .sidebar-section {
      margin-bottom: 18px;
    }

    .sidebar-section-title {
      font-family: 'Libre Baskerville', serif;
      font-size: 10pt;
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid ${accentColor}50;
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
      color: #888;
    }

    .skill-tag {
      display: inline-block;
      font-size: 7.5pt;
      color: ${accentColor};
      background: white;
      padding: 3px 8px;
      border-radius: 3px;
      margin: 2px;
      border: 1px solid ${accentColor}50;
    }

    .main {
      flex: 1;
      padding: 0.5in 0.5in 0.4in 0.4in;
    }

    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-family: 'Libre Baskerville', serif;
      font-size: 12pt;
      font-weight: 700;
      color: ${accentColor};
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
      font-style: italic;
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
      color: #444;
    }

    .bullet-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${accentColor};
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
        <div class="section-title">Professional Summary</div>
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
