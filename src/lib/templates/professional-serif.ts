import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const professionalSerifMetadata: TemplateMetadata = {
  id: 'professional-serif',
  name: 'Professional Serif',
  category: 'professional',
  layout: 'single',
  description: 'Traditional serif typography style',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateProfessionalSerifHTML(data: ResumeData, options: TemplateOptions): string {
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
    ? data.skills.join(' • ')
    : '';

  const contactParts = [
    data.contactInfo.email,
    data.contactInfo.phone,
    data.contactInfo.location
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Lato', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #2d2d2d;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.55in 0.7in;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #333;
    }

    .name {
      font-family: 'EB Garamond', serif;
      font-size: 28pt;
      font-weight: 600;
      color: #1a1a1a;
      letter-spacing: 2px;
    }

    .job-title {
      font-family: 'EB Garamond', serif;
      font-size: 12pt;
      font-weight: 400;
      color: ${accentColor};
      font-style: italic;
      margin-top: 4px;
    }

    .contact-line {
      font-size: 9pt;
      color: #555;
      margin-top: 10px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-family: 'EB Garamond', serif;
      font-size: 13pt;
      font-weight: 600;
      color: ${accentColor};
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }

    .summary-text {
      font-size: 10pt;
      color: #333;
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
      font-weight: 700;
      font-size: 10.5pt;
      color: #1a1a1a;
    }

    .exp-dates {
      font-size: 9pt;
      color: #666;
      font-style: italic;
    }

    .exp-company {
      font-size: 10pt;
      color: #555;
      font-style: italic;
      margin-bottom: 4px;
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
      margin-bottom: 10px;
    }

    .edu-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .edu-degree {
      font-weight: 700;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .edu-dates {
      font-size: 9pt;
      color: #666;
      font-style: italic;
    }

    .edu-school {
      font-size: 9.5pt;
      color: #555;
      font-style: italic;
    }

    .skills-text {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.8;
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
      <div class="section-title">Experience</div>
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
      <div class="skills-text">${data.certifications.map(c => c.name).join(' • ')}</div>
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
