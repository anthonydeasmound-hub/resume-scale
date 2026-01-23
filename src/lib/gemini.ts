import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

// Call Groq LLM
async function callAI(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
  });
  return completion.choices[0]?.message?.content || "";
}

// Get company context - what does this company do?
async function getCompanyContext(company: string): Promise<string> {
  const prompt = `In 1-2 sentences, describe what ${company} does as a company. Focus on their main product/service and industry. If you don't know the company, make a reasonable inference based on the name. Be concise.`;
  return await callAI(prompt);
}

// Role-specific task templates
const roleTaskTemplates: Record<string, string[]> = {
  "account development representative": [
    "Cold calling and prospecting potential clients",
    "Qualifying inbound leads and scheduling demos",
    "Managing CRM pipeline and tracking outreach metrics",
    "Collaborating with Account Executives on deals",
  ],
  "account executive": [
    "Running product demos and presentations",
    "Negotiating contracts and closing deals",
    "Managing full sales cycle from prospect to close",
    "Forecasting and pipeline management",
  ],
  "sales development representative": [
    "Prospecting and cold outreach via phone/email",
    "Qualifying leads using BANT/MEDDIC frameworks",
    "Setting meetings for Account Executives",
    "Tracking activities in Salesforce/HubSpot",
  ],
  "software engineer": [
    "Designing and implementing features",
    "Writing unit tests and code reviews",
    "Debugging production issues",
    "Collaborating with product teams",
  ],
  "product manager": [
    "Defining product roadmap",
    "Writing PRDs and user stories",
    "Conducting user research",
    "Coordinating cross-functional teams",
  ],
  "marketing manager": [
    "Planning and executing campaigns",
    "Managing marketing budget",
    "Analyzing campaign metrics",
    "Creating marketing content",
  ],
  "customer success": [
    "Onboarding new customers",
    "Conducting quarterly business reviews",
    "Driving product adoption",
    "Handling renewals and upsells",
  ],
};

function getRoleTasks(title: string): string[] {
  const titleLower = title.toLowerCase();
  for (const [role, tasks] of Object.entries(roleTaskTemplates)) {
    if (titleLower.includes(role) || role.includes(titleLower)) {
      return tasks;
    }
  }
  const keywords: Record<string, string> = {
    "sdr": "sales development representative",
    "adr": "account development representative",
    "ae": "account executive",
    "sales": "account executive",
    "engineer": "software engineer",
    "developer": "software engineer",
    "marketing": "marketing manager",
    "product": "product manager",
    "customer": "customer success",
  };
  for (const [keyword, role] of Object.entries(keywords)) {
    if (titleLower.includes(keyword)) {
      return roleTaskTemplates[role] || [];
    }
  }
  return [];
}

// Extract metrics from bullet points (percentages, dollar amounts, numbers)
// This ensures AI alternatives use ONLY the user's actual metrics
export function extractMetrics(bullets: string[]): string[] {
  const metrics: string[] = [];
  const patterns = [
    /\d+%/g,                           // Percentages: 25%, 150%
    /\$[\d.,]+[KMB]?/gi,               // Dollar amounts: $1M, $500K, $1.2M
    /\d+\+?\s*(clients?|accounts?|users?|customers?|deals?|leads?|meetings?|calls?|demos?|team members?|engineers?|people)/gi, // Counts with context
    /\d+[xX]\s*(increase|growth|improvement|return)/gi, // Multipliers: 3x increase
    /\d+\s*(days?|weeks?|months?|years?)/gi, // Time periods
    /\$[\d.,]+\s*(ARR|MRR|revenue|pipeline|quota)/gi, // Revenue metrics
    /top\s*\d+%/gi,                    // Rankings: top 10%
    /\d+\s*-\s*\d+/g,                  // Ranges: 50-100
  ];

  for (const bullet of bullets) {
    for (const pattern of patterns) {
      const matches = bullet.match(pattern);
      if (matches) {
        metrics.push(...matches);
      }
    }
  }

  // Deduplicate and return
  return [...new Set(metrics)];
}

export interface JobInfo {
  company_name: string;
  job_title: string;
}

