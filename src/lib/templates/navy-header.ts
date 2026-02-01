import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const navyHeaderMetadata: TemplateMetadata = {
  id: 'navy-header',
  name: 'Navy Header',
  category: 'professional',
  layout: 'single',
  description: 'Clean design with navy header band and centered photo',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: true,
};

export function generateNavyHeaderHTML(data: ResumeData, options: TemplateOptions): string {
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
        <div class="edu-dates">${edu.dates || ''}</div>
      </div>
      <div class="edu-school">${edu.school}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? `<ul class="skills-list">${data.skills.map(skill => `<li>${skill}</li>`).join('')}</ul>`
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      email: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
      age: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
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

    /* Header Band */
    .header {
      background: ${accentColor};
      padding: 0.4in 0.5in;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .contact-info {
      color: white;
      font-size: 8.5pt;
      line-height: 1.8;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .icon {
      width: 12px;
      height: 12px;
      stroke: white;
      flex-shrink: 0;
    }

    .photo-container {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: #ddd;
      border: 3px solid white;
      overflow: hidden;
      flex-shrink: 0;
    }

    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .name-section {
      text-align: right;
    }

    .name {
      font-family: 'Playfair Display', serif;
      font-size: 28pt;
      font-weight: 700;
      color: white;
      line-height: 1.1;
    }

    .job-title {
      font-size: 10pt;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
    }

    /* Body */
    .body {
      flex: 1;
      padding: 0.4in 0.5in;
    }

    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 13pt;
      font-weight: 600;
      color: ${accentColor};
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid ${accentColor};
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
      font-size: 8.5pt;
      color: #666;
      font-style: italic;
    }

    .exp-company {
      font-size: 9pt;
      color: #555;
      margin-bottom: 4px;
    }

    .bullet-list {
      list-style: disc;
      padding-left: 18px;
      margin: 0;
    }

    .bullet-list li {
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 2px;
      color: #444;
    }

    .skills-list {
      list-style: disc;
      padding-left: 18px;
      columns: 2;
      column-gap: 30px;
    }

    .skills-list li {
      font-size: 9pt;
      line-height: 1.6;
      color: #444;
    }

    .edu-item {
      margin-bottom: 10px;
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
      color: #666;
      font-style: italic;
    }

    .edu-school {
      font-size: 8.5pt;
      color: #555;
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
      <div class="contact-info">
        ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
      </div>

      ${showPhoto ? `<div class="photo-container">${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" />` : ''}</div>` : ''}

      <div class="name-section">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      </div>
    </div>

    <div class="body">
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

      ${skillsHTML ? `
      <div class="section">
        <div class="section-title">Skills</div>
        ${skillsHTML}
      </div>
      ` : ''}

      ${data.education && data.education.length > 0 ? `
      <div class="section">
        <div class="section-title">Education</div>
        ${educationHTML}
      </div>
      ` : ''}

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="section">
        <div class="section-title">Languages</div>
        <div class="languages-text">${data.languages.join(' • ')}</div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
