import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const tealHeaderSplitMetadata: TemplateMetadata = {
  id: 'teal-header-split',
  name: 'Teal Header Split',
  category: 'modern',
  layout: 'single',
  description: 'Full-width teal header with photo and two-column body',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateTealHeaderSplitHTML(data: ResumeData, options: TemplateOptions): string {
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
      <div class="edu-degree">${edu.degree}${edu.specialty ? `, ${edu.specialty}` : ''}</div>
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
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Open Sans', sans-serif;
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
      flex-direction: column;
    }

    .header {
      background: ${accentColor};
      padding: 0.35in 0.5in;
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .photo-container {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: white;
      border: 3px solid white;
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
      color: white;
    }

    .name {
      font-family: 'Poppins', sans-serif;
      font-size: 26pt;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 4px;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 500;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 8.5pt;
      opacity: 0.95;
    }

    .icon {
      width: 14px;
      height: 14px;
      stroke: white;
    }

    .body {
      flex: 1;
      display: flex;
      padding: 0.4in 0.5in;
      gap: 0.4in;
    }

    .left-column {
      flex: 1.8;
    }

    .right-column {
      flex: 1;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-family: 'Poppins', sans-serif;
      font-size: 11pt;
      font-weight: 600;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
      margin-bottom: 12px;
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
      font-weight: 500;
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

    .edu-item {
      margin-bottom: 10px;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 9pt;
      color: #1a1a1a;
    }

    .edu-school {
      font-size: 8.5pt;
      color: #555;
    }

    .edu-dates {
      font-size: 8pt;
      color: #777;
    }

    .skill-chip {
      display: inline-block;
      font-size: 8pt;
      color: ${accentColor};
      background: ${accentColor}15;
      padding: 4px 10px;
      border-radius: 4px;
      margin: 2px;
    }

    .languages-text {
      font-size: 8.5pt;
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

    <div class="body">
      <div class="left-column">
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
      </div>

      <div class="right-column">
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
            <div style="margin-bottom: 6px;">
              <div style="font-weight: 600; font-size: 8.5pt;">${cert.name}</div>
              ${cert.issuer ? `<div style="font-size: 8pt; color: #666;">${cert.issuer}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
