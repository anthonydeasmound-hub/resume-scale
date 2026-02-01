import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const simpleProfessionalMetadata: TemplateMetadata = {
  id: 'simple-professional',
  name: 'Simple Professional',
  category: 'professional',
  layout: 'single',
  description: 'Clean and simple professional layout',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateSimpleProfessionalHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-header">
        <div>
          <span class="exp-title">${exp.title}</span>
          <span class="exp-sep">|</span>
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
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Source Sans Pro', sans-serif;
      font-size: 10pt;
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
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ddd;
    }

    .name {
      font-size: 24pt;
      font-weight: 700;
      color: #1a1a1a;
    }

    .job-title {
      font-size: 11pt;
      color: ${accentColor};
      margin-top: 2px;
    }

    .contact-line {
      font-size: 9pt;
      color: #555;
      margin-top: 8px;
    }

    .section {
      margin-bottom: 14px;
    }

    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 8px;
      padding-bottom: 2px;
      border-bottom: 1px solid ${accentColor};
    }

    .summary-text {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.6;
    }

    .experience-item {
      margin-bottom: 12px;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .exp-title {
      font-weight: 600;
      color: #1a1a1a;
    }

    .exp-sep {
      color: #999;
      margin: 0 6px;
    }

    .exp-company {
      color: #555;
    }

    .exp-dates {
      font-size: 9pt;
      color: #666;
    }

    .bullet-list {
      list-style: disc;
      padding-left: 20px;
    }

    .bullet-list li {
      font-size: 9.5pt;
      line-height: 1.5;
      margin-bottom: 2px;
      color: #333;
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
      color: #1a1a1a;
    }

    .edu-dates {
      font-size: 9pt;
      color: #666;
    }

    .edu-school {
      font-size: 9.5pt;
      color: #555;
    }

    .skills-text {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.6;
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
      <div class="section-title">Summary</div>
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
      <div class="skills-text">${skillsHTML}</div>
    </div>
    ` : ''}

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      <div class="skills-text">${data.certifications.map(c => c.name).join(', ')}</div>
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