export async function boldAchievements(descriptions: string[]): Promise<string[]> {
  const prompt = `You are an expert resume writer. For each bullet point below, identify the key achievements, metrics, and impact statements that would catch a hiring manager's attention. Wrap ONLY those specific phrases (not full sentences) in <strong> tags.

Focus on bolding:
- Numbers and metrics (e.g., "increased revenue by 40%")
- Specific outcomes and results
- Key technologies or skills that stand out
- Leadership or scope indicators (e.g., "team of 12", "company-wide")

Do NOT bold:
- Common verbs like "Led", "Managed", "Developed"
- Entire sentences
- Generic phrases

Input bullet points:
${descriptions.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Return ONLY a JSON array of strings with the same bullet points but with <strong> tags around key achievements:
["bullet 1 with <strong>key achievement</strong>", "bullet 2...", ...]`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleanedResponse);
}

export async function extractJobInfo(jobDescription: string): Promise<JobInfo> {
  const prompt = `Extract the company name and job title from this job description.

Job Description:
${jobDescription.slice(0, 2000)}

Return ONLY valid JSON:
{
  "company_name": "Company Name",
  "job_title": "Job Title"
}

If the company name or job title is not clear, make your best guess based on the context.`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleanedResponse);
}

// Extract detailed job sections from description
export interface JobDetailsParsed {
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  salary_range: string | null;
  location: string | null;
  work_type: string | null; // remote, hybrid, on-site
}

export async function extractJobDetails(jobDescription: string): Promise<JobDetailsParsed> {
  const prompt = `Analyze this job description and extract the key sections into structured data.

Job Description:
${jobDescription.slice(0, 4000)}

Extract and categorize the information into these sections:
- responsibilities: What the person will do day-to-day (list of bullet points)
- requirements: Required skills, experience, education (list of bullet points)
- qualifications: Nice-to-have or preferred qualifications (list of bullet points)
- benefits: Perks, benefits, compensation mentions (list of bullet points)
- salary_range: If mentioned, extract the salary range as a string (e.g., "$80,000 - $120,000")
- location: Where the job is located
- work_type: "remote", "hybrid", "on-site", or null if not specified

Keep each bullet point concise (1 sentence max). Extract 3-8 items per section where available.

Return ONLY valid JSON:
{
  "responsibilities": ["responsibility 1", "responsibility 2"],
  "requirements": ["requirement 1", "requirement 2"],
  "qualifications": ["qualification 1", "qualification 2"],
  "benefits": ["benefit 1", "benefit 2"],
  "salary_range": "$X - $Y" or null,
  "location": "City, State" or null,
  "work_type": "remote" | "hybrid" | "on-site" | null
}`;

  try {
    const response = await callAI(prompt);
    const cleanedResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Failed to extract job details:", error);
    // Return empty structure on failure
    return {
      responsibilities: [],
      requirements: [],
      qualifications: [],
      benefits: [],
      salary_range: null,
      location: null,
      work_type: null,
    };
  }
}

export interface ParsedResume {
  contact_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  work_experience: {
    company: string;
    title: string;
    start_date: string;
    end_date: string;
    description: string[];
  }[];
  skills: string[];
  education: {
    institution: string;
    degree: string;
    field: string;
    graduation_date: string;
  }[];
}

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const prompt = `Parse this resume and extract structured data. Return ONLY valid JSON matching this exact structure:

{
  "contact_info": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "123-456-7890",
    "location": "City, State",
    "linkedin": "linkedin.com/in/username"
  },
  "work_experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "start_date": "Month Year",
      "end_date": "Month Year or Present",
      "description": ["Achievement 1", "Achievement 2"]
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor's/Master's/etc",
      "field": "Field of Study",
      "graduation_date": "Month Year"
    }
  ]
}

Resume text:
${resumeText}

Return ONLY the JSON, no markdown formatting or explanation.`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleanedResponse);
}

export interface TailoredResume {
  summary: string;
  work_experience: {
    company: string;
    title: string;
    start_date: string;
    end_date: string;
    description: string[];
  }[];
  skills: string[];
  education: {
    institution: string;
    degree: string;
    field: string;
    graduation_date: string;
  }[];
}

