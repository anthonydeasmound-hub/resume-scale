import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const classicPhotoMetadata: TemplateMetadata = {
  id: 'classic-photo',
  name: 'Classic Photo',
  category: 'professional',
  layout: 'single',
  description: 'Traditional layout with photo in header',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateClassicPhotoHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-header">
        <div class="exp-left">
          <span class="exp-title">${exp.title}</span>
          <span class="exp-company">${exp.company}</span>
        </div>
        <span class="exp-dates">${exp.dates}</span>
      </div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <div class="edu-header">
        <span class="edu-degree">${edu.degree}${edu.specialty ? ` in ${edu.specialty}` : ''}</span>
        <span class="edu-dates">${edu.dates || ''}</span>
      </div>
      <div class="edu-school">${edu.school}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(' • ')
    : '';

  const contactParts = [
    data.contactInfo.location,
    data.contactInfo.phone,
    data.contactInfo.email,
    data.contactInfo.linkedin
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
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
      padding: 0.5in 0.65in;
    }

    .header {
      display: flex;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${accentColor};
    }

    .photo-container {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: #e5e7eb;
      flex-shrink: 0;
      overflow: hidden;
    }

    .header-content {
      flex: 1;
    }

    .name {
      font-family: 'Merriweather', serif;
      font-size: 26pt;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.1;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 600;
      color: ${accentColor};
      margin-top: 4px;
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
      font-family: 'Merriweather', serif;
      font-size: 12pt;
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
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
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .exp-left {
      display: flex;
      flex-direction: column;
    }

    .exp-title {
      font-weight: 600;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-company {
      font-size: 9pt;
      color: #555;
    }

    .exp-dates {
      font-size: 8.5pt;
      color: #666;
      font-style: italic;
    }

    .bullet-list {
      list-style: disc;
      padding-left: 18px;
    }

    .bullet-list li {
      font-size: 9pt;
      line-height: 1.5;
      margin-bottom: 2px;
      color: #333;
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
      line-height: 1.8;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${showPhoto ? '<div class="photo-container"></div>' : ''}
      <div class="header-content">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
        <div class="contact-line">${contactParts.join(' | ')}</div>
      </div>
    </div>

    ${data.summary ? `
    <div class="section">
      <div class="section-title">Professional Summary</div>
      <div class="summary-text">${data.summary}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Work Experience</div>
      ${experienceHTML}
    </div>

    <div class="two-col">
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
        <div style="margin-bottom: 4px;">
          <span style="font-weight: 600;">${cert.name}</span>
          ${cert.issuer ? `<span style="color: #666;"> - ${cert.issuer}</span>` : ''}
        </div>
      `).join('')}
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
