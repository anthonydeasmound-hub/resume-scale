import { ResumeData } from '@/types/resume';

export function generateBasicHTML(data: ResumeData): string {
  const experienceHTML = data.experience.map(exp => {
    // Handle description as either string or array of bullets
    const bullets = Array.isArray(exp.description)
      ? exp.description // Use all selected bullets
      : [exp.description];
    const bulletHTML = bullets.map(bullet => `<li>${bullet}</li>`).join('');

    return `
    <div class="experience-item">
      <div class="company-name">${exp.company.toUpperCase()}</div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="education-item">
      <div class="specialty">${edu.specialty || edu.degree}</div>
      <div class="school">${edu.school}</div>
      <div class="dates">${edu.dates || ''}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills?.map(skill => `
    <div class="skill-item">${typeof skill === 'string' ? skill : skill}</div>
  `).join('') || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: Letter;
      margin: 0;
    }

    body {
      font-family: 'DM Sans', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      width: 8.5in;
      height: 11in;
    }

    .page {
      width: 8.5in;
      height: 11in;
      padding: 0.75in;
      overflow: hidden;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .name {
      font-family: 'DM Serif Display', serif;
      font-size: 42pt;
      font-weight: 400;
      color: #1a1a1a;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .job-title-header {
      font-family: 'DM Sans', sans-serif;
      font-size: 12pt;
      color: #666;
      letter-spacing: 3px;
      text-transform: uppercase;
    }

    /* Two column layout */
    .content {
      display: flex;
      gap: 40px;
    }

    .left-column {
      width: 2.5in;
      overflow: hidden;
    }

    .right-column {
      flex: 1;
      overflow: hidden;
    }

    /* Section styling */
    .section {
      margin-bottom: 28px;
    }

    .section-title {
      font-family: 'DM Serif Display', serif;
      font-size: 14pt;
      font-weight: 400;
      color: #1a1a1a;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Contact items */
    .contact-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      font-size: 10.5pt;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .contact-icon {
      width: 14px;
      height: 14px;
      min-width: 14px;
      margin-right: 10px;
      margin-top: 2px;
      color: #1a1a1a;
    }

    .contact-text {
      flex: 1;
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-all;
    }

    /* Education items */
    .education-item {
      margin-bottom: 16px;
    }

    .education-item .specialty {
      font-weight: 700;
      font-size: 10.5pt;
    }

    .education-item .school {
      font-size: 10.5pt;
      color: #444;
    }

    .education-item .dates {
      font-size: 10.5pt;
      color: #666;
    }

    /* Skills */
    .skill-item {
      font-size: 10.5pt;
      margin-bottom: 6px;
      color: #1a1a1a;
    }

    /* Experience items */
    .experience-item {
      margin-bottom: 16px;
    }

    .experience-item .company-name {
      font-weight: 700;
      font-size: 10.5pt;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .bullet-list li {
      font-size: 10pt;
      color: #333;
      line-height: 1.5;
      margin-bottom: 4px;
      padding-left: 12px;
      position: relative;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .bullet-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #333;
    }

    /* Summary */
    .summary-text {
      font-size: 10.5pt;
      color: #333;
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="name">${data.contactInfo.name}</div>
      <div class="job-title-header">${data.jobTitle}</div>
    </div>

    <div class="content">
      <div class="left-column">
        <div class="section">
          <div class="section-title">Contact</div>
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            <span class="contact-text">${data.contactInfo.phone}</span>
          </div>
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <span class="contact-text">${data.contactInfo.email}</span>
          </div>
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span class="contact-text">${data.contactInfo.location}</span>
          </div>
          ${data.contactInfo.linkedin ? `
          <div class="contact-item">
            <svg class="contact-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
            </svg>
            <span class="contact-text">${data.contactInfo.linkedin}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Education</div>
          ${educationHTML}
        </div>

        <div class="section">
          <div class="section-title">Key Skills</div>
          ${skillsHTML}
        </div>
      </div>

      <div class="right-column">
        <div class="section">
          <div class="section-title">Summary</div>
          <div class="summary-text">${data.summary}</div>
        </div>

        <div class="section">
          <div class="section-title">Work Experience</div>
          ${experienceHTML}
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
