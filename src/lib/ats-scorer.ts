// ATS (Applicant Tracking System) Compatibility Scorer
// Uses traditional ATS scoring criteria to evaluate resume-job match

export interface ATSScoreBreakdown {
  keywords: {
    score: number;
    max: 40;
    matches: string[];
    missing: string[];
  };
  hardSkills: {
    score: number;
    max: 20;
    matches: string[];
    missing: string[];
  };
  jobTitle: {
    score: number;
    max: 15;
    relevance: 'high' | 'medium' | 'low';
    details: string;
  };
  education: {
    score: number;
    max: 10;
    status: 'exceeds' | 'meets' | 'partial' | 'missing';
    details: string;
  };
  format: {
    score: number;
    max: 10;
    issues: string[];
  };
  softSkills: {
    score: number;
    max: 5;
    matches: string[];
  };
}

export interface ATSScore {
  overall: number;
  breakdown: ATSScoreBreakdown;
  suggestions: string[];
}

interface ResumeContent {
  summary?: string;
  experience: { title: string; company: string; bullets: string[] }[];
  skills: string[];
  education: { degree: string; field?: string; institution: string }[];
}

// Common tech keywords and skills
const TECH_SKILLS = new Set([
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin',
  'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'next.js', 'nextjs',
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'git',
  'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap',
  'rest', 'graphql', 'grpc', 'api', 'microservices',
  'agile', 'scrum', 'kanban', 'jira', 'confluence',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'computer vision',
  'data analysis', 'data science', 'pandas', 'numpy', 'scikit-learn', 'tableau', 'power bi',
  'figma', 'sketch', 'adobe', 'photoshop', 'illustrator',
  'salesforce', 'hubspot', 'marketo', 'sap', 'oracle',
  'excel', 'powerpoint', 'word', 'microsoft office', 'google workspace',
]);

// Common soft skills
const SOFT_SKILLS = new Set([
  'leadership', 'communication', 'teamwork', 'collaboration', 'problem-solving', 'problem solving',
  'critical thinking', 'time management', 'adaptability', 'creativity', 'innovation',
  'attention to detail', 'organization', 'planning', 'strategic thinking', 'decision-making',
  'conflict resolution', 'negotiation', 'presentation', 'public speaking', 'mentoring',
  'customer service', 'relationship building', 'stakeholder management', 'cross-functional',
]);

// Education level hierarchy
const EDUCATION_LEVELS: Record<string, number> = {
  'high school': 1,
  'associate': 2,
  'bachelor': 3,
  'master': 4,
  'mba': 4,
  'phd': 5,
  'doctorate': 5,
};

function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Normalize and tokenize
  const normalized = text.toLowerCase()
    .replace(/[^a-z0-9\s\-\/\+\#\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract n-grams (1, 2, and 3 word phrases)
  const words = normalized.split(' ').filter(w => w.length > 2);
  const keywords = new Set<string>();

  // Single words
  words.forEach(w => {
    if (w.length > 3 && !['the', 'and', 'for', 'with', 'you', 'are', 'this', 'that', 'will', 'have'].includes(w)) {
      keywords.add(w);
    }
  });

  // Two-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (phrase.length > 5) {
      keywords.add(phrase);
    }
  }

  // Three-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    keywords.add(phrase);
  }

  return Array.from(keywords);
}

function extractHardSkills(text: string): string[] {
  const normalized = text.toLowerCase();
  const found: string[] = [];

  TECH_SKILLS.forEach(skill => {
    // Check for word boundaries
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalized)) {
      found.push(skill);
    }
  });

  return found;
}

function extractSoftSkills(text: string): string[] {
  const normalized = text.toLowerCase();
  const found: string[] = [];

  SOFT_SKILLS.forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalized)) {
      found.push(skill);
    }
  });

  return found;
}