export async function tailorResume(
  resume: ParsedResume,
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<TailoredResume> {
  const prompt = `You are an expert resume writer. Tailor this resume for the specific job.

CANDIDATE RESUME:
${JSON.stringify(resume, null, 2)}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}
JOB DESCRIPTION:
${jobDescription}

Create a tailored resume that:
1. Adds a compelling professional summary (2-3 sentences) highlighting relevant experience
2. Reorders and rewrites work experience bullets to emphasize relevant skills
3. Prioritizes skills mentioned in the job description
4. Keeps it ATS-friendly with clear formatting
5. Is accurate to the candidate's actual experience (don't invent new roles)

Return ONLY valid JSON:
{
  "summary": "Professional summary here",
  "work_experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "start_date": "Month Year",
      "end_date": "Month Year",
      "description": ["Tailored achievement 1", "Tailored achievement 2"]
    }
  ],
  "skills": ["Most relevant skill", "Second skill"],
  "education": [
    {
      "institution": "University",
      "degree": "Degree",
      "field": "Field",
      "graduation_date": "Date"
    }
  ]
}`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleanedResponse);
}

export async function generateCoverLetter(
  resume: ParsedResume,
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<string> {
  const prompt = `Write the BODY ONLY of a cover letter (no greeting, no closing signature - those are handled separately).

CANDIDATE:
${resume.work_experience.map(exp => `${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date})`).join("\n")}
Key skills: ${resume.skills.slice(0, 10).join(", ")}

TARGET ROLE: ${jobTitle} at ${companyName}

JOB REQUIREMENTS:
${jobDescription.slice(0, 1500)}

WRITE 3 PARAGRAPHS (250-300 words total):

Paragraph 1 - Hook & Alignment:
- Open with WHY this specific company/role appeals to you (not generic "I'm excited")
- Reference something specific about ${companyName} from the job description
- State your relevant background in one sentence

Paragraph 2 - Proof:
- Connect 2 specific achievements from your experience to their requirements
- Use actual numbers/results from your background
- Show you understand what they need and have done it before

Paragraph 3 - Forward-looking close:
- What you'd bring to the team (be specific, not generic)
- Express genuine interest in discussing further
- Keep it confident but not arrogant

CRITICAL RULES:
- DO NOT start with "I am writing to..." or "I am excited to apply..."
- DO NOT use phrases like "I believe I would be a great fit" or "I am confident that..."
- DO NOT include "Dear Hiring Manager" or any greeting
- DO NOT include "Sincerely," or any signature
- VARY sentence structure - mix short and long sentences
- Use contractions naturally (I've, I'm, that's)
- Be specific, not generic - reference actual experience and actual job requirements
- Sound like a confident professional wrote this, not an AI

Output ONLY the 3 paragraphs of body text, nothing else.`;

  return await callAI(prompt);
}

export interface EmailClassification {
  type: "confirmation" | "rejection" | "interview" | "offer" | "unrelated";
  company: string | null;
  confidence: number;
  summary: string;
}

// Import summary examples from reference sheet
import { getGoodSummaries, getBadSummaries, getRoleSummaries } from "./resume-examples";

