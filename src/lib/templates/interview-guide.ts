import { InterviewGuide, InterviewRound } from '../db';

export function generateInterviewGuideHTML(
  guide: InterviewGuide,
  jobTitle: string,
  companyName: string,
  accentColor: string = "#3D5A80"
): string {
  // Generate interview rounds HTML
  const roundsHTML = guide.interviewRounds.map((round: InterviewRound) => {
    const roundTypeLabels: Record<string, string> = {
      phone_screen: "Phone Screen",
      technical: "Technical Interview",
      behavioral: "Behavioral Interview",
      hiring_manager: "Hiring Manager Interview",
      final: "Final Round",
    };

    const questionsHTML = round.likelyQuestions
      .map(q => `<li>${q}</li>`)
      .join('');

    const starAnswersHTML = round.starAnswers.map(star => `
      <div class="star-answer">
        <div class="star-question">${star.question}</div>
        <div class="star-grid">
          <div class="star-item">
            <span class="star-label">Situation:</span>
            <span class="star-content">${star.situation}</span>
          </div>
          <div class="star-item">
            <span class="star-label">Task:</span>
            <span class="star-content">${star.task}</span>
          </div>
          <div class="star-item">
            <span class="star-label">Action:</span>
            <span class="star-content">${star.action}</span>
          </div>
          <div class="star-item">
            <span class="star-label">Result:</span>
            <span class="star-content">${star.result}</span>
          </div>
        </div>
      </div>
    `).join('');

    const tipsHTML = round.tips
      .map(tip => `<li>${tip}</li>`)
      .join('');

    return `
      <div class="round-section">
        <div class="round-header">
          <span class="round-number">Round ${round.round}</span>
          <span class="round-type">${roundTypeLabels[round.type] || round.type}</span>
          <span class="round-duration">${round.typicalDuration}</span>
        </div>

        <div class="round-content">
          <div class="subsection">
            <h4>Likely Questions</h4>
            <ul class="questions-list">${questionsHTML}</ul>
          </div>

          ${starAnswersHTML ? `
          <div class="subsection">
            <h4>STAR Answer Frameworks</h4>
            ${starAnswersHTML}
          </div>
          ` : ''}

          <div class="subsection">
            <h4>Tips for This Round</h4>
            <ul class="tips-list">${tipsHTML}</ul>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Generate questions to ask HTML
  const questionsToAskHTML = guide.questionsToAsk.map(category => {
    const questionsHTML = category.questions
      .map(q => `<li>${q}</li>`)
      .join('');

    return `
      <div class="questions-category">
        <h4>${category.category}</h4>
        <ul>${questionsHTML}</ul>
      </div>
    `;
  }).join('');

  // Generate general tips HTML
  const generalTipsHTML = guide.generalTips
    .map(tip => `<li>${tip}</li>`)
    .join('');

  // Generate company research HTML
  const newsHTML = guide.companyResearch.recentNews
    .map(news => `<li>${news}</li>`)
    .join('');

  const competitorsHTML = guide.companyResearch.competitors.length > 0
    ? guide.companyResearch.competitors.join(', ')
    : 'Not specified';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: Letter;
      margin: 0.5in;
    }

    body {
      font-family: 'Inter', sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #333;
    }

    .header {
      text-align: center;
      padding-bottom: 20px;
      margin-bottom: 20px;
      border-bottom: 2px solid ${accentColor};
    }

    .header h1 {
      font-size: 22pt;
      font-weight: 700;
      color: ${accentColor};
      margin-bottom: 8px;
    }

    .header .subtitle {
      font-size: 14pt;
      color: #666;
    }

    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: ${accentColor};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ddd;
    }

    .company-overview {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .company-overview p {
      margin-bottom: 12px;
    }

    .company-overview .label {
      font-weight: 600;
      color: ${accentColor};
    }

    .round-section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }

    .round-header {
      display: flex;
      align-items: center;
      gap: 12px;
      background: ${accentColor};
      color: white;
      padding: 10px 16px;
      border-radius: 6px 6px 0 0;
    }

    .round-number {
      font-weight: 700;
      font-size: 11pt;
    }

    .round-type {
      font-weight: 500;
    }

    .round-duration {
      margin-left: auto;
      font-size: 9pt;
      opacity: 0.9;
    }

    .round-content {
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 6px 6px;
      padding: 16px;
    }

    .subsection {
      margin-bottom: 16px;
    }

    .subsection:last-child {
      margin-bottom: 0;
    }

    .subsection h4 {
      font-size: 10pt;
      font-weight: 600;
      color: #444;
      margin-bottom: 8px;
    }

    ul {
      margin-left: 20px;
    }

    li {
      margin-bottom: 4px;
    }

    .star-answer {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 12px;
    }

    .star-question {
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      font-style: italic;
    }

    .star-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .star-item {
      font-size: 9pt;
    }

    .star-label {
      font-weight: 600;
      color: ${accentColor};
    }

    .star-content {
      color: #555;
    }

    .questions-category {
      margin-bottom: 12px;
    }

    .questions-category h4 {
      font-size: 10pt;
      font-weight: 600;
      color: ${accentColor};
      margin-bottom: 6px;
    }

    .tips-list li {
      position: relative;
      padding-left: 8px;
    }

    .general-tips {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 6px;
      padding: 16px;
    }

    .general-tips ul {
      margin: 0;
      padding-left: 20px;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Interview Preparation Guide</h1>
    <div class="subtitle">${jobTitle} at ${companyName}</div>
  </div>

  <div class="section">
    <div class="section-title">Company Research</div>
    <div class="company-overview">
      <p><span class="label">Overview:</span> ${guide.companyResearch.overview}</p>
      <p><span class="label">Culture:</span> ${guide.companyResearch.culture}</p>
      <p><span class="label">Key Competitors:</span> ${competitorsHTML}</p>
      ${guide.companyResearch.recentNews.length > 0 ? `
      <p><span class="label">Recent News & Developments:</span></p>
      <ul>${newsHTML}</ul>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Interview Rounds</div>
    ${roundsHTML}
  </div>

  <div class="section">
    <div class="section-title">Questions to Ask</div>
    ${questionsToAskHTML}
  </div>

  <div class="section">
    <div class="section-title">General Tips</div>
    <div class="general-tips">
      <ul>${generalTipsHTML}</ul>
    </div>
  </div>

  <div class="footer">
    Generated by ResumeScale | Good luck with your interview!
  </div>
</body>
</html>
  `;
}
