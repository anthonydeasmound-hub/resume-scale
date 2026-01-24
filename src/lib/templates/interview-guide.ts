import { InterviewGuide, InterviewRound } from '../db';

export function generateInterviewGuideHTML(
  guide: InterviewGuide,
  jobTitle: string,
  companyName: string,
  accentColor: string = "#3D5A80"
): string {
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
          <div class="star-item"><span class="star-label">S:</span> ${star.situation}</div>
          <div class="star-item"><span class="star-label">T:</span> ${star.task}</div>
          <div class="star-item"><span class="star-label">A:</span> ${star.action}</div>
          <div class="star-item"><span class="star-label">R:</span> ${star.result}</div>
        </div>
      </div>
    `).join('');

    const tipsHTML = round.tips.map(tip => `<li>${tip}</li>`).join('');

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
            <ul>${questionsHTML}</ul>
          </div>
          ${starAnswersHTML ? `<div class="subsection"><h4>STAR Frameworks</h4>${starAnswersHTML}</div>` : ''}
          <div class="subsection">
            <h4>Tips</h4>
            <ul>${tipsHTML}</ul>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const questionsToAskHTML = guide.questionsToAsk.map(category => `
    <div class="questions-category">
      <h4>${category.category}</h4>
      <ul>${category.questions.map(q => `<li>${q}</li>`).join('')}</ul>
    </div>
  `).join('');

  const generalTipsHTML = guide.generalTips.map(tip => `<li>${tip}</li>`).join('');
  const newsHTML = guide.companyResearch.recentNews.map(news => `<li>${news}</li>`).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: Letter; margin: 0.5in; }
    body { font-family: 'Inter', sans-serif; font-size: 9pt; line-height: 1.4; color: #333; }
    .header { text-align: center; padding-bottom: 15px; margin-bottom: 15px; border-bottom: 2px solid ${accentColor}; }
    .header h1 { font-size: 18pt; font-weight: 700; color: ${accentColor}; margin-bottom: 5px; }
    .header .subtitle { font-size: 11pt; color: #666; }
    .section { margin-bottom: 18px; page-break-inside: avoid; }
    .section-title { font-size: 11pt; font-weight: 700; color: ${accentColor}; text-transform: uppercase; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
    .company-overview { background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 12px; }
    .company-overview p { margin-bottom: 8px; font-size: 9pt; }
    .company-overview .label { font-weight: 600; color: ${accentColor}; }
    .round-section { margin-bottom: 15px; page-break-inside: avoid; }
    .round-header { display: flex; align-items: center; gap: 10px; background: ${accentColor}; color: white; padding: 8px 12px; border-radius: 4px 4px 0 0; font-size: 9pt; }
    .round-number { font-weight: 700; }
    .round-duration { margin-left: auto; font-size: 8pt; opacity: 0.9; }
    .round-content { border: 1px solid #ddd; border-top: none; border-radius: 0 0 4px 4px; padding: 12px; }
    .subsection { margin-bottom: 10px; }
    .subsection:last-child { margin-bottom: 0; }
    .subsection h4 { font-size: 9pt; font-weight: 600; color: #444; margin-bottom: 5px; }
    ul { margin-left: 15px; }
    li { margin-bottom: 3px; font-size: 9pt; }
    .star-answer { background: #f8f9fa; padding: 10px; border-radius: 4px; margin-bottom: 8px; font-size: 8pt; }
    .star-question { font-weight: 600; color: #333; margin-bottom: 6px; font-style: italic; }
    .star-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .star-item { font-size: 8pt; }
    .star-label { font-weight: 600; color: ${accentColor}; }
    .questions-category { margin-bottom: 10px; }
    .questions-category h4 { font-size: 9pt; font-weight: 600; color: ${accentColor}; margin-bottom: 4px; }
    .general-tips { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 4px; padding: 12px; }
    .general-tips ul { margin: 0; padding-left: 15px; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 8pt; color: #888; }
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
      <p><span class="label">Competitors:</span> ${guide.companyResearch.competitors.join(', ') || 'Not specified'}</p>
      ${guide.companyResearch.recentNews.length > 0 ? `<p><span class="label">Recent News:</span></p><ul>${newsHTML}</ul>` : ''}
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
    <div class="general-tips"><ul>${generalTipsHTML}</ul></div>
  </div>

  <div class="footer">Generated by ResumeScale</div>
</body>
</html>
  `;
}
