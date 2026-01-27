import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const cornerstoneMetadata: TemplateMetadata = {
  id: 'cornerstone',
  name: 'Cornerstone',
  category: 'professional',
  layout: 'two-column-left',
  description: 'Balanced two-column',
  supportsPhoto: true,
  supportsSkillBars: true,
  supportsIcons: false,
};

export function generateCornerstoneHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showSkillBars } = options;

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
      <div class="edu-degree">${edu.degree}</div>
      ${edu.specialty ? `<div class="edu-field">${edu.specialty}</div>` : ''}
      <div class="edu-school">${edu.school}</div>
      ${edu.dates ? `<div class="edu-dates">${edu.dates}</div>` : ''}
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map((skill, idx) => {
        if (showSkillBars) {
          const width = 95 - idx * 5;
          return `
            <div class="skill-row">
              <span class="skill-name">${skill}</span>
              <div class="skill-bar"><div class="skill-fill" style="width: ${Math.max(60, width)}%"></div></div>
            </div>
          `;
        }
        return `<div class="skill-item">${skill}</div>`;
      }).join('')
    : '';

  const contactItems = [
    { label: 'Email', value: data.contactInfo.email },
    { label: 'Phone', value: data.contactInfo.phone },
    { label: 'Location', value: data.contactInfo.location },
    { label: 'LinkedIn', value: data.contactInfo.linkedin },
  ].filter(item => item.value);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Slab:wght@700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Roboto', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #333;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      display: flex;
    }

    /* Sidebar */
    .sidebar {
      width: 2.6in;
      background: linear-gradient(180deg, ${accentColor} 0%, ${accentColor}dd 100%);
      padding: 0.5in 0.35in;
      color: white;
    }

    ${showPhoto ? `
    .photo-placeholder {
      width: 110px;
      height: 110px;
      border-radius: 8px;
      background: rgba(255,255,255,0.2);
      margin: 0 auto 20px;
      border: 3px solid rgba(255,255,255,0.5);
    }
    ` : ''}

    .sidebar-name {
      font-family: 'Roboto Slab', serif;
      font-size: 18pt;
      font-weight: 700;
      text-align: center;
      margin-bottom: 4px;
      line-height: 1.2;
    }

    .sidebar-title {
      text-align: center;
      font-size: 10pt;
      opacity: 0.9;
      margin-bottom: 24px;
    }

    .sidebar-section {
      margin-bottom: 22px;
    }

    .sidebar-section-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid rgba(255,255,255,0.3);
    }

    .contact-item {
      margin-bottom: 10px;
    }

    .contact-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.7;
      display: block;
      margin-bottom: 2px;
    }

    .contact-value {
      font-size: 8.5pt;
      word-break: break-word;
    }

    /* Skills in sidebar */
    .skill-row {
      margin-bottom: 10px;
    }

    .skill-name {
      font-size: 8.5pt;
      display: block;
      margin-bottom: 4px;
    }

    .skill-bar {
      height: 6px;
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
      overflow: hidden;
    }

    .skill-fill {
      height: 100%;
      background: white;
      border-radius: 3px;
    }

    .skill-item {
      font-size: 8.5pt;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255,255,255,0.15);
    }

    .skill-item:last-child {
      border-bottom: none;
    }

    /* Education in sidebar */
    .edu-item {
      margin-bottom: 14px;
    }

    .edu-degree {
      font-weight: 700;
      font-size: 9pt;
    }

    .edu-field {
      font-size: 8.5pt;
      opacity: 0.9;
    }

    .edu-school {
      font-size: 8.5pt;
      opacity: 0.8;
    }

    .edu-dates {
      font-size: 8pt;
      opacity: 0.7;
    }

    /* Main content */
    .main {
      flex: 1;
      padding: 0.5in 0.5in 0.5in 0.4in;
    }

    .main-header {
      margin-bottom: 20px;
    }

    .main-name {
      font-family: 'Roboto Slab', serif;
      font-size: 28pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .main-title {
      font-size: 12pt;
      font-weight: 500;
      color: ${accentColor};
    }

    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-family: 'Roboto Slab', serif;
      font-size: 12pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid ${accentColor};
    }

    .summary-text {
      font-size: 9.5pt;
      color: #444;
      line-height: 1.7;
    }

    /* Experience */
    .experience-item {
      margin-bottom: 16px;
    }

    .exp-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }

    .exp-title {
      font-weight: 700;
      font-size: 10.5pt;
      color: #1a1a1a;
    }

    .exp-dates {
      font-size: 8.5pt;
      color: ${accentColor};
    }

    .exp-company {
      font-size: 9.5pt;
      color: #666;
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
    }

    .bullet-list li::before {
      content: "■";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-size: 5pt;
      top: 4px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sidebar">
      ${showPhoto ? '<div class="photo-placeholder"></div>' : ''}
      <div class="sidebar-name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="sidebar-title">${data.jobTitle}</div>` : ''}

      <div class="sidebar-section">
        <div class="sidebar-section-title">Contact</div>
        ${contactItems.map(item => `
          <div class="contact-item">
            <span class="contact-label">${item.label}</span>
            <span class="contact-value">${item.value}</span>
          </div>
        `).join('')}
      </div>

      ${skillsHTML ? `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Skills</div>
        ${skillsHTML}
      </div>
      ` : ''}

      <div class="sidebar-section">
        <div class="sidebar-section-title">Education</div>
        ${educationHTML}
      </div>
    </div>

    <div class="main">
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
    </div>
  </div>
</body>
</html>
  `;
}
