import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const executiveModernMetadata: TemplateMetadata = {
  id: 'executive-modern',
  name: 'Executive Modern',
  category: 'executive',
  layout: 'single',
  description: 'Executive style with modern touches',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateExecutiveModernHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showLanguages } = options;
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
      <div class="edu-header">
        <span class="edu-degree">${edu.degree}${edu.specialty ? `, ${edu.specialty}` : ''}</span>
        <span class="edu-dates">${edu.dates || ''}</span>
      </div>
      <div class="edu-school">${edu.school}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(' • ')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+Pro:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Source Sans Pro', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #2d2d2d;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in 0.65in;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 3px double ${accentColor};
    }

    .photo-container {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #e5e7eb;
      margin: 0 auto 12px;
      overflow: hidden;
    }

    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .name {
      font-family: 'Libre Baskerville', serif;
      font-size: 26pt;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 600;
      color: ${accentColor};
      margin-top: 4px;
      letter-spacing: 1px;
    }

    .contact-line {
      font-size: 8.5pt;
      color: #555;
      margin-top: 8px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-family: 'Libre Baskerville', serif;
      font-size: 11pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
      text-align: center;
    }

    .summary-text {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.7;
      text-align: center;
      font-style: italic;
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
      font-weight: 700;
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
      color: ${accentColor};
      margin-bottom: 4px;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 9pt;
      line-height: 1.5;
      margin-bottom: 3px;
      padding-left: 16px;
      position: relative;
    }

    .bullet-list li::before {
      content: "▸";
      position: absolute;
      left: 0;
      color: ${accentColor};
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
      font-size: 8.5pt;
      color: #666;
      font-style: italic;
    }

    .edu-school {
      font-size: 9pt;
      color: #555;
    }

    .skills-text {
      font-size: 9pt;
      color: #333;
      text-align: center;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${showPhoto ? `<div class="photo-container">${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" />` : ''}</div>` : ''}
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      <div class="contact-line">${[data.contactInfo.email, data.contactInfo.phone, data.contactInfo.location].filter(Boolean).join(' | ')}</div>
    </div>

    ${data.summary ? `
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="summary-text">${data.summary}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Professional Experience</div>
      ${experienceHTML}
    </div>

    <div class="two-col">
      <div class="section">
        <div class="section-title">Education</div>
        ${educationHTML}
      </div>

      ${skillsHTML ? `
      <div class="section">
        <div class="section-title">Core Competencies</div>
        <div class="skills-text">${skillsHTML}</div>
      </div>
      ` : ''}
    </div>

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications & Credentials</div>
      <div style="text-align: center;">
        ${data.certifications.map(cert => `
          <span style="display: inline-block; margin: 0 10px; font-size: 9pt;">
            <strong>${cert.name}</strong>${cert.issuer ? ` — ${cert.issuer}` : ''}
          </span>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${showLanguages && data.languages && data.languages.length > 0 ? `
    <div class="section">
      <div class="section-title">Languages</div>
      <div class="skills-text">${data.languages.join(' • ')}</div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
