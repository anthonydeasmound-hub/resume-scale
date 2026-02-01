import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const minimalPhotoMetadata: TemplateMetadata = {
  id: 'minimal-photo',
  name: 'Minimal Photo',
  category: 'modern',
  layout: 'single',
  description: 'Clean minimal design with photo in header',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateMinimalPhotoHTML(data: ResumeData, options: TemplateOptions): string {
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
      <div class="edu-header">
        <div class="edu-degree">${edu.degree}${edu.specialty ? `, ${edu.specialty}` : ''}</div>
        ${edu.dates ? `<div class="edu-dates">${edu.dates}</div>` : ''}
      </div>
      <div class="edu-school">${edu.school}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map(skill => `<span class="skill-chip">${skill}</span>`).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Outfit', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #333;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in 0.6in;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .photo-container {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: #f0f0f0;
      overflow: hidden;
      flex-shrink: 0;
    }

    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-content {
      flex: 1;
    }

    .name {
      font-size: 26pt;
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

    .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 10px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9pt;
      color: #555;
    }

    .icon {
      width: 14px;
      height: 14px;
      color: ${accentColor};
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
    }

    .summary-text {
      font-size: 9pt;
      color: #444;
      line-height: 1.7;
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
      color: #888;
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

    .edu-item {
      margin-bottom: 8px;
    }

    .edu-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 9.5pt;
      color: #1a1a1a;
    }

    .edu-dates {
      font-size: 8pt;
      color: #888;
    }

    .edu-school {
      font-size: 9pt;
      color: #555;
    }

    .skill-chip {
      display: inline-block;
      font-size: 8pt;
      color: #444;
      background: #f5f5f5;
      padding: 4px 12px;
      border-radius: 20px;
      margin: 2px;
    }

    .languages-text {
      font-size: 9pt;
      color: #444;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${showPhoto ? `<div class="photo-container">${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" />` : ''}</div>` : ''}
      <div class="header-content">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
        <div class="contact-row">
          ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
          ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
          ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
        </div>
      </div>
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

    <div class="section">
      <div class="section-title">Education</div>
      ${educationHTML}
    </div>

    ${skillsHTML ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div style="display: flex; flex-wrap: wrap; margin: -2px;">${skillsHTML}</div>
    </div>
    ` : ''}

    ${showLanguages && data.languages && data.languages.length > 0 ? `
    <div class="section">
      <div class="section-title">Languages</div>
      <div class="languages-text">${data.languages.join(' • ')}</div>
    </div>
    ` : ''}

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      ${data.certifications.map(cert => `
        <div style="margin-bottom: 4px;">
          <span style="font-weight: 600; font-size: 9pt;">${cert.name}</span>
          ${cert.issuer ? `<span style="font-size: 8pt; color: #666;"> — ${cert.issuer}</span>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
