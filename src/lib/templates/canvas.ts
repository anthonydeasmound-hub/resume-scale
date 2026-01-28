import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const canvasMetadata: TemplateMetadata = {
  id: 'canvas',
  name: 'Canvas',
  category: 'creative',
  layout: 'two-column-right',
  description: 'Bold and artistic',
  supportsPhoto: true,
  supportsSkillBars: true,
  supportsIcons: true,
};

export function generateCanvasHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showSkillBars, showIcons, showLanguages } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');

    return `
    <div class="experience-item">
      <div class="exp-marker"></div>
      <div class="exp-content">
        <div class="exp-dates">${exp.dates}</div>
        <div class="exp-title">${exp.title}</div>
        <div class="exp-company">${exp.company}</div>
        <ul class="bullet-list">${bulletHTML}</ul>
      </div>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <div class="edu-degree">${edu.degree}</div>
      ${edu.specialty ? `<div class="edu-field">${edu.specialty}</div>` : ''}
      <div class="edu-school">${edu.school}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map((skill, idx) => {
        if (showSkillBars) {
          const width = 100 - idx * 8;
          return `
            <div class="skill-item">
              <span class="skill-name">${skill}</span>
              <div class="skill-bar"><div class="skill-fill" style="width: ${Math.max(60, width)}%"></div></div>
            </div>
          `;
        }
        return `<span class="skill-chip">${skill}</span>`;
      }).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 6l-10 7-10-7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+Pro:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Source Sans Pro', sans-serif;
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

    /* Main content - left side */
    .main {
      flex: 1;
      padding: 0.5in 0.4in 0.5in 0.6in;
      background: white;
    }

    /* Header with creative styling */
    .header {
      margin-bottom: 24px;
      position: relative;
    }

    .name {
      font-family: 'Playfair Display', serif;
      font-size: 32pt;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.1;
    }

    .name-underline {
      width: 60px;
      height: 4px;
      background: ${accentColor};
      margin: 10px 0 12px;
    }

    .job-title {
      font-size: 12pt;
      font-weight: 600;
      color: ${accentColor};
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 14pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #ddd;
    }

    .summary-text {
      font-size: 9.5pt;
      color: #444;
      line-height: 1.7;
      font-style: italic;
      border-left: 3px solid ${accentColor};
      padding-left: 14px;
    }

    /* Timeline experience */
    .experience-item {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      position: relative;
    }

    .exp-marker {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${accentColor};
      flex-shrink: 0;
      margin-top: 4px;
    }

    .exp-marker::after {
      content: "";
      position: absolute;
      left: 5px;
      top: 20px;
      bottom: -8px;
      width: 2px;
      background: #e5e7eb;
    }

    .experience-item:last-child .exp-marker::after {
      display: none;
    }

    .exp-content {
      flex: 1;
    }

    .exp-dates {
      font-size: 8.5pt;
      color: ${accentColor};
      font-weight: 600;
      margin-bottom: 2px;
    }

    .exp-title {
      font-weight: 600;
      font-size: 10.5pt;
      color: #1a1a1a;
    }

    .exp-company {
      font-size: 9pt;
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
      padding-left: 12px;
      position: relative;
    }

    .bullet-list li::before {
      content: "—";
      position: absolute;
      left: 0;
      color: ${accentColor};
    }

    /* Sidebar - right side */
    .sidebar {
      width: 2.4in;
      background: #1a1a1a;
      color: white;
      padding: 0.5in 0.35in;
    }

    ${showPhoto ? `
    .photo-placeholder {
      width: 100px;
      height: 100px;
      border-radius: 8px;
      background: #333;
      margin: 0 auto 24px;
      border: 3px solid ${accentColor};
    }
    ` : ''}

    .sidebar-section {
      margin-bottom: 24px;
    }

    .sidebar-title {
      font-family: 'Playfair Display', serif;
      font-size: 11pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid ${accentColor};
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 8.5pt;
      margin-bottom: 10px;
      color: #ccc;
    }

    .icon {
      width: 14px;
      height: 14px;
      color: ${accentColor};
      flex-shrink: 0;
    }

    /* Skills */
    .skill-item {
      margin-bottom: 10px;
    }

    .skill-name {
      font-size: 8.5pt;
      display: block;
      margin-bottom: 4px;
      color: #ddd;
    }

    .skill-bar {
      height: 4px;
      background: #333;
      border-radius: 2px;
      overflow: hidden;
    }

    .skill-fill {
      height: 100%;
      background: ${accentColor};
      border-radius: 2px;
    }

    .skill-chip {
      display: inline-block;
      background: transparent;
      border: 1px solid ${accentColor};
      color: #ddd;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 8pt;
      margin: 3px;
    }

    /* Education */
    .edu-item {
      margin-bottom: 14px;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 9pt;
      color: white;
    }

    .edu-field {
      font-size: 8.5pt;
      color: #aaa;
    }

    .edu-school {
      font-size: 8.5pt;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="main">
      <div class="header">
        <div class="name">${data.contactInfo.name}</div>
        <div class="name-underline"></div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
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
    </div>

    <div class="sidebar">
      ${showPhoto ? '<div class="photo-placeholder"></div>' : ''}

      <div class="sidebar-section">
        <div class="sidebar-title">Contact</div>
        ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
      </div>

      ${skillsHTML ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Expertise</div>
        ${showSkillBars ? skillsHTML : `<div style="display: flex; flex-wrap: wrap;">${skillsHTML}</div>`}
      </div>
      ` : ''}

      <div class="sidebar-section">
        <div class="sidebar-title">Education</div>
        ${educationHTML}
        ${data.honors && data.honors.length > 0 ? `
        ${data.honors.map(honor => `
          <div class="edu-item">
            <div class="edu-degree">${honor.title}</div>
            ${honor.issuer || honor.date ? `<div class="edu-school">${[honor.issuer, honor.date].filter(Boolean).join(', ')}</div>` : ''}
          </div>
        `).join('')}
        ` : ''}
        ${data.certifications && data.certifications.length > 0 ? `
        ${data.certifications.map(cert => `
          <div class="edu-item">
            <div class="edu-degree">${cert.name}</div>
            ${cert.issuer || cert.date ? `<div class="edu-school">${[cert.issuer, cert.date].filter(Boolean).join(', ')}</div>` : ''}
          </div>
        `).join('')}
        ` : ''}
      </div>

      ${showLanguages && data.languages && data.languages.length > 0 ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Languages</div>
        <div style="font-size: 8.5pt; color: #ccc;">${data.languages.join(' • ')}</div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