function getEducationLevel(text: string): number {
  const normalized = text.toLowerCase();
  let maxLevel = 0;

  Object.entries(EDUCATION_LEVELS).forEach(([keyword, level]) => {
    if (normalized.includes(keyword)) {
      maxLevel = Math.max(maxLevel, level);
    }
  });

  // Check common abbreviations
  if (normalized.includes('bs') || normalized.includes('ba') || normalized.includes('b.s.') || normalized.includes('b.a.')) {
    maxLevel = Math.max(maxLevel, EDUCATION_LEVELS['bachelor']);
  }
  if (normalized.includes('ms') || normalized.includes('ma') || normalized.includes('m.s.') || normalized.includes('m.a.')) {
    maxLevel = Math.max(maxLevel, EDUCATION_LEVELS['master']);
  }

  return maxLevel;
}

function getResumeFullText(resume: ResumeContent): string {
  const parts: string[] = [];

  if (resume.summary) parts.push(resume.summary);

  resume.experience.forEach(exp => {
    parts.push(exp.title);
    parts.push(exp.company);
    parts.push(exp.bullets.join(' '));
  });

  parts.push(resume.skills.join(' '));

  resume.education.forEach(edu => {
    parts.push(edu.degree);
    if (edu.field) parts.push(edu.field);
    parts.push(edu.institution);
  });

  return parts.join(' ');
}

