import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const modernMinimalMetadata: TemplateMetadata = {
  id: 'modern-minimal',
  name: 'Modern Minimal',
  category: 'modern',
  layout: 'single',
  description: 'Ultra-clean minimal single column layout',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateModernMinimalHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showLanguages } = options;
  const photoUrl = data.profilePhotoUrl;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-header">
        <div>
          <span class="exp-title">${exp.title}</span>
          <span class="exp-company"> — ${exp.company}</span>
        </div>
        <span class="exp-dates">${exp.dates}</span>
      </div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <span class="edu-degree">${edu.degree}</span>
      ${edu.specialty ? `<span class="edu-field">, ${edu.specialty}</span>` : ''}
      <span class="edu-school"> — ${edu.school}</span>
      ${edu.dates ? `<span class="edu-dates"> (${edu.dates})</span>` : ''}
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(' / ')
    : '';

  const contactParts = [
    data.contactInfo.email,
    data.contactInfo.phone,
    data.contactInfo.location,
    data.contactInfo.linkedin
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 9.5pt;
      line-height: 1.6;
      color: #1a1a1a;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.6in 0.7in;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content {
      flex: 1;
    }

    .name {
      font-size: 30pt;
      font-weight: 300;
      color: #1a1a1a;
      line-height: 1.1;
      letter-spacing: -1px;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 500;
      color: ${accentColor};
      margin-top: 6px;
    }

    .contact-line {
      font-size: 8.5pt;
      color: #666;
      margin-top: 12px;
    }

    .photo-container {
      width: 80px;
      height: 80px;
      border-radius: 4px;
      background: #f3f4f6;
      flex-shrink: 0;
      margin-left: 24px;
      overflow: hidden;
    }

    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .divider {
      height: 1px;
      background: #e5e7eb;
      margin-bottom: 20px;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 8pt;
      font-weight: 600;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }

    .summary-text {
      font-size: 9.5pt;
      color: #444;
      line-height: 1.7;
      font-weight: 300;
    }

    .experience-item {
      margin-bottom: 16px;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .exp-title {
      font-weight: 600;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-company {
      font-weight: 400;
      color: #555;
    }

    .exp-dates {
      font-size: 8.5pt;
      color: #888;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 9pt;
      line-height: 1.6;
      margin-bottom: 2px;
      padding-left: 16px;
      position: relative;
      font-weight: 300;
      color: #333;
    }

    .bullet-list li::before {
      content: "—";
      position: absolute;
      left: 0;
      color: ${accentColor};
    }

    .edu-item {
      font-size: 9pt;
      margin-bottom: 6px;
      font-weight: 300;
    }

    .edu-degree {
      font-weight: 500;
      color: #1a1a1a;
    }

    .edu-field {
      color: #444;
    }

    .edu-school {
      color: #666;
    }

    .edu-dates {
      color: #888;
      font-size: 8.5pt;
    }

    .skills-text {
      font-size: 9pt;
      color: #444;
      font-weight: 300;
    }

    .inline-section {
      display: flex;
      gap: 40px;
    }

    .inline-section > div {
      flex: 1;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-content">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
        <div class="contact-line">${contactParts.join(' · ')}</div>
      </div>
      ${showPhoto ? `<div class="photo-container">${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" />` : ''}</div>` : ''}
    </div>

    <div class="divider"></div>

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

    <div class="inline-section">
      <div class="section">
        <div class="section-title">Education</div>
        ${educationHTML}
      </div>

      ${skillsHTML ? `
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills-text">${skillsHTML}</div>
      </div>
      ` : ''}
    </div>

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      ${data.certifications.map(cert => `
        <div class="edu-item">
          <span class="edu-degree">${cert.name}</span>
          ${cert.issuer ? `<span class="edu-school"> — ${cert.issuer}</span>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${showLanguages && data.languages && data.languages.length > 0 ? `
    <div class="section">
      <div class="section-title">Languages</div>
      <div class="skills-text">${data.languages.join(' / ')}</div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
