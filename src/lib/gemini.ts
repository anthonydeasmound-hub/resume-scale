import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

// Helper to check if error is rate limit
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("429") || msg.includes("rate") || msg.includes("quota");
  }
  return false;
}

// Helper to call Groq as fallback
async function callGroq(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
  });
  return completion.choices[0]?.message?.content || "";
}

// Helper to call Gemini
async function callGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Call AI with Groq fallback
async function callAI(prompt: string): Promise<string> {
  try {
    return await callGemini(prompt);
  } catch (error) {
    if (isRateLimitError(error) && process.env.GROQ_API_KEY) {
      console.log("Gemini rate limited, falling back to Groq...");
      return await callGroq(prompt);
    }
    throw error;
  }
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

// Generate 3 summary options for the resume
export async function generateSummaryOptions(
  resume: ParsedResume,
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<string[]> {
  const prompt = `You are an expert resume writer. Generate 3 professional summary options for this candidate applying to ${jobTitle} at ${companyName}.

CANDIDATE BACKGROUND:
${resume.work_experience.map(exp => `- ${exp.title} at ${exp.company}`).join("\n")}
Skills: ${resume.skills.slice(0, 12).join(", ")}

TARGET JOB REQUIREMENTS:
${jobDescription.slice(0, 1200)}

WRITE 3 DIFFERENT SUMMARIES (2-3 sentences each, 40-60 words):

Summary 1 - Achievement Focus:
- Lead with years of experience and specialty
- Include one specific metric or achievement
- Connect to the target role

Summary 2 - Skills Focus:
- Lead with core competencies that match the job
- Highlight technical expertise or key abilities
- Show alignment with company needs

Summary 3 - Impact Focus:
- Lead with scope of responsibility or leadership
- Show business impact or transformation
- Express enthusiasm for the opportunity

RULES:
- Include at least one number/metric per summary
- Use keywords from the job description
- No clichés like "hardworking" or "team player" alone
- Each summary must be distinctly DIFFERENT

RESPOND WITH ONLY A JSON ARRAY OF 3 STRINGS:
["Summary 1 text here...", "Summary 2 text here...", "Summary 3 text here..."]`;

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
  const prompt = `You are an expert resume writer. Generate 8 UNIQUE bullet points for this role, optimized for the target job.

CANDIDATE'S ROLE: ${role.title} at ${role.company}
ORIGINAL EXPERIENCE:
${role.description.map((d, i) => `${i + 1}. ${d}`).join("\n")}

TARGET: ${jobTitle} at ${companyName}
JOB REQUIREMENTS:
${jobDescription.slice(0, 1200)}

RULES FOR EACH BULLET:
1. 10-18 words maximum (one line on resume)
2. Start with strong action verb (Led, Drove, Built, Achieved, Delivered, Increased, Reduced, Managed)
3. Include a metric when possible (%, $, #, time)
4. Match keywords from the job description naturally

CRITICAL - EACH BULLET MUST BE UNIQUE:
- Bullet 1: Focus on REVENUE/GROWTH impact
- Bullet 2: Focus on EFFICIENCY/PROCESS improvement
- Bullet 3: Focus on TEAM/LEADERSHIP achievement
- Bullet 4: Focus on TECHNICAL/SKILLS demonstration
- Bullet 5: Focus on CLIENT/STAKEHOLDER success
- Bullet 6: Focus on INNOVATION/INITIATIVE
- Bullet 7: Focus on PROBLEM-SOLVING example
- Bullet 8: Focus on COLLABORATION/CROSS-FUNCTIONAL work

DO NOT repeat similar achievements. Each bullet must highlight a DIFFERENT aspect of their work.

Example format:
- "Drove $1.2M revenue growth by expanding enterprise accounts 40% year-over-year"
- "Reduced customer churn 25% through proactive engagement and quarterly business reviews"
- "Led team of 6 to deliver product launch 2 weeks ahead of schedule"

RESPOND WITH ONLY A JSON ARRAY OF 8 STRINGS, ordered by relevance to the ${jobTitle} role:
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

// Generate skill recommendations optimized for the job
export async function generateSkillRecommendations(
  candidateSkills: string[],
  jobDescription: string,
  jobTitle: string,
  companyName: string
): Promise<{ recommended: string[]; fromResume: string[] }> {
  const prompt = `You are a resume ATS optimization expert. Analyze skills for the ${jobTitle} role at ${companyName}.

CANDIDATE'S SKILLS:
${candidateSkills.join(", ")}

JOB DESCRIPTION:
${jobDescription.slice(0, 1500)}

TASK: Return two skill lists as JSON.

1. "fromResume": Candidate's skills most relevant to this job (order by relevance, max 12)
   - Include skills that match or relate to job requirements
   - Use the job description's exact terminology when possible
   - Exclude skills irrelevant to this role

2. "recommended": Additional skills from the job description the candidate likely has but didn't list (max 6)
   - Only suggest skills plausible for someone with their background
   - Focus on common tools/skills for this role they may have forgotten to list
   - Don't suggest skills outside their likely experience

RESPOND WITH ONLY THIS JSON FORMAT, NO OTHER TEXT:
{
  "fromResume": ["Skill 1", "Skill 2", "Skill 3"],
  "recommended": ["Additional Skill 1", "Additional Skill 2"]
}`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Handle case where AI returns explanation instead of JSON
  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
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
