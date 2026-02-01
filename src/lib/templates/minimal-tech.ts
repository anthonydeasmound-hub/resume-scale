import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const minimalTechMetadata: TemplateMetadata = {
  id: 'minimal-tech',
  name: 'Minimal Tech',
  category: 'technical',
  layout: 'single',
  description: 'Ultra-clean design with accent bar section titles',
  supportsPhoto: false,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateMinimalTechHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');
    return `
    <div class="experience-item">
      <div class="exp-header">
        <span class="exp-role">${exp.title}, ${exp.company}</span>
        <span class="exp-dates">${exp.dates}</span>
      </div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => {
    const bullets = [];
    if (edu.specialty) bullets.push(`Major in ${edu.specialty}`);
    return `
    <div class="edu-item">
      <div class="edu-header">
        <span class="edu-degree">${edu.degree}</span>
        <span class="edu-dates">${edu.dates || ''}</span>
      </div>
      <div class="edu-school">${edu.school}</div>
      ${bullets.length > 0 ? `<ul class="edu-bullets">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
    </div>
  `;
  }).join('');

  const skillsGrid = data.skills && data.skills.length > 0
    ? `<div class="skills-grid">${data.skills.map(skill => `<span class="skill-item">${skill}</span>`).join('')}</div>`
    : '';

  const additionalInfo = [];
  if (showLanguages && data.languages && data.languages.length > 0) {
    additionalInfo.push(`<li><strong>Languages:</strong> ${data.languages.join(', ')}</li>`);
  }
  if (data.certifications && data.certifications.length > 0) {
    additionalInfo.push(`<li><strong>Certifications:</strong> ${data.certifications.map(c => c.name).join(', ')}</li>`);
  }
  if (data.honors && data.honors.length > 0) {
    additionalInfo.push(`<li><strong>Awards/Activities:</strong> ${data.honors.map(h => h.title).join(', ')}</li>`);
  }

  const contactParts = [
    data.contactInfo.location,
    data.contactInfo.email,
    data.contactInfo.linkedin
  ].filter(Boolean);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Inter', sans-serif;
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
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #ddd;
    }

    .name {
      font-size: 24pt;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .job-title {
      font-size: 10pt;
      font-weight: 500;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }

    .contact-line {
      font-size: 8.5pt;
      color: #666;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
    }

    .summary-text {
      font-size: 9pt;
      color: #333;
      line-height: 1.6;
      text-align: justify;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    .section {
      margin-bottom: 14px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10pt;
      font-weight: 600;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }

    .section-title::before {
      content: '';
      width: 4px;
      height: 14px;
      background: ${accentColor};
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px 16px;
    }

    .skill-item {
      font-size: 9pt;
      color: #333;
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

    .exp-role {
      font-weight: 600;
      font-size: 9.5pt;
      color: #1a1a1a;
    }

    .exp-dates {
      font-size: 8.5pt;
      color: #666;
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
    }

    .edu-school {
      font-size: 9pt;
      color: #444;
    }

    .edu-bullets {
      list-style: disc;
      padding-left: 18px;
      font-size: 8.5pt;
      color: #555;
      margin-top: 2px;
    }

    .additional-list {
      list-style: disc;
      padding-left: 18px;
    }

    .additional-list li {
      font-size: 9pt;
      line-height: 1.6;
      margin-bottom: 4px;
      color: #333;
    }

    .additional-list strong {
      color: #1a1a1a;
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

    ${data.summary ? `<div class="summary-text">${data.summary}</div>` : ''}

    ${skillsGrid ? `
    <div class="section">
      <div class="section-title">Area of Expertise</div>
      ${skillsGrid}
    </div>
    ` : ''}

    ${data.honors && data.honors.length > 0 ? `
    <div class="section">
      <div class="section-title">Key Achievements</div>
      <ul class="bullet-list">
        ${data.honors.map(h => `<li><strong>${h.title}.</strong> ${h.issuer || ''}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Professional Experience</div>
      ${experienceHTML}
    </div>

    <div class="section">
      <div class="section-title">Education</div>
      ${educationHTML}
    </div>

    ${additionalInfo.length > 0 ? `
    <div class="section">
      <div class="section-title">Additional Information</div>
      <ul class="additional-list">
        ${additionalInfo.join('')}
      </ul>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}