export function calculateATSScore(
  resume: ResumeContent,
  jobDescription: string,
  jobTitle: string
): ATSScore {
  const resumeText = getResumeFullText(resume);
  const resumeTextLower = resumeText.toLowerCase();
  const jobDescLower = jobDescription.toLowerCase();

  // 1. Keyword Matching (40 points)
  const jobKeywords = extractKeywords(jobDescription);
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  jobKeywords.forEach(kw => {
    if (resumeTextLower.includes(kw)) {
      matchedKeywords.push(kw);
    } else if (kw.length > 4) { // Only track meaningful missing keywords
      missingKeywords.push(kw);
    }
  });

  // Limit missing keywords to most relevant (longest phrases first)
  const topMissingKeywords = missingKeywords
    .sort((a, b) => b.length - a.length)
    .slice(0, 10);

  const keywordScore = Math.min(40, Math.round((matchedKeywords.length / Math.max(1, jobKeywords.length)) * 50));

  // 2. Hard Skills (20 points)
  const jobHardSkills = extractHardSkills(jobDescription);
  const resumeHardSkills = extractHardSkills(resumeText);
  const matchedHardSkills = jobHardSkills.filter(s => resumeHardSkills.includes(s));
  const missingHardSkills = jobHardSkills.filter(s => !resumeHardSkills.includes(s));

  const hardSkillsScore = jobHardSkills.length > 0
    ? Math.min(20, Math.round((matchedHardSkills.length / jobHardSkills.length) * 25))
    : 15; // Default if no specific hard skills detected

  // 3. Job Title Relevance (15 points)
  const resumeTitles = resume.experience.map(e => e.title.toLowerCase());
  const targetTitleWords = jobTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  let titleRelevance: 'high' | 'medium' | 'low' = 'low';
  let titleScore = 5;
  let titleDetails = '';

  // Check for exact or similar title match
  const hasExactMatch = resumeTitles.some(t => t.includes(jobTitle.toLowerCase()));
  const wordMatches = targetTitleWords.filter(w =>
    resumeTitles.some(t => t.includes(w))
  ).length;
  const wordMatchRatio = wordMatches / Math.max(1, targetTitleWords.length);

  if (hasExactMatch || wordMatchRatio >= 0.8) {
    titleRelevance = 'high';
    titleScore = 15;
    titleDetails = 'Your job titles closely match the target role';
  } else if (wordMatchRatio >= 0.5) {
    titleRelevance = 'medium';
    titleScore = 10;
    titleDetails = 'Your experience shows related job titles';
  } else {
    titleRelevance = 'low';
    titleScore = 5;
    titleDetails = 'Consider highlighting more relevant job titles or responsibilities';
  }

  // 4. Education (10 points)
  const jobEducationLevel = getEducationLevel(jobDescription);
  const resumeEducationLevel = resume.education.length > 0
    ? Math.max(...resume.education.map(e => getEducationLevel(`${e.degree} ${e.field || ''}`)))
    : 0;

  let educationStatus: 'exceeds' | 'meets' | 'partial' | 'missing' = 'missing';
  let educationScore = 0;
  let educationDetails = '';

  if (jobEducationLevel === 0) {
    // No education requirement specified
    educationStatus = 'meets';
    educationScore = 10;
    educationDetails = 'Education requirements not specified in job description';
  } else if (resumeEducationLevel >= jobEducationLevel) {
    educationStatus = resumeEducationLevel > jobEducationLevel ? 'exceeds' : 'meets';
    educationScore = 10;
    educationDetails = 'Your education meets or exceeds requirements';
  } else if (resumeEducationLevel > 0) {
    educationStatus = 'partial';
    educationScore = 5;
    educationDetails = 'Your education level may be below stated requirements';
  } else {
    educationStatus = 'missing';
    educationScore = 3;
    educationDetails = 'Add your education credentials';
  }

  // 5. Format (10 points) - Check for good resume practices
  const formatIssues: string[] = [];
  let formatScore = 10;

  // Check for key sections
  if (!resume.summary || resume.summary.length < 50) {
    formatIssues.push('Add a professional summary (50+ words)');
    formatScore -= 2;
  }

  if (resume.experience.length === 0) {
    formatIssues.push('Add work experience');
    formatScore -= 4;
  } else {
    const avgBullets = resume.experience.reduce((sum, e) => sum + e.bullets.length, 0) / resume.experience.length;
    if (avgBullets < 2) {
      formatIssues.push('Add more bullet points to each role (3-5 recommended)');
      formatScore -= 2;
    }
  }

  if (resume.skills.length < 5) {
    formatIssues.push('Add more skills (8-12 recommended)');
    formatScore -= 2;
  }

  if (resume.education.length === 0) {
    formatIssues.push('Add education section');
    formatScore -= 1;
  }

  formatScore = Math.max(0, formatScore);

  // 6. Soft Skills (5 points)
  const jobSoftSkills = extractSoftSkills(jobDescription);
  const resumeSoftSkills = extractSoftSkills(resumeText);
  const matchedSoftSkills = jobSoftSkills.filter(s => resumeSoftSkills.includes(s));

  const softSkillsScore = jobSoftSkills.length > 0
    ? Math.min(5, Math.round((matchedSoftSkills.length / jobSoftSkills.length) * 7))
    : 3; // Default if no specific soft skills detected

  // Calculate overall score
  const overall = keywordScore + hardSkillsScore + titleScore + educationScore + formatScore + softSkillsScore;

  // Generate suggestions
  const suggestions: string[] = [];

  if (missingHardSkills.length > 0 && missingHardSkills.length <= 5) {
    suggestions.push(`Add these skills if you have them: ${missingHardSkills.slice(0, 3).join(', ')}`);
  }

  if (topMissingKeywords.length > 0) {
    const relevantMissing = topMissingKeywords.filter(k => k.length > 6).slice(0, 3);
    if (relevantMissing.length > 0) {
      suggestions.push(`Consider including these terms: ${relevantMissing.join(', ')}`);
    }
  }

  if (titleRelevance === 'low') {
    suggestions.push('Tailor your job titles or bullet points to better match the target role');
  }

  formatIssues.forEach(issue => suggestions.push(issue));

  if (matchedSoftSkills.length === 0 && jobSoftSkills.length > 0) {
    suggestions.push(`Highlight soft skills like: ${jobSoftSkills.slice(0, 3).join(', ')}`);
  }

  // Limit suggestions
  const topSuggestions = suggestions.slice(0, 5);

  return {
    overall,
    breakdown: {
      keywords: {
        score: keywordScore,
        max: 40,
        matches: matchedKeywords.slice(0, 20),
        missing: topMissingKeywords,
      },
      hardSkills: {
        score: hardSkillsScore,
        max: 20,
        matches: matchedHardSkills,
        missing: missingHardSkills,
      },
      jobTitle: {
        score: titleScore,
        max: 15,
        relevance: titleRelevance,
        details: titleDetails,
      },
      education: {
        score: educationScore,
        max: 10,
        status: educationStatus,
        details: educationDetails,
      },
      format: {
        score: formatScore,
        max: 10,
        issues: formatIssues,
      },
      softSkills: {
        score: softSkillsScore,
        max: 5,
        matches: matchedSoftSkills,
      },
    },
    suggestions: topSuggestions,
  };
}