// Generate 3 summary options for the resume
export async function generateSummaryOptions(
  resume: ParsedResume,
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<string[]> {
  // Get company context for target company
  const companyContext = await getCompanyContext(companyName);

  // Extract ALL metrics from the user's master resume - AI must use ONLY these
  const allBullets = resume.work_experience.flatMap(exp => exp.description || []);
  const userMetrics = extractMetrics(allBullets);

  // Extract 2 best achievements from resume bullets (look for metrics)
  const achievementBullets = allBullets
    .filter(b => /\d+%|\$[\d.,]+[KMB]?|\d+\+/.test(b)) // Has metrics
    .slice(0, 2);

  // Calculate years of experience
  const mostRecent = resume.work_experience[0];
  const totalYears = resume.work_experience.length > 0
    ? Math.max(2, resume.work_experience.length * 2) // Rough estimate
    : 3;

  // Get role-specific summary examples
  const roleSummaryExamples = getRoleSummaries(jobTitle).slice(0, 2);

  // Build metrics section for prompt
  const metricsSection = userMetrics.length > 0
    ? `\nCANDIDATE'S ACTUAL METRICS (USE ONLY THESE - DO NOT INVENT):\n${userMetrics.map(m => `• ${m}`).join("\n")}\n`
    : "\n(No specific metrics found - do not invent metrics, focus on qualitative strengths)\n";

  const prompt = `Write 3 professional summary options for this candidate applying to ${jobTitle} at ${companyName}.

ABOUT ${companyName.toUpperCase()} (TARGET COMPANY):
${companyContext}

THE CANDIDATE:
• Most recent: ${mostRecent?.title || 'N/A'} at ${mostRecent?.company || 'N/A'}
• Experience: ~${totalYears}+ years in ${mostRecent?.title?.split(' ').pop() || 'their field'}
• Key skills: ${resume.skills.slice(0, 10).join(", ")}
${achievementBullets.length > 0 ? `• Top achievements:\n  - ${achievementBullets.join("\n  - ")}` : ""}
${metricsSection}
TARGET ROLE REQUIREMENTS:
${jobDescription.slice(0, 1000)}

${roleSummaryExamples.length > 0 ? `REFERENCE EXAMPLES:
${roleSummaryExamples.map(s => `"${s.summary}"`).join("\n")}` : ""}

WRITE 3 SUMMARIES (2-3 sentences, 40-60 words each):

Each summary MUST:
1. Open with years of experience + specialty
2. Reference ${companyName} or their industry specifically
3. Include 1-2 metrics from "CANDIDATE'S ACTUAL METRICS" above - DO NOT invent new numbers
4. Use keywords from the job description
5. End with value proposition for THIS role at ${companyName}

THREE DISTINCT ANGLES:
• Summary 1 - INDUSTRY EXPERTISE: Lead with domain knowledge (e.g., "SaaS sales leader with 5+ years...")
• Summary 2 - QUANTIFIED ACHIEVEMENT: Lead with biggest metric from ACTUAL METRICS (e.g., "Revenue driver who generated $4M+...")
• Summary 3 - GROWTH/TRANSFORMATION: Lead with scale/impact from ACTUAL METRICS (e.g., "Growth-focused leader who scaled team from 5 to 20...")

**METRIC RULE**: You may ONLY use metrics that appear in "CANDIDATE'S ACTUAL METRICS". Do NOT invent, estimate, or create new percentages, dollar amounts, or numbers.

BAD (invented metric): "Generated $5M in revenue" (if $5M wasn't in actual metrics)
GOOD (using actual metric): "Generated $4M+ ARR" (if $4M was in actual metrics)
GOOD (no metric if none available): "Drove significant revenue growth across enterprise accounts"

METRIC FORMAT: Always use numbers (25%, $1.2M, 10+) - never write them out

RESPOND WITH ONLY A JSON ARRAY OF 3 STRINGS:
["Summary 1...", "Summary 2...", "Summary 3..."]`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Handle case where AI returns explanation instead of JSON
  const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return JSON.parse(cleanedResponse);
}

// Generate 8 bullet point options for a specific role
export async function generateBulletOptions(
  role: { company: string; title: string; description: string[] },
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<string[]> {
  // Get company context and role tasks for specificity
  const [companyContext, roleTasks] = await Promise.all([
    getCompanyContext(role.company),
    Promise.resolve(getRoleTasks(role.title)),
  ]);

  // Extract metrics from the user's ACTUAL bullets - AI must use ONLY these
  const userMetrics = extractMetrics(role.description);
  const metricsSection = userMetrics.length > 0
    ? `\nYOUR ACTUAL METRICS (USE ONLY THESE - DO NOT INVENT NEW NUMBERS):\n${userMetrics.map(m => `• ${m}`).join("\n")}\n`
    : "\n(No specific metrics found in original bullets - do not invent metrics)\n";

  const prompt = `You worked as a ${role.title} at ${role.company}. Rewrite your experience into 8 bullet points tailored for the ${jobTitle} role at ${companyName}.

ABOUT ${role.company.toUpperCase()} (your previous employer):
${companyContext}

YOUR ACTUAL ACTIVITIES AS ${role.title.toUpperCase()}:
${roleTasks.length > 0 ? roleTasks.map(t => `• ${t}`).join("\n") : "• Infer from the original experience below"}

YOUR ORIGINAL EXPERIENCE:
${role.description.map((d, i) => `${i + 1}. ${d}`).join("\n")}
${metricsSection}
TARGET JOB (${jobTitle} at ${companyName}):
${jobDescription.slice(0, 1200)}

CRITICAL INSTRUCTIONS:
1. Each bullet must be 8-12 words (concise, fits one resume line)
2. Each bullet must describe a SPECIFIC activity, not just a result
3. Pretend you're a ${role.title} at ${role.company}. Describe your responsibilities and achievements as if you actually held this role
4. Include WHO you worked with (clients, teams, stakeholders)
5. Include WHAT tools/methods you used
6. Tailor language to match the target job description keywords
7. **METRIC RULE**: You may ONLY use metrics that appear in "YOUR ACTUAL METRICS" above. Do NOT invent, estimate, or create new percentages, dollar amounts, or numbers. If unsure, omit the metric rather than fabricate one.

BAD (invented metric): "Increased revenue by 45% through strategic initiatives" (if 45% wasn't in original)
GOOD (using actual metric): "Grew enterprise accounts 30% via consultative selling" (if 30% was in original)
GOOD (no metric if none available): "Led enterprise sales initiatives across strategic accounts"

METRIC FORMAT: Always use numbers (25%, $1.2M, 50+) - never write them out

RESPOND WITH ONLY A JSON ARRAY OF 8 STRINGS:
["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5", "bullet 6", "bullet 7", "bullet 8"]`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Handle case where AI returns explanation instead of JSON
  const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return JSON.parse(cleanedResponse);
}

// Import curated skills data
import { getSkillsForRole, findSimilarRole } from "./resume-examples";

// Generate skill recommendations optimized for the job
export async function generateSkillRecommendations(
  candidateSkills: string[],
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<{ recommended: string[]; fromResume: string[]; fromJobDescription: string[] }> {
  // Get curated skills for this role type
  const matchedRole = findSimilarRole(jobTitle);
  const curatedSkills = matchedRole ? getSkillsForRole(matchedRole) : null;

  // Build reference skills from curated data
  let curatedSkillsText = "";
  if (curatedSkills) {
    curatedSkillsText = `
CURATED SKILLS FOR ${matchedRole?.toUpperCase()} ROLES (use as reference):
Technical Skills: ${curatedSkills.hardSkills.join(", ")}
Soft Skills: ${curatedSkills.softSkills.join(", ")}
Tools: ${curatedSkills.tools.join(", ")}
`;
  }

  const prompt = `You are a resume ATS optimization expert. Analyze skills for the ${jobTitle} role at ${companyName}.

CANDIDATE'S SKILLS:
${candidateSkills.join(", ")}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}
${curatedSkillsText}
TASK: Return THREE skill lists as JSON.

1. "fromResume": Candidate's skills most relevant to this job (order by relevance, max 12)
   - Include skills that match or relate to job requirements
   - Use the job description's exact terminology when possible
   - Exclude skills irrelevant to this role

2. "fromJobDescription": Skills EXPLICITLY mentioned or required in the job description that the candidate does NOT have listed (max 10)
   - Extract exact skill names from the job description (programming languages, tools, frameworks, methodologies)
   - DO NOT include skills already in the candidate's list
   - Focus on hard requirements and "nice to have" skills from the job posting
   - Use the exact terminology from the job description

3. "recommended": Additional skills from the curated list that would strengthen the application (max 6)
   - Skills common for ${jobTitle} roles that aren't in the job description or candidate's list
   - Only suggest skills plausible for someone with their background

RESPOND WITH ONLY THIS JSON FORMAT, NO OTHER TEXT:
{
  "fromResume": ["Skill 1", "Skill 2"],
  "fromJobDescription": ["Required Skill 1", "Required Skill 2"],
  "recommended": ["Suggested Skill 1", "Suggested Skill 2"]
}`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Handle case where AI returns explanation instead of JSON
  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0]);
    // Ensure fromJobDescription exists for backwards compatibility
    return {
      fromResume: result.fromResume || [],
      fromJobDescription: result.fromJobDescription || [],
      recommended: result.recommended || []
    };
  }

  return JSON.parse(cleanedResponse);
}

