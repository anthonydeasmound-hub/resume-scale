import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const boldHeaderMetadata: TemplateMetadata = {
  id: 'bold-header',
  name: 'Bold Header',
  category: 'modern',
  layout: 'single',
  description: 'Bold header block with photo option',
  supportsPhoto: true,
  supportsSkillBars: false,
  supportsIcons: false,
};

export function generateBoldHeaderHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showLanguages } = options;
  const photoUrl = data.profilePhotoUrl;

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

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <div class="edu-header">
        <span class="edu-degree">${edu.degree}${edu.specialty ? ` - ${edu.specialty}` : ''}</span>
        <span class="edu-dates">${edu.dates || ''}</span>
      </div>
      <div class="edu-school">${edu.school}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
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
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Poppins', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #333;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
    }

    .header {
      background: ${accentColor};
      color: white;
      padding: 0.4in 0.6in;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content {
      flex: 1;
    }

    .name {
      font-size: 28pt;
      font-weight: 800;
      line-height: 1.1;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 500;
      opacity: 0.9;
      margin-top: 4px;
      letter-spacing: 1px;
    }

    .contact-line {
      font-size: 8pt;
      opacity: 0.85;
      margin-top: 10px;
    }

    .photo-container {
      width: 85px;
      height: 85px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      flex-shrink: 0;
      margin-left: 20px;
      overflow: hidden;
      border: 3px solid white;
    }

    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .content {
      padding: 0.4in 0.6in;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid ${accentColor};
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
      align-items: baseline;
      margin-bottom: 4px;
    }

    .exp-role {
      font-weight: 600;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-dates {
      font-size: 8pt;
      color: ${accentColor};
      font-weight: 500;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 8.5pt;
      line-height: 1.5;
      margin-bottom: 2px;
      padding-left: 14px;
      position: relative;
    }

    .bullet-list li::before {
      content: "▪";
      position: absolute;
      left: 0;
      color: ${accentColor};
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
      font-size: 8pt;
      color: #666;
    }

    .edu-school {
      font-size: 9pt;
      color: #555;
    }

    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .skill-tag {
      font-size: 8pt;
      color: white;
      background: ${accentColor};
      padding: 4px 12px;
      border-radius: 15px;
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
      <div class="header-content">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
        <div class="contact-line">${contactParts.join(' • ')}</div>
      </div>
      ${showPhoto ? `<div class="photo-container">${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" />` : ''}</div>` : ''}
    </div>

    <div class="content">
      ${data.summary ? `
      <div class="section">
        <div class="section-title">About</div>
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
          <div class="skills-container">${skillsHTML}</div>
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
        <div class="skills-container">${data.languages.map(l => `<span class="skill-tag">${l}</span>`).join('')}</div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
