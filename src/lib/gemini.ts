import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

// Initialize Gemini client (fallback)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Call AI with Groq primary → Gemini fallback
async function callAI(prompt: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content || "";
  } catch (groqError) {
    console.warn("[callAI] Groq failed, falling back to Gemini:", groqError);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (geminiError) {
      console.error("[callAI] Gemini fallback also failed:", geminiError);
      throw geminiError;
    }
  }
}

// Get company context - what does this company do?
async function getCompanyContext(company: string): Promise<string> {
  const prompt = `In 1-2 sentences, describe what ${company} does as a company. Focus on their main product/service and industry. If you don't know the company, make a reasonable inference based on the name. Be concise.`;
  return await callAI(prompt);
}

// Parse date string like "Apr 2023" or "Present" into a Date
function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  const lower = dateStr.toLowerCase().trim();
  if (lower === "present" || lower === "current" || lower === "") return new Date();

  const months: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11
  };

  const parts = dateStr.trim().split(/[\s,]+/);
  let month = 0;
  let year = new Date().getFullYear();

  for (const part of parts) {
    const monthNum = months[part.toLowerCase()];
    if (monthNum !== undefined) {
      month = monthNum;
    } else if (/^\d{4}$/.test(part)) {
      year = parseInt(part);
    }
  }

  return new Date(year, month, 1);
}

