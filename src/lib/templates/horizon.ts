import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const horizonMetadata: TemplateMetadata = {
  id: 'horizon',
  name: 'Horizon',
  category: 'modern',
  layout: 'two-column-left',
  description: 'Clean, contemporary design',
  supportsPhoto: true,
  supportsSkillBars: true,
  supportsIcons: true,
};

export function generateHorizonHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showSkillBars, showIcons } = options;

  // Create a lighter version of accent color for sidebar
  const sidebarBg = `${accentColor}12`;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li>${bullet}</li>`).join('');

    return `
    <div class="experience-item">
      <div class="exp-title">${exp.title}</div>
      <div class="exp-company">${exp.company}</div>
      <div class="exp-dates">${exp.dates}</div>
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
    ? data.skills.map(skill => {
        if (showSkillBars) {
          return `
            <div class="skill-item">
              <span class="skill-name">${skill}</span>
              <div class="skill-bar"><div class="skill-fill" style="width: ${70 + Math.random() * 30}%"></div></div>
            </div>
          `;
        }
        return `<span class="skill-tag">${skill}</span>`;
      }).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
      location: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
      linkedin: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>',
    };
    return icons[name] || '';
  };

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
      width: 2.5in;
      background: ${sidebarBg};
      padding: 0.5in 0.35in;
    }

    .photo-placeholder {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: #ddd;
      margin: 0 auto 20px;
      border: 3px solid ${accentColor};
    }

    .sidebar-section {
      margin-bottom: 20px;
    }

    .sidebar-title {
      font-size: 10pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid ${accentColor};
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 8.5pt;
      margin-bottom: 8px;
      word-break: break-word;
    }

    .icon {
      width: 14px;
      height: 14px;
      color: ${accentColor};
      flex-shrink: 0;
    }

    /* Skills */
    .skill-item {
      margin-bottom: 8px;
    }

    .skill-name {
      font-size: 8.5pt;
      display: block;
      margin-bottom: 3px;
    }

    .skill-bar {
      height: 6px;
      background: #ddd;
      border-radius: 3px;
      overflow: hidden;
    }

    .skill-fill {
      height: 100%;
      background: ${accentColor};
      border-radius: 3px;
    }

    .skill-tag {
      display: inline-block;
      background: white;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 8pt;
      margin: 2px;
      border: 1px solid ${accentColor};
    }

    /* Education in sidebar */
    .edu-item {
      margin-bottom: 12px;
    }

    .edu-degree {
      font-weight: 600;
      font-size: 9pt;
      color: #1a1a1a;
    }

    .edu-field {
      font-size: 8.5pt;
      color: #555;
    }

    .edu-school {
      font-size: 8.5pt;
      color: #666;
    }

    .edu-dates {
      font-size: 8pt;
      color: #888;
    }

    /* Main content */
    .main {
      flex: 1;
      padding: 0.5in 0.5in 0.5in 0.4in;
    }

    .name {
      font-size: 26pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .job-title {
      font-size: 13pt;
      font-weight: 500;
      color: ${accentColor};
      margin-bottom: 16px;
    }

    .section {
      margin-bottom: 18px;
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
      font-size: 9.5pt;
      color: #444;
      line-height: 1.6;
    }

    /* Experience */
    .experience-item {
      margin-bottom: 14px;
    }

    .exp-title {
      font-weight: 600;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-company {
      font-size: 9.5pt;
      color: #555;
    }

    .exp-dates {
      font-size: 8.5pt;
      color: ${accentColor};
      margin-bottom: 4px;
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
      content: "●";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-size: 6pt;
      top: 3px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sidebar">
      ${showPhoto ? '<div class="photo-placeholder"></div>' : ''}

      <div class="sidebar-section">
        <div class="sidebar-title">Contact</div>
        ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
        ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
        ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
        ${data.contactInfo.linkedin ? `<div class="contact-item">${icon('linkedin')}${data.contactInfo.linkedin}</div>` : ''}
      </div>

      ${skillsHTML ? `
      <div class="sidebar-section">
        <div class="sidebar-title">Skills</div>
        ${showSkillBars ? skillsHTML : `<div style="display: flex; flex-wrap: wrap; gap: 4px;">${skillsHTML}</div>`}
      </div>
      ` : ''}

      <div class="sidebar-section">
        <div class="sidebar-title">Education</div>
        ${educationHTML}
      </div>
    </div>

    <div class="main">
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}

      ${data.summary ? `
      <div class="section">
        <div class="section-title">About Me</div>
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
