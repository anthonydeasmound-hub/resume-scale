import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const corporateCleanMetadata: TemplateMetadata = {
  id: 'corporate-clean',
  name: 'Corporate Clean',
  category: 'professional',
  layout: 'single',
  description: 'Clean single-column with photo and label headers',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateCorporateCleanHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showLanguages } = options;

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

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(', ')
    : '';

  const additionalInfo = [];
  if (skillsHTML) additionalInfo.push(`<li><strong>Technical Skills:</strong> ${skillsHTML}</li>`);
  if (showLanguages && data.languages && data.languages.length > 0) {
    additionalInfo.push(`<li><strong>Languages:</strong> ${data.languages.join(', ')}</li>`);
  }
  if (data.certifications && data.certifications.length > 0) {
    additionalInfo.push(`<li><strong>Certifications:</strong> ${data.certifications.map(c => c.name).join(', ')}</li>`);
  }
  if (data.honors && data.honors.length > 0) {
    additionalInfo.push(`<li><strong>Awards/Activities:</strong> ${data.honors.map(h => h.title).join(', ')}</li>`);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
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
      padding: 0.5in 0.6in;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .header-left {
      flex: 1;
    }

    .name {
      font-size: 26pt;
      font-weight: 800;
      color: #1a1a1a;
      line-height: 1.1;
      text-transform: uppercase;
    }

    .contact-table {
      margin-top: 8px;
      font-size: 8.5pt;
      color: #444;
    }

    .contact-table td {
      padding: 2px 0;
    }

    .contact-table td:first-child {
      font-weight: 600;
      padding-right: 12px;
      color: #1a1a1a;
    }

    .photo-container {
      width: 90px;
      height: 90px;
      border-radius: 4px;
      background: #e5e7eb;
      overflow: hidden;
      flex-shrink: 0;
      margin-left: 20px;
    }

    .section {
      margin-bottom: 14px;
    }

    .section-title {
      display: inline-block;
      font-size: 9pt;
      font-weight: 700;
      color: white;
      background: ${accentColor};
      padding: 3px 10px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .summary-text {
      font-size: 9pt;
      color: #333;
      line-height: 1.6;
      text-align: justify;
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
      font-weight: 700;
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
      font-weight: 700;
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
      <div class="header-left">
        <div class="name">${data.contactInfo.name}</div>
        <table class="contact-table">
          ${data.contactInfo.location ? `<tr><td>Address:</td><td>${data.contactInfo.location}</td></tr>` : ''}
          ${data.contactInfo.phone ? `<tr><td>Phone:</td><td>${data.contactInfo.phone}</td></tr>` : ''}
          ${data.contactInfo.email ? `<tr><td>Email:</td><td>${data.contactInfo.email}</td></tr>` : ''}
          ${data.contactInfo.linkedin ? `<tr><td>Website:</td><td>${data.contactInfo.linkedin}</td></tr>` : ''}
        </table>
      </div>
      ${showPhoto ? '<div class="photo-container"></div>' : ''}
    </div>

    ${data.summary ? `
    <div class="section">
      <div class="section-title">About Me</div>
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