export async function classifyEmail(
  email: { from: string; subject: string; body: string; snippet: string },
  knownCompanies: string[]
): Promise<EmailClassification> {
  const prompt = `Classify this email related to job applications.

EMAIL:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.snippet} ${email.body.slice(0, 1000)}

COMPANIES THE USER HAS APPLIED TO:
${knownCompanies.join(", ")}

Classify this email as one of:
- "confirmation": Application received/submitted confirmation
- "rejection": The candidate was rejected or not moving forward
- "interview": Interview invitation or scheduling
- "offer": Job offer
- "unrelated": Not related to any job application from the list

Return ONLY valid JSON:
{
  "type": "confirmation|rejection|interview|offer|unrelated",
  "company": "Company name from the list above, or null if unrelated",
  "confidence": 0.0 to 1.0,
  "summary": "Brief one-sentence summary of the email"
}`;

  try {
    const response = await callAI(prompt);
    const cleanedResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleanedResponse);
  } catch {
    return {
      type: "unrelated",
      company: null,
      confidence: 0,
      summary: "Failed to classify",
    };
  }
}

// Generate bullet point recommendations for onboarding (no target job)
export async function generateOnboardingBullets(
  role: { company: string; title: string },
  existingBullets: string[]
): Promise<string[]> {
  // Infer seniority from title
  const titleLower = role.title.toLowerCase();
  let seniorityLevel = "mid-level";
  if (titleLower.includes("senior") || titleLower.includes("sr.") || titleLower.includes("lead") || titleLower.includes("principal")) {
    seniorityLevel = "senior";
  } else if (titleLower.includes("director") || titleLower.includes("vp") || titleLower.includes("head of") || titleLower.includes("chief")) {
    seniorityLevel = "executive";
  } else if (titleLower.includes("junior") || titleLower.includes("jr.") || titleLower.includes("associate") || titleLower.includes("entry")) {
    seniorityLevel = "entry-level";
  }

  const prompt = `Pretend you're a ${role.title} at ${role.company} and you had to describe your work responsibilities and achievements. Break that down into 8 bullet points to put on your resume.

SENIORITY LEVEL: ${seniorityLevel}

${existingBullets.length > 0 ? `EXISTING BULLETS (DO NOT DUPLICATE):
${existingBullets.map((d, i) => `${i + 1}. ${d}`).join("\n")}

` : ""}BULLET FORMAT:
Each bullet must follow: [POWER VERB] + [WHAT you did] + [SCALE/SCOPE] + [BUSINESS IMPACT]

Examples:
✅ "Spearheaded migration of 50+ microservices to Kubernetes, reducing deployment time 70% and saving $200K annually"
✅ "Led cross-functional team of 8 to deliver $2M product launch 3 weeks ahead of schedule"
✅ "Redesigned sales pipeline workflow, increasing conversion rates 35% and shortening cycle by 12 days"

❌ Never use weak phrases like "Responsible for", "Helped with", "Assisted in"

REQUIREMENTS:
- Start each bullet with a strong action verb
- Include at least one metric (%, $, #, or timeframe)
- Keep each bullet to 8-12 words (concise, one line)
- Cover different aspects: leadership, technical work, business impact, collaboration, innovation

METRIC FORMAT (CRITICAL):
ALWAYS use numbers, never write them out:
- 25%, $1.2M, 50+, 8 engineers, 3 months
- NOT "twenty-five percent" or "eight engineers"

OUTPUT: Return ONLY a valid JSON array with exactly 8 strings. No explanations.

["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5", "bullet 6", "bullet 7", "bullet 8"]`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return JSON.parse(cleanedResponse);
}
