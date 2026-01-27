import { ResumeData } from '@/types/resume';

export function generateProfessionalHTML(data: ResumeData, accentColor: string = "#7C3AED"): string {
  const experienceHTML = data.experience.map(exp => {
    // Handle description as either string or array of bullets
    const bullets = Array.isArray(exp.description)
      ? exp.description // Use all selected bullets
      : [exp.description];
    const bulletHTML = bullets.map(bullet => `<li>${bullet}</li>`).join('');

    return `
    <div class="experience-item">
      <div class="experience-header">
        <span class="role-company">${exp.title}, ${exp.company}</span>
        <span class="dates">${exp.dates}</span>
      </div>
      <ul class="bullet-list">${bulletHTML}</ul>
    </div>
  `;
  }).join('');

  const educationHTML = data.education.map(edu => `
    <div class="education-item">
      <div class="degree">${edu.degree}</div>
      <div class="school">${edu.school}</div>
    </div>
  `).join('');

  const skillsHTML = data.skills && data.skills.length > 0
    ? data.skills.join(' | ')
    : '';

  // Build contact line
  const contactParts = [
    data.contactInfo.location,
    data.contactInfo.phone,
    data.contactInfo.email
  ].filter(Boolean);
  const contactLine = contactParts.join(' • ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
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
      font-family: 'Inter', sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #333;
      width: 8.5in;
      height: 11in;
      overflow: hidden;
    }

    .page {
      width: 8.5in;
      height: 11in;
      padding: 0.6in 0.7in;
      position: relative;
      overflow: hidden;
    }

    .main-content {
      /* Leave space for footer: Skills (~1.1in) + Education (~0.6in) = ~1.7in from bottom */
      /* Footer moved to 0.4in from bottom, giving 0.2in more room */
      max-height: 6.6in;
      overflow: hidden;
    }

    .footer-sections {
      position: absolute;
      bottom: 0.4in;
      left: 0.7in;
      right: 0.7in;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 8px;
    }

    .name {
      font-size: 26.3pt;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }

    .contact-line {
      font-size: 9.5pt;
      color: #333;
      margin-bottom: 2px;
    }

    .linkedin {
      font-size: 9.5pt;
      color: #333;
    }

    /* Section styling */
    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 12.2pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #ccc;
    }

    /* Summary text */
    .summary-text {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.5;
    }

    /* Experience items */
    .experience-item {
      margin-bottom: 14px;
    }

    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }

    .role-company {
      font-size: 9.5pt;
      font-weight: 600;
      color: #1a1a1a;
    }

    .dates {
      font-size: 9.5pt;
      color: #333;
    }

    .bullet-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .bullet-list li {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.5;
      margin-bottom: 2px;
      padding-left: 14px;
      position: relative;
    }

    .bullet-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #333;
    }

    /* Skills section */
    .skills-text {
      font-size: 9.5pt;
      color: #333;
      line-height: 1.5;
    }

    /* Education items */
    .education-item {
      margin-bottom: 8px;
    }

    .education-item .degree {
      font-size: 9.5pt;
      font-weight: 600;
      color: #1a1a1a;
    }

    .education-item .school {
      font-size: 9.5pt;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="name">${data.contactInfo.name}</div>
      <div class="contact-line">${contactLine}</div>
      ${data.contactInfo.linkedin ? `<div class="linkedin">${data.contactInfo.linkedin}</div>` : ''}
    </div>

    <div class="main-content">
      <div class="section">
        <div class="section-title">Summary</div>
        <div class="summary-text">${data.summary}</div>
      </div>

      <div class="section">
        <div class="section-title">Work Experience</div>
        ${experienceHTML}
      </div>
    </div>

    <div class="footer-sections">
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills-text">${skillsHTML}</div>
      </div>

      <div class="section">
        <div class="section-title">Education</div>
        ${educationHTML}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
