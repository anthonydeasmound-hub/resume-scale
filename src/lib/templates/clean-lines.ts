import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const cleanLinesMetadata: TemplateMetadata = {
  id: 'clean-lines',
  name: 'Clean Lines',
  category: 'modern',
  layout: 'single',
  description: 'Clean design with horizontal line dividers',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateCleanLinesHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-line"></div>
      <div class="exp-content">
        <div class="exp-header">
          <span class="exp-title">${exp.title}</span>
          <span class="exp-dates">${exp.dates}</span>
        </div>
        <div class="exp-company">${exp.company}</div>
        <ul class="bullet-list">${bulletHTML}</ul>
      </div>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <span class="edu-degree">${edu.degree}</span>
      ${edu.specialty ? `<span class="edu-field"> — ${edu.specialty}</span>` : ''}
      <br><span class="edu-school">${edu.school}</span>
      ${edu.dates ? `<span class="edu-dates"> | ${edu.dates}</span>` : ''}
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map(skill => `<span class="skill-item">${skill}</span>`).join('')
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
  <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Work Sans', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #1a1a1a;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in 0.65in;
    }

    .header {
      margin-bottom: 24px;
    }

    .name {
      font-size: 32pt;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1;
      letter-spacing: -1px;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 400;
      color: ${accentColor};
      margin-top: 6px;
    }

    .contact-line {
      font-size: 8.5pt;
      color: #666;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 9pt;
      font-weight: 600;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 14px;
    }

    .summary-text {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.7;
      font-weight: 300;
    }

    .experience-item {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .exp-line {
      width: 2px;
      background: linear-gradient(180deg, ${accentColor} 0%, ${accentColor}30 100%);
      flex-shrink: 0;
    }

    .exp-content {
      flex: 1;
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
      font-weight: 400;
    }

    .exp-company {
      font-size: 9pt;
      color: #555;
      margin-bottom: 6px;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 9pt;
      line-height: 1.5;
      margin-bottom: 3px;
      padding-left: 14px;
      position: relative;
      font-weight: 300;
      color: #333;
    }

    .bullet-list li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-size: 8pt;
    }

    .edu-item {
      margin-bottom: 10px;
      font-size: 9pt;
    }

    .edu-degree {
      font-weight: 600;
      color: #1a1a1a;
    }

    .edu-field {
      color: #555;
    }

    .edu-school {
      color: #666;
    }

    .edu-dates {
      color: #888;
      font-size: 8.5pt;
    }

    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-item {
      font-size: 8pt;
      color: #333;
      background: #f3f4f6;
      padding: 4px 12px;
      border-radius: 2px;
      font-weight: 400;
    }

    .inline-section {
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
      <div class="contact-line">${contactParts.join(' · ')}</div>
    </div>

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

    <div class="inline-section">
      <div class="section">
        <div class="section-title">Education</div>
        ${educationHTML}
      </div>

      ${skillsHTML ? `
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills-grid">${skillsHTML}</div>
      </div>
      ` : ''}
    </div>

    ${data.certifications && data.certifications.length > 0 ? `
    <div class="section">
      <div class="section-title">Certifications</div>
      ${data.certifications.map(cert => `
        <div class="edu-item">
          <span class="edu-degree">${cert.name}</span>
          ${cert.issuer ? `<span class="edu-field"> — ${cert.issuer}</span>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${showLanguages && data.languages && data.languages.length > 0 ? `
    <div class="section">
      <div class="section-title">Languages</div>
      <div class="skills-grid">${data.languages.map(l => `<span class="skill-item">${l}</span>`).join('')}</div>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
