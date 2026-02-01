import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const atsClassicMetadata: TemplateMetadata = {
  id: 'ats-classic',
  name: 'ATS Classic',
  category: 'professional',
  layout: 'single',
  description: 'ATS-optimized classic single column',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateAtsClassicHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showLanguages } = options;

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
        <span class="edu-degree">${edu.degree}${edu.specialty ? ` in ${edu.specialty}` : ''}</span>
        <span class="edu-dates">${edu.dates || ''}</span>
      </div>
      <div class="edu-school">${edu.school}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(', ')
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
  <link href="https://fonts.googleapis.com/css2?family=Georgia&family=Arial&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #000;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in 0.6in;
    }

    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid ${accentColor};
    }

    .name {
      font-size: 22pt;
      font-weight: bold;
      color: #000;
    }

    .job-title {
      font-size: 12pt;
      color: #333;
      margin-top: 4px;
    }

    .contact-line {
      font-size: 9pt;
      color: #333;
      margin-top: 8px;
    }

    .section {
      margin-bottom: 14px;
    }

    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: ${accentColor};
      text-transform: uppercase;
      margin-bottom: 8px;
      padding-bottom: 2px;
      border-bottom: 1px solid ${accentColor};
    }

    .summary-text {
      font-size: 10pt;
      color: #000;
      line-height: 1.5;
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
      font-weight: bold;
      font-size: 10pt;
      color: #000;
    }

    .exp-dates {
      font-size: 9pt;
      color: #333;
    }

    .exp-company {
      font-size: 10pt;
      color: #333;
      margin-bottom: 4px;
    }

    .bullet-list {
      list-style: disc;
      padding-left: 20px;
    }

    .bullet-list li {
      font-size: 10pt;
      line-height: 1.4;
      margin-bottom: 2px;
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
      font-weight: bold;
      font-size: 10pt;
    }

    .edu-dates {
      font-size: 9pt;
      color: #333;
    }

    .edu-school {
      font-size: 10pt;
      color: #333;
    }

    .skills-text {
      font-size: 10pt;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      <div class="contact-line">${contactParts.join(' | ')}</div>
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

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      ${data.certifications.map(cert => `
        <div style="margin-bottom: 4px;">
          <strong>${cert.name}</strong>${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${showLanguages && data.languages && data.languages.length > 0 ? `
    <div class="section">
      <div class="section-title">Languages</div>
      <div class="skills-text">${data.languages.join(', ')}</div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