// Calculate total years of experience from work history
function calculateYearsOfExperience(workExperience: Array<{ start_date: string; end_date: string }>): number {
  if (!workExperience || workExperience.length === 0) return 0;

  // Find earliest start date and latest end date
  let earliestStart = new Date();
  let latestEnd = new Date(0);

  for (const exp of workExperience) {
    const startDate = parseDateString(exp.start_date);
    const endDate = parseDateString(exp.end_date);

    if (startDate < earliestStart) {
      earliestStart = startDate;
    }
    if (endDate > latestEnd) {
      latestEnd = endDate;
    }
  }

  // Calculate years difference
  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const years = Math.floor((latestEnd.getTime() - earliestStart.getTime()) / msPerYear);

  // Return at least 1 year if they have work experience
  return Math.max(1, years);
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

// Analyze job description and compare against user's resume
export async function analyzeJobDescription(
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  resume: ParsedResume,
  jobDetails?: JobDetailsParsed
): Promise<JobAnalysis> {
  // Extract all user skills and experience for comparison
  const allBullets = resume.work_experience.flatMap(exp => exp.description || []);
  const userSkills = resume.skills || [];

  const prompt = `Analyze this job description and compare it against the candidate's resume.

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

${jobDetails ? `
PARSED JOB DETAILS:
Requirements: ${jobDetails.requirements.slice(0, 8).map(r => `• ${r}`).join('\n')}
Responsibilities: ${jobDetails.responsibilities.slice(0, 5).map(r => `• ${r}`).join('\n')}
Location: ${jobDetails.location || 'Not specified'}
Work Type: ${jobDetails.work_type || 'Not specified'}
Salary: ${jobDetails.salary_range || 'Not specified'}
` : ''}

CANDIDATE'S SKILLS:
${userSkills.join(', ')}

CANDIDATE'S EXPERIENCE:
${allBullets.slice(0, 10).map(b => `• ${b}`).join('\n')}

TASK: Perform a comprehensive analysis of the job and how well the candidate matches.

1. SUMMARY (2-3 sentences): Brief overview of the role and what the company is looking for.

2. KEYWORDS: Extract 10-15 key skills/technologies mentioned in the job description.
   - Mark each as "required" (must-have) or "preferred" (nice-to-have)
   - Check if each keyword appears in the candidate's skills or experience

3. REQUIREMENTS: List 6-10 key requirements from the job.
   - Categorize each as "required" or "preferred"
   - For each requirement, find matching experience from the candidate's resume
   - Mark match status: "matched" (direct match), "partial" (related experience), or "missing"

4. COVERAGE SCORE: Calculate a percentage (0-100) based on how many requirements/keywords the candidate matches.

Return ONLY valid JSON:
{
  "summary": "Brief summary of the role...",
  "keywords": [
    { "skill": "Python", "importance": "required", "inResume": true },
    { "skill": "Docker", "importance": "preferred", "inResume": false }
  ],
  "requirements": [
    {
      "text": "5+ years of software engineering experience",
      "priority": "required",
      "matchedExperience": "6 years as Software Engineer at Tech Corp",
      "matchStatus": "matched"
    },
    {
      "text": "Experience with Kubernetes",
      "priority": "preferred",
      "matchedExperience": null,
      "matchStatus": "missing"
    }
  ],
  "coverageScore": 75
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
    console.error("Failed to analyze job description:", error);
    // Return a minimal analysis on failure
    return {
      summary: `${jobTitle} position at ${companyName}.`,
      keywords: [],
      requirements: [],
      coverageScore: 0,
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
  // Extract key achievements with metrics from resume
  const allBullets = resume.work_experience.flatMap(exp => exp.description || []);
  const achievementBullets = allBullets
    .filter(b => /\d+%|\$[\d.,]+[KMB]?|\d+\+/.test(b))
    .slice(0, 3);

  const prompt = `**Situation**
You are writing the BODY ONLY of a cover letter for a job application. No greeting ("Dear...") and no closing signature ("Sincerely...") - those are handled separately. The cover letter must feel authentic, energetic, and human - not robotic or generic.

**Candidate Background**
${resume.work_experience.map(exp => `• ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date})`).join("\n")}

Key Skills: ${resume.skills.slice(0, 10).join(", ")}

Key Achievements:
${achievementBullets.length > 0 ? achievementBullets.map(b => `• ${b}`).join("\n") : "• See work experience above"}

**Target Role**
Position: ${jobTitle} at ${companyName}

Job Description:
${jobDescription.slice(0, 1500)}

**Task**
Write 3 paragraphs (250-300 words total) that create a compelling, human cover letter:

**Paragraph 1 - Attention-Grabbing Opening**
- Start with a sentence that immediately demonstrates genuine excitement about this role
- Show alignment with ${companyName}'s mission, values, or recent work (reference something specific from the job description)
- Connect your passion to real value you can bring in this ${jobTitle} role
- Feel authentic and energetic - avoid generic openings

**Paragraph 2 - Compelling Narrative**
- Highlight your most relevant experience and connect it directly to the job requirements
- Include 1-2 specific achievements with real numbers/metrics from your background
- Show you understand what they need and have done it before
- If your background seems like a transition, frame the shift as a strength

**Paragraph 3 - Strong, Memorable Closing**
- Be warm, confident, and leave a strong final impression
- Explain what specific value you'd bring to the team
- Invite the employer to connect
- End memorably - not with a generic "I look forward to hearing from you"

**Critical Rules**
- DO NOT start with "I am writing to..." or "I am excited to apply..." or "I came across..."
- DO NOT use "I believe I would be a great fit" or "I am confident that..."
- DO NOT sound stiff or robotic - be conversational and genuine
- VARY sentence structure - mix short punchy sentences with longer ones
- Use contractions naturally (I've, I'm, that's, don't)
- Be specific, not generic - reference actual experience and actual job requirements
- Sound like a confident professional wrote this, not an AI
- Match a professional but warm tone

Output ONLY the 3 paragraphs of body text, nothing else.`;

  return await callAI(prompt);
}

export interface EmailClassification {
  type: "confirmation" | "rejection" | "interview" | "offer" | "unrelated";
  company: string | null;
  confidence: number;
  summary: string;
  recruiter_name?: string | null;
  recruiter_email?: string | null;
  recruiter_title?: string | null;
}

// Recruiter info extracted from job description
export interface RecruiterInfo {
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_title: string | null;
  confidence: number;
}

// Extract recruiter/HR contact from job description
export async function extractRecruiterFromDescription(jobDescription: string): Promise<RecruiterInfo> {
  const prompt = `Analyze this job description and extract any recruiter, HR contact, or hiring manager information.

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

Look for:
- Names of recruiters, HR contacts, or hiring managers
- Email addresses (especially @company.com emails)
- Titles like "Recruiter", "Talent Acquisition", "HR Manager", "Hiring Manager"
- Phrases like "Contact:", "Apply to:", "Questions? Reach out to"

Return ONLY valid JSON:
{
  "recruiter_name": "Full Name or null if not found",
  "recruiter_email": "email@company.com or null if not found",
  "recruiter_title": "Job Title or null if not found",
  "confidence": 0.0 to 1.0 (based on how clearly the info was stated)
}

If no recruiter info is found, return all nulls with confidence 0.`;

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
  } catch {
    return {
      recruiter_name: null,
      recruiter_email: null,
      recruiter_title: null,
      confidence: 0,
    };
  }
}

// Import types from db
import { InterviewGuide, JobAnalysis } from "./db";

// Generate comprehensive interview preparation guide
export async function generateInterviewGuide(
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  resume: ParsedResume,
  jobDetails?: JobDetailsParsed
): Promise<InterviewGuide> {
  // Get company context first
  const companyContext = await getCompanyContext(companyName);

  // Extract user's top achievements for STAR answers
  const allBullets = resume.work_experience.flatMap(exp => exp.description || []);
  const achievementBullets = allBullets
    .filter(b => /\d+%|\$[\d.,]+[KMB]?|\d+\+/.test(b))
    .slice(0, 6);

  const prompt = `Create a comprehensive interview preparation guide for this candidate.

COMPANY: ${companyName}
ABOUT THE COMPANY: ${companyContext}

JOB TITLE: ${jobTitle}
JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

${jobDetails ? `
KEY REQUIREMENTS:
${jobDetails.requirements.slice(0, 5).map(r => `• ${r}`).join('\n')}

KEY RESPONSIBILITIES:
${jobDetails.responsibilities.slice(0, 5).map(r => `• ${r}`).join('\n')}
` : ''}

CANDIDATE BACKGROUND:
• Current/Recent Role: ${resume.work_experience[0]?.title} at ${resume.work_experience[0]?.company}
• Skills: ${resume.skills.slice(0, 10).join(', ')}
• Education: ${resume.education[0]?.degree} from ${resume.education[0]?.institution}

TOP ACHIEVEMENTS (for STAR answers):
${achievementBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Generate a comprehensive interview guide with:

1. COMPANY RESEARCH:
   - Brief company overview (2-3 sentences)
   - 3 recent news items or developments (can be general industry trends if specific news unknown)
   - Company culture summary (1-2 sentences based on job description tone)
   - 3-4 key competitors

2. INTERVIEW ROUNDS (create 5 rounds):
   Round 1: Phone Screen (30 min) - Initial HR/recruiter call
   Round 2: Technical/Skills Assessment (45-60 min) - Role-specific evaluation
   Round 3: Behavioral Interview (45 min) - Culture fit and soft skills
   Round 4: Hiring Manager Interview (45-60 min) - Deep dive with future manager
   Round 5: Final Round (30-45 min) - Executive or panel

   For each round include:
   - 4-5 likely questions specific to that round type
   - 2 STAR-format answer frameworks using the candidate's ACTUAL achievements above
   - 3 specific tips for that round

3. QUESTIONS TO ASK (organize by category):
   - About the Role (3 questions)
   - About the Team (3 questions)
   - About Growth (2 questions)
   - About Company Culture (2 questions)

4. GENERAL TIPS (5-6 tips specific to this role/company)

Return ONLY valid JSON matching this structure:
{
  "companyResearch": {
    "overview": "string",
    "recentNews": ["news1", "news2", "news3"],
    "culture": "string",
    "competitors": ["comp1", "comp2", "comp3"]
  },
  "interviewRounds": [
    {
      "round": 1,
      "type": "phone_screen",
      "typicalDuration": "30 minutes",
      "likelyQuestions": ["q1", "q2", "q3", "q4"],
      "starAnswers": [
        {
          "question": "Tell me about a time when...",
          "situation": "Context from candidate's background",
          "task": "What needed to be done",
          "action": "Specific actions taken",
          "result": "Measurable outcome"
        }
      ],
      "tips": ["tip1", "tip2", "tip3"]
    }
  ],
  "questionsToAsk": [
    { "category": "About the Role", "questions": ["q1", "q2", "q3"] }
  ],
  "generalTips": ["tip1", "tip2", "tip3", "tip4", "tip5"]
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
    console.error("Failed to generate interview guide:", error);
    return {
      companyResearch: {
        overview: `${companyName} is hiring for the ${jobTitle} position.`,
        recentNews: [],
        culture: "Company culture details not available.",
        competitors: [],
      },
      interviewRounds: [
        {
          round: 1,
          type: "phone_screen",
          typicalDuration: "30 minutes",
          likelyQuestions: ["Tell me about yourself", "Why are you interested in this role?"],
          starAnswers: [],
          tips: ["Research the company", "Prepare questions to ask"],
        },
      ],
      questionsToAsk: [
        { category: "About the Role", questions: ["What does success look like in this role?"] },
      ],
      generalTips: ["Research the company thoroughly", "Prepare specific examples from your experience"],
    };
  }
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

  // Calculate years of experience from actual dates
  const mostRecent = resume.work_experience[0];
  const totalYears = calculateYearsOfExperience(resume.work_experience);

  // Get role-specific summary examples
  const roleSummaryExamples = getRoleSummaries(jobTitle).slice(0, 2);

  // Build metrics section for prompt
  const metricsSection = userMetrics.length > 0
    ? `\nCANDIDATE'S ACTUAL METRICS (USE ONLY THESE - DO NOT INVENT):\n${userMetrics.map(m => `• ${m}`).join("\n")}\n`
    : "\n(No specific metrics found - do not invent metrics, focus on qualitative strengths)\n";

  const prompt = `**Situation**
You are crafting a professional resume summary for a specific job application. This summary will appear at the top of your resume and serves as the first impression for hiring managers at the target company. The summary must immediately communicate your value proposition and relevance to the role.

**Task**
Create a compelling 3-4 sentence professional summary that synthesizes your career experience, core competencies, and notable achievements. The summary should be specifically tailored to align with the requirements and culture of the ${jobTitle} role at ${companyName}.

**Objective**
Position yourself as the ideal candidate by demonstrating clear alignment between your professional background and the target role's requirements, while highlighting your unique value and differentiators that would make you stand out among other applicants.

**Knowledge**
Here is the information to create the summary:

- **Target Role Details**: ${jobTitle} at ${companyName}
- **Job Requirements**: ${jobDescription.slice(0, 1200)}
- **Your Experience**: ${totalYears}+ years of experience, most recently as ${mostRecent?.title || 'N/A'} at ${mostRecent?.company || 'N/A'}
- **Core Skills**: ${resume.skills.slice(0, 7).join(", ")}
- **Key Achievements**: ${achievementBullets.length > 0 ? achievementBullets.join("; ") : "Not specified"}
${metricsSection}
- **Company Information**: ${companyContext}

**Output Requirements**
The summary should:
- Be 3-4 sentences (approximately 50-80 words total)
- Lead with your professional identity and years of experience
- Incorporate 3-4 key skills that match the job description
- Include at least one quantifiable achievement from the metrics provided (DO NOT invent metrics)
- Use active, confident language with strong action verbs
- Avoid generic phrases like "team player" or "results-driven" unless backed by specific evidence
- Reflect terminology and keywords from the job posting to pass ATS systems
- End with a forward-looking statement about your goal or what you bring to the company

Generate 3 different summary options, each with a slightly different angle or emphasis.

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
1. Each bullet should be 1-2 lines (15-30 words) - detailed enough to show impact
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

export interface CalendarEventClassification {
  type: "interview" | "deadline" | "reminder" | "unrelated";
  company: string | null;
  confidence: number;
  summary: string;
}

export async function classifyCalendarEvent(
  event: { title: string; description: string; location: string; attendees: string[] },
  knownCompanies: string[]
): Promise<CalendarEventClassification> {
  const prompt = `Classify this calendar event related to job applications.

CALENDAR EVENT:
Title: ${event.title}
Description: ${event.description.slice(0, 500)}
Location: ${event.location}
Attendees: ${event.attendees.join(", ")}

COMPANIES THE USER HAS APPLIED TO:
${knownCompanies.join(", ")}

Classify this event as one of:
- "interview": Job interview, phone screen, technical interview, final round, etc.
- "deadline": Application deadline, follow-up deadline, document submission deadline
- "reminder": Reminder to apply, follow up, or check status
- "unrelated": Not related to any job application from the list

Return ONLY valid JSON:
{
  "type": "interview|deadline|reminder|unrelated",
  "company": "Company name from the list above, or null if unrelated",
  "confidence": 0.0 to 1.0,
  "summary": "Brief one-sentence summary of the event"
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

export async function classifyEmail(
  email: { from: string; subject: string; body: string; snippet: string },
  knownCompanies: string[]
): Promise<EmailClassification> {
  const prompt = `Classify this email related to job applications and extract recruiter information.

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

Also extract recruiter/HR contact information from:
- The "From" field (parse name and email)
- Email signature (look for name, title, contact info)
- Any mentioned recruiters or hiring managers

Return ONLY valid JSON:
{
  "type": "confirmation|rejection|interview|offer|unrelated",
  "company": "Company name from the list above, or null if unrelated",
  "confidence": 0.0 to 1.0,
  "summary": "Brief one-sentence summary of the email",
  "recruiter_name": "Full name of sender/recruiter or null",
  "recruiter_email": "Email address of sender/recruiter or null",
  "recruiter_title": "Title like 'Recruiter', 'HR Manager', etc. or null"
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
// Enhanced email classification with interview details extraction
export interface EnhancedEmailClassification extends EmailClassification {
  interview_details?: {
    interview_type: 'phone_screen' | 'technical' | 'behavioral' | 'onsite' | 'panel' | 'final' | 'other';
    proposed_datetime: string | null; // ISO string if extractable
    duration_minutes: number | null;
    location: string | null;
    meeting_link: string | null;
    interviewer_names: string[];
    requires_response: boolean;
  };
}

export async function classifyEmailEnhanced(
  email: { from: string; subject: string; body: string; snippet: string },
  knownCompanies: string[]
): Promise<EnhancedEmailClassification> {
  const prompt = `Classify this email related to job applications and extract all relevant details.

EMAIL:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.snippet} ${email.body.slice(0, 2000)}

COMPANIES THE USER HAS APPLIED TO:
${knownCompanies.join(", ")}

Classify this email and extract information:

1. EMAIL TYPE:
- "confirmation": Application received/submitted confirmation
- "rejection": The candidate was rejected or not moving forward
- "interview": Interview invitation, scheduling, or rescheduling
- "offer": Job offer
- "unrelated": Not related to any job application from the list

2. If type is "interview", also extract:
- Interview type: phone_screen, technical, behavioral, onsite, panel, final, or other
- Proposed date/time (in ISO format if clearly stated, e.g., "2024-01-15T10:00:00")
- Duration in minutes (e.g., 30, 45, 60)
- Location (if in-person) or meeting link (Zoom, Teams, etc.)
- Names of interviewers mentioned
- Whether the email requires a response to confirm/schedule

3. Extract recruiter information from the email

Return ONLY valid JSON:
{
  "type": "confirmation|rejection|interview|offer|unrelated",
  "company": "Company name or null",
  "confidence": 0.0 to 1.0,
  "summary": "Brief summary",
  "recruiter_name": "Name or null",
  "recruiter_email": "Email or null",
  "recruiter_title": "Title or null",
  "interview_details": {
    "interview_type": "phone_screen|technical|behavioral|onsite|panel|final|other",
    "proposed_datetime": "ISO string or null",
    "duration_minutes": number or null,
    "location": "string or null",
    "meeting_link": "URL or null",
    "interviewer_names": ["name1", "name2"],
    "requires_response": true or false
  }
}

Only include interview_details if type is "interview".`;

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
  } catch {
    return {
      type: "unrelated",
      company: null,
      confidence: 0,
      summary: "Failed to classify",
    };
  }
}

// Generate thank-you email content
export interface GeneratedEmail {
  subject: string;
  body: string;
}

export async function generateThankYouEmail(
  companyName: string,
  jobTitle: string,
  interviewerNames: string[],
  interviewType: string,
  candidateName: string,
  notesFromInterview?: string
): Promise<GeneratedEmail> {
  const prompt = `Write a professional thank-you email after a job interview.

CONTEXT:
- Company: ${companyName}
- Position: ${jobTitle}
- Interviewer(s): ${interviewerNames.length > 0 ? interviewerNames.join(", ") : "the interviewer"}
- Interview type: ${interviewType}
- Candidate name: ${candidateName}
${notesFromInterview ? `- Notes from interview: ${notesFromInterview}` : ""}

REQUIREMENTS:
1. Keep it brief (150-200 words max)
2. Be professional but warm
3. Reference something specific if notes are provided
4. Reiterate interest in the role
5. Don't be overly formal or stiff

Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "body": "Email body text (can include line breaks with \\n)"
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
  } catch {
    return {
      subject: `Thank you - ${jobTitle} Interview`,
      body: `Thank you for taking the time to speak with me about the ${jobTitle} position at ${companyName}. I enjoyed learning more about the role and the team.\n\nI remain very interested in this opportunity and look forward to hearing from you about next steps.\n\nBest regards,\n${candidateName}`,
    };
  }
}

// Generate follow-up email content
export async function generateFollowUpEmail(
  companyName: string,
  jobTitle: string,
  lastContactDate: string,
  candidateName: string,
  recruiterName?: string,
  context?: string
): Promise<GeneratedEmail> {
  const daysSince = Math.floor((Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24));

  const prompt = `Write a professional follow-up email for a job application.

CONTEXT:
- Company: ${companyName}
- Position: ${jobTitle}
- Days since last contact: ${daysSince}
- Candidate name: ${candidateName}
${recruiterName ? `- Recruiter name: ${recruiterName}` : ""}
${context ? `- Additional context: ${context}` : ""}

REQUIREMENTS:
1. Keep it brief (100-150 words max)
2. Be polite but direct - you're checking in on the status
3. Don't be pushy or desperate
4. Reference the timeline appropriately (if it's been a while, acknowledge it)
5. Make it easy for them to respond

Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "body": "Email body text (can include line breaks with \\n)"
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
  } catch {
    return {
      subject: `Following up - ${jobTitle} Application`,
      body: `${recruiterName ? `Hi ${recruiterName},` : "Hello,"}\n\nI hope this message finds you well. I wanted to follow up on my application for the ${jobTitle} position at ${companyName}.\n\nI remain very interested in this opportunity and would love to hear any updates on the hiring process when you have a chance.\n\nThank you for your time.\n\nBest regards,\n${candidateName}`,
    };
  }
}

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
- Each bullet should be 1-2 lines (15-30 words) - detailed enough to show impact
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
