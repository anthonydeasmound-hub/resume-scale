/**
 * Enhanced AI functions using curated resume examples
 * These functions supplement the main gemini.ts with example-backed generation
 */

import Groq from "groq-sdk";
import {
  buildEnhancementContext,
  formatBulletsForPrompt,
  getGoodSummaries,
  getBadSummaries,
  getSkillsForRole,
  findSimilarRole,
} from "./resume-examples";

// Initialize Groq client
const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  console.warn("[gemini-enhanced] GROQ_API_KEY is not set!");
}
const groq = new Groq({ apiKey: groqApiKey || "" });

// Call Groq LLM
async function callAI(prompt: string): Promise<string> {
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  try {
    console.log("[callAI] Making Groq API call, prompt length:", prompt.length);
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });
    console.log("[callAI] Groq API call successful");
    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("[callAI] Groq API error:", error);
    throw error;
  }
}

// Get company context - what does this company do?
async function getCompanyContext(company: string): Promise<string> {
  const prompt = `In 1-2 sentences, describe what ${company} does as a company. Focus on their main product/service and industry. If you don't know the company, make a reasonable inference based on the name. Be concise.`;
  return await callAI(prompt);
}

// Role-specific task templates - what does this role actually DO day-to-day?
const roleTaskTemplates: Record<string, string[]> = {
  // Sales roles
  "account development representative": [
    "Cold calling and prospecting potential clients",
    "Qualifying inbound leads and scheduling demos",
    "Managing CRM pipeline and tracking outreach metrics",
    "Collaborating with Account Executives on deals",
    "Conducting discovery calls to understand client needs",
    "Building email sequences and outreach campaigns",
  ],
  "account executive": [
    "Running product demos and presentations",
    "Negotiating contracts and closing deals",
    "Managing full sales cycle from prospect to close",
    "Building relationships with key stakeholders",
    "Forecasting and pipeline management",
    "Upselling and cross-selling to existing accounts",
  ],
  "sales development representative": [
    "Prospecting and cold outreach via phone/email",
    "Qualifying leads using BANT/MEDDIC frameworks",
    "Setting meetings for Account Executives",
    "Researching target accounts and contacts",
    "Tracking activities in Salesforce/HubSpot",
    "Hitting daily/weekly outreach quotas",
  ],
  "business development": [
    "Identifying new market opportunities",
    "Building strategic partnerships",
    "Creating pitch decks and proposals",
    "Networking at industry events",
    "Negotiating partnership agreements",
    "Analyzing market trends and competitors",
  ],
  // Engineering roles
  "software engineer": [
    "Designing and implementing features",
    "Writing unit tests and integration tests",
    "Code reviews and technical documentation",
    "Debugging and resolving production issues",
    "Collaborating with product and design teams",
    "Optimizing application performance",
  ],
  "frontend engineer": [
    "Building responsive UI components",
    "Implementing designs from Figma/Sketch",
    "Optimizing page load and rendering performance",
    "Writing accessible, cross-browser compatible code",
    "Integrating with REST/GraphQL APIs",
    "Managing state with Redux/Context",
  ],
  "backend engineer": [
    "Designing and building APIs",
    "Managing databases and data models",
    "Implementing authentication and authorization",
    "Optimizing query performance",
    "Setting up CI/CD pipelines",
    "Monitoring and alerting systems",
  ],
  // Marketing roles
  "marketing manager": [
    "Planning and executing marketing campaigns",
    "Managing marketing budget and ROI tracking",
    "Coordinating with sales on lead generation",
    "Analyzing campaign performance metrics",
    "Managing agency and vendor relationships",
    "Creating marketing collateral and content",
  ],
  "product marketing": [
    "Creating positioning and messaging",
    "Launching new products and features",
    "Developing sales enablement materials",
    "Conducting competitive analysis",
    "Gathering customer feedback and insights",
    "Training sales teams on product value props",
  ],
  // Product roles
  "product manager": [
    "Defining product roadmap and priorities",
    "Writing PRDs and user stories",
    "Conducting user research and interviews",
    "Analyzing product metrics and KPIs",
    "Coordinating cross-functional teams",
    "Making data-driven prioritization decisions",
  ],
  // Operations roles
  "operations manager": [
    "Streamlining workflows and processes",
    "Managing team schedules and resources",
    "Tracking KPIs and performance metrics",
    "Implementing process improvements",
    "Coordinating with vendors and suppliers",
    "Creating SOPs and documentation",
  ],
  "project manager": [
    "Creating project plans and timelines",
    "Running standups and status meetings",
    "Managing stakeholder expectations",
    "Tracking deliverables and milestones",
    "Identifying and mitigating risks",
    "Allocating resources across projects",
  ],
  // Customer-facing roles
  "customer success": [
    "Onboarding new customers",
    "Conducting quarterly business reviews",
    "Monitoring customer health scores",
    "Driving product adoption and usage",
    "Handling escalations and renewals",
    "Identifying upsell opportunities",
  ],
  "account manager": [
    "Managing portfolio of client accounts",
    "Building relationships with stakeholders",
    "Conducting regular check-ins and reviews",
    "Identifying growth opportunities",
    "Resolving client issues and concerns",
    "Coordinating with internal teams on delivery",
  ],
};

