import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const executiveMetadata: TemplateMetadata = {
  id: 'executive',
  name: 'Executive',
  category: 'professional',
  layout: 'single',
  description: 'Traditional corporate style',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateExecutiveHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');

    return `
    <div class="experience-item">
      <div class="experience-header">
        <div class="role-company">
          <span class="role">${exp.title}</span>
          <span class="company">${exp.company}</span>
        </div>
        <span class="dates">${exp.dates}</span>
      </div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="education-item">
      <div class="edu-header">
        <span class="degree">${edu.degree}${edu.specialty ? `, ${edu.specialty}` : ''}</span>
        <span class="dates">${edu.dates || ''}</span>
      </div>
      <div class="school">${edu.school}</div>
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
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Open Sans', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #2d2d2d;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.6in 0.75in;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${accentColor};
    }

    ${showPhoto ? `
    .header-with-photo {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .photo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #e5e7eb;
      flex-shrink: 0;
    }
    .header-content { flex: 1; text-align: left; }
    ` : ''}

    .name {
      font-family: 'Libre Baskerville', serif;
      font-size: 28pt;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .job-title {
      font-size: 12pt;
      font-weight: 600;
      color: ${accentColor};
      margin-bottom: 8px;
    }

    .contact-line {
      font-size: 9pt;
      color: #555;
    }

    /* Sections */
    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-family: 'Libre Baskerville', serif;
      font-size: 12pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }

    .summary-text {
      font-size: 10pt;
      color: #333;
      line-height: 1.6;
    }

    /* Experience */
    .experience-item {
      margin-bottom: 14px;
    }

    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .role-company .role {
      font-weight: 600;
      color: #1a1a1a;
    }

    .role-company .company {
      color: #555;
    }

    .role-company .company::before {
      content: " | ";
      color: #999;
    }

    .dates {
      font-size: 9pt;
      color: #666;
      font-style: italic;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 9.5pt;
      line-height: 1.5;
      margin-bottom: 3px;
      padding-left: 16px;
      position: relative;
    }

    .bullet-list li::before {
      content: "▸";
      position: absolute;
      left: 0;
      color: ${accentColor};
    }

    /* Education */
    .education-item {
      margin-bottom: 10px;
    }

    .edu-header {
      display: flex;
      justify-content: space-between;
    }

    .degree {
      font-weight: 600;
      color: #1a1a1a;
    }

    .school {
      font-size: 9.5pt;
      color: #555;
    }

    /* Skills */
    .skills-text {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header${showPhoto ? ' header-with-photo' : ''}">
      ${showPhoto ? '<div class="photo-placeholder"></div><div class="header-content">' : ''}
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      <div class="contact-line">${contactParts.join(' • ')}</div>
      ${showPhoto ? '</div>' : ''}
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

    ${skillsHTML ? `
    <div class="section">
      <div class="section-title">Skills</div>
      <div class="skills-text">${skillsHTML}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Education</div>
      ${educationHTML}
    </div>
  </div>
</body>
</html>
  `;
}
