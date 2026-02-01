import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const oceanBlueMetadata: TemplateMetadata = {
  id: 'ocean-blue',
  name: 'Ocean Blue',
  category: 'modern',
  layout: 'two-column-left',
  description: 'Fresh ocean blue with wave header design',
  supportsPhoto: true,
  supportsSkillBars: true,
  supportsIcons: true,
};

export function generateOceanBlueHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showPhoto, showSkillBars, showIcons, showLanguages } = options;
  const photoUrl = data.profilePhotoUrl;

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
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
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
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Nunito', sans-serif;
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

    .sidebar {
      width: 2.5in;
      background: linear-gradient(180deg, ${accentColor} 0%, ${accentColor}dd 100%);
      padding: 0;
      color: white;
      position: relative;
    }

    .sidebar-wave {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 80px;
      background: white;
      clip-path: ellipse(120% 100% at 50% 100%);
    }

    .sidebar-content {
      padding: 0.5in 0.3in;
      position: relative;
      z-index: 1;
    }

    .photo-container {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      margin: 0 auto 20px;
      border: 4px solid white;
      overflow: hidden;
    }

    .photo-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sidebar-section {
      margin-bottom: 18px;
    }

    .sidebar-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid rgba(255,255,255,0.3);
    }

    .contact-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 8pt;
      margin-bottom: 8px;
    }

    .icon {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .edu-item {
      margin-bottom: 12px;
    }

    .edu-degree {
      font-weight: 700;
      font-size: 9pt;
    }

    .edu-field {
      font-size: 8pt;
      opacity: 0.9;
    }

    .edu-school {
      font-size: 8pt;
      opacity: 0.85;
    }

    .edu-dates {
      font-size: 7.5pt;
      opacity: 0.7;
    }

    .skill-item {
      margin-bottom: 8px;
    }

    .skill-name {
      font-size: 8pt;
      display: block;
      margin-bottom: 3px;
    }

    .skill-bar {
      height: 5px;
      background: rgba(255,255,255,0.3);
      border-radius: 3px;
      overflow: hidden;
    }

    .skill-fill {
      height: 100%;
      background: white;
      border-radius: 3px;
    }

    .skill-tag {
      display: inline-block;
      font-size: 7.5pt;
      background: rgba(255,255,255,0.2);
      padding: 3px 8px;
      border-radius: 12px;
      margin: 2px;
    }

    .main {
      flex: 1;
      padding: 0.5in 0.5in 0.4in 0.4in;
    }

    .main-header {
      margin-bottom: 20px;
    }

    .name {
      font-size: 26pt;
      font-weight: 800;
      color: ${accentColor};
      line-height: 1.1;
    }

    .job-title {
      font-size: 11pt;
      font-weight: 600;
      color: #555;
      margin-top: 4px;
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
    }

    .exp-title {
      font-weight: 700;
      font-size: 10pt;
      color: #1a1a1a;
    }

    .exp-dates {
      font-size: 8pt;
      color: ${accentColor};
    }

    .exp-company {
      font-size: 9pt;
      color: #555;
      margin-bottom: 4px;
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
      <div class="sidebar-content">
        ${showPhoto ? `<div class="photo-container">${photoUrl ? `<img src="${photoUrl}" alt="Profile photo" />` : ''}</div>` : ''}

        <div class="sidebar-section">
          <div class="sidebar-title">Contact</div>
          ${data.contactInfo.email ? `<div class="contact-item">${icon('email')}${data.contactInfo.email}</div>` : ''}
          ${data.contactInfo.phone ? `<div class="contact-item">${icon('phone')}${data.contactInfo.phone}</div>` : ''}
          ${data.contactInfo.location ? `<div class="contact-item">${icon('location')}${data.contactInfo.location}</div>` : ''}
          ${data.contactInfo.linkedin ? `<div class="contact-item">${icon('linkedin')}${data.contactInfo.linkedin}</div>` : ''}
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">Education</div>
          ${educationHTML}
        </div>

        ${skillsHTML ? `
        <div class="sidebar-section">
          <div class="sidebar-title">Skills</div>
          ${showSkillBars ? skillsHTML : `<div style="display: flex; flex-wrap: wrap;">${skillsHTML}</div>`}
        </div>
        ` : ''}

        ${showLanguages && data.languages && data.languages.length > 0 ? `
        <div class="sidebar-section">
          <div class="sidebar-title">Languages</div>
          <div style="font-size: 8pt;">${data.languages.join(' • ')}</div>
        </div>
        ` : ''}
      </div>
      <div class="sidebar-wave"></div>
    </div>

    <div class="main">
      <div class="main-header">
        <div class="name">${data.contactInfo.name}</div>
        ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      </div>

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

      ${data.certifications && data.certifications.length > 0 ? `
      <div class="section">
        <div class="section-title">Certifications</div>
        ${data.certifications.map(cert => `
          <div style="margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 9pt;">${cert.name}</span>
            ${cert.issuer ? `<span style="font-size: 8pt; color: #666;"> - ${cert.issuer}</span>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${data.honors && data.honors.length > 0 ? `
      <div class="section">
        <div class="section-title">Honors & Awards</div>
        ${data.honors.map(h => `
          <div style="margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 9pt;">${h.title}</span>
            ${h.issuer || h.date ? `<span style="font-size: 8pt; color: #666;"> - ${[h.issuer, h.date].filter(Boolean).join(', ')}</span>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
