import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const summitMetadata: TemplateMetadata = {
  id: 'summit',
  name: 'Summit',
  category: 'executive',
  layout: 'single',
  description: 'C-suite elegance',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateSummitHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');

    return `
    <div class="experience-item">
      <div class="exp-header">
        <div class="exp-left">
          <div class="exp-title">${exp.title}</div>
          <div class="exp-company">${exp.company}</div>
        </div>
        <div class="exp-dates">${exp.dates}</div>
      </div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <div class="edu-left">
        <div class="edu-degree">${edu.degree}${edu.specialty ? ` in ${edu.specialty}` : ''}</div>
        <div class="edu-school">${edu.school}</div>
      </div>
      ${edu.dates ? `<div class="edu-dates">${edu.dates}</div>` : ''}
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? `<div class="skills-text">${data.skills.join(' · ')}</div>`
    : '';

  const languagesHTML = data.languages && data.languages.length > 0
    ? `<div class="skills-text">${data.languages.join(' · ')}</div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Lato', sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #2c2c2c;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.6in 0.8in;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 3px double ${accentColor};
    }

    ${showPhoto ? `
    .photo-placeholder {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: #f0f0f0;
      margin: 0 auto 16px;
      border: 2px solid ${accentColor};
    }
    ` : ''}

    .name {
      font-family: 'Cormorant Garamond', serif;
      font-size: 36pt;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .job-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 14pt;
      font-weight: 400;
      color: ${accentColor};
      letter-spacing: 3px;
      margin-bottom: 12px;
    }

    .contact-line {
      font-size: 9pt;
      color: #555;
      letter-spacing: 1px;
    }

    /* Sections */
    .section {
      margin-bottom: 22px;
    }

    .section-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 13pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 14px;
      text-align: center;
      position: relative;
    }

    .section-title::before,
    .section-title::after {
      content: "";
      position: absolute;
      top: 50%;
      width: 60px;
      height: 1px;
      background: #ddd;
    }

    .section-title::before {
      left: 0;
    }

    .section-title::after {
      right: 0;
    }

    .summary-text {
      font-size: 10pt;
      color: #333;
      line-height: 1.8;
      text-align: center;
      max-width: 6in;
      margin: 0 auto;
      font-style: italic;
    }

    /* Experience */
    .experience-item {
      margin-bottom: 18px;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }

    .exp-title {
      font-weight: 700;
      font-size: 11pt;
      color: #1a1a1a;
    }

    .exp-company {
      font-size: 10pt;
      color: #555;
    }

    .exp-dates {
      font-size: 9pt;
      color: ${accentColor};
      text-align: right;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 9.5pt;
      line-height: 1.6;
      margin-bottom: 4px;
      padding-left: 18px;
      position: relative;
    }

    .bullet-list li::before {
      content: "◆";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-size: 6pt;
      top: 4px;
    }

    /* Skills */
    .skills-text {
      font-size: 9.5pt;
      color: #444;
      text-align: center;
      letter-spacing: 0.5px;
    }

    /* Education */
    .edu-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .edu-degree {
      font-weight: 700;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .edu-school {
      font-size: 9.5pt;
      color: #555;
    }

    .edu-dates {
      font-size: 9pt;
      color: ${accentColor};
    }

    /* Footer line */
    .footer-line {
      margin-top: 30px;
      text-align: center;
    }

    .footer-line::before {
      content: "❖";
      color: ${accentColor};
      font-size: 12pt;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${showPhoto ? '<div class="photo-placeholder"></div>' : ''}
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      <div class="contact-line">
        ${[data.contactInfo.location, data.contactInfo.phone, data.contactInfo.email].filter(Boolean).join(' · ')}
      </div>
    </div>

    ${data.summary ? `
    <div class="section">
      <div class="section-title">Executive Profile</div>
      <div class="summary-text">${data.summary}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Professional Experience</div>
      ${experienceHTML}
    </div>

    ${skillsHTML ? `
    <div class="section">
      <div class="section-title">Areas of Expertise</div>
      ${skillsHTML}
    </div>
    ` : ''}

    ${languagesHTML ? `
    <div class="section">
      <div class="section-title">Languages</div>
      ${languagesHTML}
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Education</div>
      ${educationHTML}
    </div>

    <div class="footer-line"></div>
  </div>
</body>
</html>
  `;
}