// Find matching role tasks
function getRoleTasks(title: string): string[] {
  const titleLower = title.toLowerCase();

  // Direct match
  for (const [role, tasks] of Object.entries(roleTaskTemplates)) {
    if (titleLower.includes(role) || role.includes(titleLower)) {
      return tasks;
    }
  }

  // Partial keyword matching
  const keywords: Record<string, string> = {
    "sdr": "sales development representative",
    "adr": "account development representative",
    "ae": "account executive",
    "bdr": "business development",
    "pm": "product manager",
    "swe": "software engineer",
    "csm": "customer success",
    "sales": "account executive",
    "engineer": "software engineer",
    "developer": "software engineer",
    "marketing": "marketing manager",
    "operations": "operations manager",
    "project": "project manager",
    "account": "account manager",
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

// Type definitions
export interface EnhancedBullet {
  original: string;
  enhanced: string;
  improvements: string[];
  score: {
    before: number;
    after: number;
  };
}

export interface ResumeReview {
  overallScore: number;
  categoryScores: {
    impact: number;
    metrics: number;
    actionVerbs: number;
    relevance: number;
    clarity: number;
  };
  strengths: string[];
  improvements: string[];
  bulletFeedback: {
    bullet: string;
    score: number;
    feedback: string;
    suggestion?: string;
  }[];
}

/**
 * Enhance a single bullet point using curated examples
 */
export async function enhanceBulletWithExamples(
  bullet: string,
  role: { title: string; company: string },
  seniority?: string
): Promise<EnhancedBullet> {
  const context = buildEnhancementContext(role.title, seniority);
  const exampleBulletsText = formatBulletsForPrompt(context.exampleBullets.slice(0, 5));
  const goodExamples = context.goodSummaries.map(e => `"${e.text}" - ${e.explanation}`).join("\n");
  const badExamples = context.badSummaries.map(e => `"${e.text}" - ${e.explanation}`).join("\n");

  const prompt = `You are a CPRW-certified resume expert. Enhance this bullet point using the STAR+Metric formula.

CANDIDATE CONTEXT
ROLE: ${role.title} at ${role.company}
SENIORITY: ${seniority || "Not specified"}

ORIGINAL BULLET TO ENHANCE
"${bullet}"

EXCELLENT EXAMPLES FOR ${role.title.toUpperCase()} ROLES
${exampleBulletsText || "Use general best practices"}

WEAK vs STRONG PATTERNS
WEAK PATTERNS TO AVOID:
${badExamples}

STRONG PATTERNS TO FOLLOW:
${goodExamples}

SUGGESTED ACTION VERBS
${context.suggestedVerbs.join(", ")}

METRIC FORMATS (Always use numeric format)
- Percentages: 25%, 30%, 40% (NOT "twenty-five percent")
- Dollar amounts: $1.2M, $500K, $2M (NOT "one million dollars")
- Counts: 10+, 50+, 100+ (NOT "ten or more")
- Time: 2 weeks, 1 month (NOT "two weeks")
${context.suggestedMetrics.map(m => `- ${m.metricType}: ${m.formulaPattern}`).join("\n")}

YOUR TASK
1. Analyze the original bullet for weaknesses
2. Rewrite it following the STAR+Metric formula
3. Keep it realistic and truthful to the original context
4. Make it 8-12 words (concise, one resume line)
5. Include at least ONE quantifiable metric using NUMERIC format (25%, $1M, 10+)
6. Start with a POWER ACTION VERB

CRITICAL: ALWAYS use numbers (25%, $1.2M, 10+) - NEVER write out numbers as words.

RESPOND WITH ONLY THIS JSON:
{
  "original": "${bullet}",
  "enhanced": "Your improved bullet here",
  "improvements": ["List 2-3 specific improvements you made"],
  "score": {
    "before": 1-10,
    "after": 1-10
  }
}`;

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
}

/**
 * Review entire resume and provide detailed feedback
 */
export async function reviewResume(
  bullets: string[],
  role: { title: string; company: string },
  seniority?: string
): Promise<ResumeReview> {
  const context = buildEnhancementContext(role.title, seniority);
  const goodExamples = getGoodSummaries().slice(0, 4);
  const badExamples = getBadSummaries().slice(0, 4);

  const prompt = `You are a senior resume reviewer at a top executive search firm. Analyze this resume content.

CANDIDATE CONTEXT
ROLE: ${role.title} at ${role.company}
SENIORITY: ${seniority || "Not specified"}

RESUME BULLETS TO REVIEW
${bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

SCORING CRITERIA
Rate each category 1-10:

IMPACT (Weight: 30%)
- Does each bullet show business outcomes?
- Are results quantified where possible?

METRICS (Weight: 25%)
- Are numbers used effectively (%, $, #)?
- Are metrics specific and believable?

ACTION VERBS (Weight: 15%)
- Strong power verbs vs weak passive language?
- Variety in verb usage?

RELEVANCE (Weight: 20%)
- Appropriate for ${role.title} level?
- Industry-appropriate language?

CLARITY (Weight: 10%)
- Concise and scannable?
- Free of jargon and buzzwords?

WEAK vs STRONG EXAMPLES FOR REFERENCE
WEAK (What to avoid):
${badExamples.map(e => `"${e.text}" - ${e.explanation}`).join("\n")}

STRONG (What to aim for):
${goodExamples.map(e => `"${e.text}" - ${e.explanation}`).join("\n")}

EXPECTED SKILLS FOR ${role.title.toUpperCase()}
${context.roleSkills ? `Hard Skills: ${context.roleSkills.hardSkills.join(", ")}\nTools: ${context.roleSkills.tools.join(", ")}` : "General professional skills"}

OUTPUT FORMAT
RESPOND WITH ONLY THIS JSON:
{
  "overallScore": 1-100,
  "categoryScores": {
    "impact": 1-10,
    "metrics": 1-10,
    "actionVerbs": 1-10,
    "relevance": 1-10,
    "clarity": 1-10
  },
  "strengths": ["2-3 things done well"],
  "improvements": ["2-3 priority improvements needed"],
  "bulletFeedback": [
    {
      "bullet": "Original bullet text",
      "score": 1-10,
      "feedback": "Specific feedback for this bullet",
      "suggestion": "Improved version if score < 7"
    }
  ]
}`;

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
}

/**
 * Generate enhanced onboarding bullets using curated examples
 */
export async function generateEnhancedOnboardingBullets(
  role: { company: string; title: string },
  existingBullets: string[]
): Promise<string[]> {
  const context = buildEnhancementContext(role.title);
  const exampleBulletsText = formatBulletsForPrompt(context.exampleBullets.slice(0, 8));

  // Get company context and role-specific tasks
  let companyContext: string;
  let roleTasks: string[];

  try {
    [companyContext, roleTasks] = await Promise.all([
      getCompanyContext(role.company),
      Promise.resolve(getRoleTasks(role.title)),
    ]);
  } catch (contextError) {
    console.error("[generateEnhancedOnboardingBullets] Error getting context:", contextError);
    // Fallback to generic context
    companyContext = `${role.company} is a company where the candidate worked.`;
    roleTasks = [];
  }

  // Debug logging
  console.log(`[generateEnhancedOnboardingBullets] Role: ${role.title} at ${role.company}`);
  console.log(`[generateEnhancedOnboardingBullets] Company context: ${companyContext.slice(0, 100)}...`);
  console.log(`[generateEnhancedOnboardingBullets] Role tasks: ${roleTasks.length} found`);

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

  const prompt = `You are a ${role.title} at ${role.company}. Write 8 resume bullet points describing your SPECIFIC work at this company.

ABOUT ${role.company.toUpperCase()}:
${companyContext}

YOUR DAY-TO-DAY ACTIVITIES AS ${role.title.toUpperCase()}:
${roleTasks.length > 0 ? roleTasks.map(t => `• ${t}`).join("\n") : "• Research the typical responsibilities for this role"}

SENIORITY: ${seniorityLevel}

${existingBullets.length > 0 ? `EXISTING BULLETS (DO NOT DUPLICATE):
${existingBullets.map((d, i) => `${i + 1}. ${d}`).join("\n")}

` : ""}CRITICAL INSTRUCTIONS:
1. Each bullet must be 8-12 words (concise, fits one resume line)
2. Each bullet must describe a SPECIFIC activity you did, not just a result
3. Reference ${role.company}'s actual product/service/industry in at least 3 bullets
4. Include WHO you worked with (clients, teams, stakeholders)
5. Include WHAT tools/methods you used
6. Include the RESULT with a metric

BAD (too long): "Prospected 200+ enterprise accounts using the platform, generating $1.2M pipeline in 6 months"
GOOD (concise): "Prospected 200+ accounts via ${role.company} platform, generating $1.2M pipeline"

BAD (generic): "Exceeded sales targets by 30%"
GOOD (specific): "Booked 15+ demos weekly, exceeding quota 30% for 4 quarters"

REFERENCE EXAMPLES:
${exampleBulletsText || "Use general best practices"}

METRIC FORMAT: Always use numbers (25%, $1.2M, 50+) - never write them out

RESPOND WITH ONLY A JSON ARRAY:
["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5", "Bullet 6", "Bullet 7", "Bullet 8"]`;

  const response = await callAI(prompt);
  console.log("[generateEnhancedOnboardingBullets] Raw AI response:", response.slice(0, 200));

  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(cleanedResponse);
  } catch (parseError) {
    console.error("[generateEnhancedOnboardingBullets] JSON parse error:", parseError);
    console.error("[generateEnhancedOnboardingBullets] Raw response was:", cleanedResponse.slice(0, 500));
    throw new Error(`Failed to parse AI response: ${parseError}`);
  }
}

export interface SkillSuggestions {
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
}

/**
 * Generate skill suggestions based on role and existing skills
 */
export async function generateEnhancedSkillSuggestions(
  roles: { title: string; company: string }[],
  existingSkills: string[]
): Promise<SkillSuggestions> {
  // Get skills data for each role and combine
  const allHardSkills: Set<string> = new Set();
  const allSoftSkills: Set<string> = new Set();
  const allTools: Set<string> = new Set();

  for (const role of roles) {
    const matchedRole = findSimilarRole(role.title);
    const skillsData = matchedRole ? getSkillsForRole(matchedRole) : null;

    if (skillsData) {
      skillsData.hardSkills.forEach(s => allHardSkills.add(s));
      skillsData.softSkills.forEach(s => allSoftSkills.add(s));
      skillsData.tools.forEach(s => allTools.add(s));
    }
  }

  // Debug logging
  console.log(`[generateEnhancedSkillSuggestions] Roles: ${roles.map(r => r.title).join(", ")}`);
  console.log(`[generateEnhancedSkillSuggestions] Found ${allHardSkills.size} hard skills, ${allSoftSkills.size} soft skills, ${allTools.size} tools from sheet`);

  const primaryRole = roles[0]?.title || "Professional";

  const prompt = `You are a career coach helping someone optimize their resume skills section.

CANDIDATE CONTEXT
Primary Role: ${primaryRole}
All Roles: ${roles.map(r => `${r.title} at ${r.company}`).join(", ")}

EXISTING SKILLS (DO NOT SUGGEST DUPLICATES):
${existingSkills.length > 0 ? existingSkills.join(", ") : "(none yet)"}

CURATED SKILLS FOR SIMILAR ROLES (Reference these as suggestions):
Hard Skills: ${Array.from(allHardSkills).join(", ") || "General professional skills"}
Soft Skills: ${Array.from(allSoftSkills).join(", ") || "Communication, Leadership, Problem-Solving"}
Tools: ${Array.from(allTools).join(", ") || "Microsoft Office, Google Workspace"}

YOUR TASK:
Generate skill suggestions that:
1. Are RELEVANT to ${primaryRole} roles
2. Are NOT already in the existing skills list
3. Would strengthen a resume for this career path
4. Include a mix of technical and soft skills

Generate exactly:
- 8 hard/technical skills
- 4 soft skills
- 4 tools/technologies

RESPOND WITH ONLY THIS JSON:
{
  "hardSkills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
  "softSkills": ["skill1", "skill2", "skill3", "skill4"],
  "tools": ["tool1", "tool2", "tool3", "tool4"]
}`;

  const response = await callAI(prompt);
  const cleanedResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const result = JSON.parse(jsonMatch[0]);
    // Filter out any skills that are already in existingSkills
    const existingLower = existingSkills.map(s => s.toLowerCase());
    return {
      hardSkills: (result.hardSkills || []).filter((s: string) => !existingLower.includes(s.toLowerCase())),
      softSkills: (result.softSkills || []).filter((s: string) => !existingLower.includes(s.toLowerCase())),
      tools: (result.tools || []).filter((s: string) => !existingLower.includes(s.toLowerCase())),
    };
  }

  return JSON.parse(cleanedResponse);
}
