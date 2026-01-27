import { ResumeData } from '@/types/resume';
import { TemplateMetadata, TemplateOptions } from './index';

export const terminalMetadata: TemplateMetadata = {
  id: 'terminal',
  name: 'Terminal',
  category: 'technical',
  layout: 'single',
  description: 'Developer-focused minimal',
  supportsPhoto: false,
  supportsSkillBars: true,
  supportsIcons: true,
};

export function generateTerminalHTML(data: ResumeData, options: TemplateOptions): string {
  const { accentColor, showSkillBars, showIcons } = options;

  const experienceHTML = data.experience.map(exp => {
    const bullets = Array.isArray(exp.description) ? exp.description : [exp.description];
    const bulletHTML = bullets.filter(b => b).map(bullet => `<li><span class="prompt">&gt;</span> ${bullet}</li>`).join('');

    return `
    <div class="experience-item">
      <div class="exp-header">
        <span class="exp-title">${exp.title}</span>
        <span class="exp-at">@</span>
        <span class="exp-company">${exp.company}</span>
        <span class="exp-dates">// ${exp.dates}</span>
      </div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="edu-item">
      <span class="edu-degree">${edu.degree}</span>
      ${edu.specialty ? `<span class="edu-field">(${edu.specialty})</span>` : ''}
      <span class="edu-school">@ ${edu.school}</span>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.map((skill, idx) => {
        if (showSkillBars) {
          const level = Math.max(3, 5 - Math.floor(idx / 3));
          const bars = '\u2588'.repeat(level) + '\u2591'.repeat(5 - level);
          return `<span class="skill-item">${skill} <span class="skill-level">[${bars}]</span></span>`;
        }
        return `<span class="skill-tag">${skill}</span>`;
      }).join('')
    : '';

  const icon = (name: string) => {
    if (!showIcons) return '';
    const icons: Record<string, string> = {
      email: '<span class="icon">[mail]</span>',
      phone: '<span class="icon">[tel]</span>',
      location: '<span class="icon">[loc]</span>',
      linkedin: '<span class="icon">[in]</span>',
    };
    return icons[name] || '';
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0; }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 9.5pt;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.5in 0.6in;
      background: white;
    }

    /* Header */
    .header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid ${accentColor};
    }

    .header-line {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      color: #9ca3af;
      margin-bottom: 8px;
    }

    .name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 28pt;
      font-weight: 700;
      color: #111827;
      letter-spacing: -1px;
    }

    .job-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11pt;
      color: #4b5563;
      margin-top: 4px;
    }

    .job-title::before {
      content: "$ whoami → ";
      color: ${accentColor};
    }

    .contact-line {
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .contact-item {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      color: #4b5563;
    }

    .icon {
      color: ${accentColor};
      margin-right: 4px;
      font-size: 8pt;
    }

    /* Sections */
    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10pt;
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title::before {
      content: "##";
      color: #d1d5db;
    }

    .section-title::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }

    .summary-text {
      font-size: 9.5pt;
      color: #4b5563;
      line-height: 1.7;
      padding-left: 16px;
      border-left: 3px solid ${accentColor}40;
      background: ${accentColor}08;
      padding: 12px 16px;
      border-radius: 0 4px 4px 0;
    }

    /* Experience */
    .experience-item {
      margin-bottom: 16px;
    }

    .exp-header {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5pt;
      margin-bottom: 6px;
    }

    .exp-title {
      font-weight: 700;
      color: #111827;
    }

    .exp-at {
      color: ${accentColor};
      margin: 0 4px;
    }

    .exp-company {
      color: #6b7280;
    }

    .exp-dates {
      color: #9ca3af;
      margin-left: 8px;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
    }

    .bullet-list li {
      font-size: 9pt;
      line-height: 1.6;
      margin-bottom: 4px;
      padding-left: 20px;
      position: relative;
      color: #374151;
    }

    .prompt {
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
    }

    /* Skills */
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-item {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      color: #374151;
      display: inline-block;
    }

    .skill-level {
      color: ${accentColor};
      font-size: 7pt;
      letter-spacing: -1px;
    }

    .skill-tag {
      font-family: 'JetBrains Mono', monospace;
      display: inline-block;
      background: ${accentColor}10;
      border: 1px solid ${accentColor}30;
      color: #374151;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 8pt;
    }

    /* Education */
    .edu-item {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      margin-bottom: 8px;
    }

    .edu-degree {
      color: #111827;
      font-weight: 600;
    }

    .edu-field {
      color: #6b7280;
      margin: 0 4px;
    }

    .edu-school {
      color: #6b7280;
    }

    /* Footer */
    .footer {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-line">/* Resume v1.0 */</div>
      <div class="name">${data.contactInfo.name}</div>
      ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
      <div class="contact-line">
        ${data.contactInfo.email ? `<span class="contact-item">${icon('email')}${data.contactInfo.email}</span>` : ''}
        ${data.contactInfo.phone ? `<span class="contact-item">${icon('phone')}${data.contactInfo.phone}</span>` : ''}
        ${data.contactInfo.location ? `<span class="contact-item">${icon('location')}${data.contactInfo.location}</span>` : ''}
        ${data.contactInfo.linkedin ? `<span class="contact-item">${icon('linkedin')}${data.contactInfo.linkedin}</span>` : ''}
      </div>
    </div>

    ${data.summary ? `
    <div class="section">
      <div class="section-title">README</div>
      <div class="summary-text">${data.summary}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Experience</div>
      ${experienceHTML}
    </div>

    ${skillsHTML ? `
    <div class="section">
      <div class="section-title">Tech Stack</div>
      <div class="skills-container">${skillsHTML}</div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Education</div>
      ${educationHTML}
    </div>

    <div class="footer">
      // Built with clean code and attention to detail
    </div>
  </div>
</body>
</html>
  `;
}
