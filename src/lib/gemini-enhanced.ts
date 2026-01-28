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
  detectSeniority,
  fuzzyMatch,
} from "./resume-examples";

// Import role tasks data from JSON
import roleTasksData from "@/data/resume-examples/role-tasks.json";

// Type definitions for role tasks JSON structure
interface RoleTaskConfig {
  displayName: string;
  category: string;
  aliases: string[];
  seniorityTasks: {
    entry: string[];
    mid: string[];
    senior: string[];
    executive: string[];
  };
  industryVariants: Record<string, string[]>;
}

type RoleTasksData = Record<string, RoleTaskConfig>;

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
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });
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

// Cast imported role tasks data
const roleTasks: RoleTasksData = roleTasksData as RoleTasksData;

/**
 * Detect industry from company name using common patterns
 */
function detectIndustry(company: string): string | null {
  const companyLower = company.toLowerCase();

  const industryPatterns: Record<string, string[]> = {
    saas: ['salesforce', 'hubspot', 'zendesk', 'slack', 'notion', 'asana', 'monday', 'atlassian', 'datadog', 'snowflake', 'stripe', 'twilio', 'okta', 'workday', 'servicenow'],
    fintech: ['stripe', 'plaid', 'square', 'paypal', 'venmo', 'robinhood', 'coinbase', 'affirm', 'klarna', 'chime', 'sofi', 'brex', 'ramp', 'mercury', 'bank', 'financial', 'capital', 'credit', 'lending', 'payment'],
    healthcare: ['hospital', 'health', 'medical', 'clinic', 'pharma', 'biotech', 'healthcare', 'care', 'patient', 'clinical', 'therapeutic', 'oscar', 'united health', 'cigna', 'humana', 'anthem'],
    ecommerce: ['amazon', 'shopify', 'ebay', 'etsy', 'wayfair', 'chewy', 'instacart', 'doordash', 'uber eats', 'grubhub', 'retail', 'commerce', 'store', 'shop', 'market'],
    media: ['netflix', 'spotify', 'disney', 'hulu', 'youtube', 'tiktok', 'meta', 'twitter', 'snap', 'pinterest', 'media', 'entertainment', 'streaming', 'content', 'news'],
    enterprise: ['ibm', 'oracle', 'sap', 'microsoft', 'cisco', 'dell', 'hp', 'vmware', 'redhat', 'enterprise'],
    startup: ['seed', 'series a', 'series b', 'early stage', 'venture', 'startup', 'stealth'],
    consulting: ['mckinsey', 'bain', 'bcg', 'deloitte', 'accenture', 'kpmg', 'pwc', 'ey', 'consulting', 'advisory'],
    agency: ['agency', 'creative', 'marketing agency', 'design agency', 'digital agency'],
  };

  for (const [industry, patterns] of Object.entries(industryPatterns)) {
    for (const pattern of patterns) {
      if (companyLower.includes(pattern)) {
        return industry;
      }
    }
  }

  return null;
}

/**
 * Find matching role config from role-tasks.json
 * Uses multi-stage matching: key match -> alias match -> fuzzy match
 */
function findRoleConfig(title: string): { key: string; config: RoleTaskConfig } | null {
  const titleLower = title.toLowerCase();
  const normalizedTitle = titleLower.replace(/[^a-z0-9\s]/g, '').trim();

  // Stage 1: Direct key match
  for (const [key, config] of Object.entries(roleTasks)) {
    const normalizedKey = key.replace(/_/g, ' ');
    if (normalizedTitle.includes(normalizedKey) || normalizedKey.includes(normalizedTitle)) {
      return { key, config };
    }
  }

  // Stage 2: Alias matching
  for (const [key, config] of Object.entries(roleTasks)) {
    for (const alias of config.aliases) {
      const aliasLower = alias.toLowerCase();
      if (normalizedTitle.includes(aliasLower) || aliasLower.includes(normalizedTitle)) {
        return { key, config };
      }
    }
  }

  // Stage 3: Fuzzy matching on display names
  const displayNames = Object.entries(roleTasks).map(([key, config]) => ({
    key,
    config,
    name: config.displayName,
  }));

  const fuzzyResult = fuzzyMatch(
    title,
    displayNames.map(d => d.name),
    0.6
  );

  if (fuzzyResult) {
    const found = displayNames.find(d => d.name === fuzzyResult);
    if (found) {
      return { key: found.key, config: found.config };
    }
  }

  // Stage 4: Keyword-based fallback
  const keywordMapping: Record<string, string> = {
    'engineer': 'software_engineer',
    'developer': 'software_engineer',
    'swe': 'software_engineer',
    'frontend': 'frontend_engineer',
    'backend': 'backend_engineer',
    'devops': 'devops_engineer',
    'sre': 'sre',
    'data': 'data_engineer',
    'ml': 'ml_engineer',
    'machine learning': 'ml_engineer',
    'product manager': 'product_manager',
    'pm': 'product_manager',
    'designer': 'product_designer',
    'ux': 'ux_designer',
    'sales': 'account_executive',
    'ae': 'account_executive',
    'sdr': 'sales_development_representative',
    'bdr': 'sales_development_representative',
    'marketing': 'marketing_manager',
    'recruiter': 'recruiter',
    'hr': 'people_ops_manager',
    'operations': 'operations_manager',
    'project': 'project_manager',
    'customer success': 'customer_success_manager',
    'csm': 'customer_success_manager',
    'consultant': 'management_consultant',
    'analyst': 'data_analyst',
    'finance': 'fpa_analyst',
    'accounting': 'controller',
  };

  for (const [keyword, roleKey] of Object.entries(keywordMapping)) {
    if (normalizedTitle.includes(keyword)) {
      const config = roleTasks[roleKey];
      if (config) {
        return { key: roleKey, config };
      }
    }
  }

  return null;
}

/**
 * Get role tasks with seniority and industry awareness
 * Falls back to dynamic AI generation if no template match
 */
function getRoleTasks(title: string, company?: string): string[] {
  const roleConfig = findRoleConfig(title);

  if (!roleConfig) {
    return [];
  }

  // Detect seniority from title
  const seniority = detectSeniority(title);

  // Get seniority-appropriate tasks
  const seniorityTasks = roleConfig.config.seniorityTasks[seniority] || roleConfig.config.seniorityTasks.mid;
  let tasks = [...seniorityTasks];

  // Add industry-specific tasks if company is provided
  if (company) {
    const industry = detectIndustry(company);
    if (industry && roleConfig.config.industryVariants[industry]) {
      const industryTasks = roleConfig.config.industryVariants[industry];
      tasks = [...tasks, ...industryTasks];
    }
  }

  return tasks;
}

/**
 * Generate dynamic role tasks using AI when no template exists
 * This is the fallback when template matching fails
 */
async function generateDynamicRoleTasks(title: string, company: string): Promise<string[]> {

  const prompt = `Generate 6 typical day-to-day tasks for a ${title} at ${company}.

REQUIREMENTS:
1. Be specific to what this role actually does daily
2. Include both tactical and strategic activities
3. Include collaboration with other teams/stakeholders
4. Include metrics/reporting activities where relevant
5. Be realistic and grounded in actual job responsibilities

EXAMPLES OF GOOD TASK DESCRIPTIONS:
- "Designing and implementing features in collaboration with product team"
- "Running weekly sales pipeline reviews with team leads"
- "Conducting user research interviews and synthesizing findings"

RESPOND WITH ONLY A JSON ARRAY:
["Task 1", "Task 2", "Task 3", "Task 4", "Task 5", "Task 6"]`;

  try {
    const response = await callAI(prompt);
    const cleanedResponse = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const tasks = JSON.parse(jsonMatch[0]);
      return tasks;
    }
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("[generateDynamicRoleTasks] Error:", error);
    return [];
  }
}

/**
 * Get role tasks with fallback chain:
 * 1. Template match (from role-tasks.json)
 * 2. Dynamic AI generation
 */
async function getRoleTasksWithFallback(title: string, company: string): Promise<string[]> {
  // Try template match first
  const templateTasks = getRoleTasks(title, company);

  if (templateTasks.length > 0) {
    return templateTasks;
  }

  // Fallback to dynamic AI generation
  return await generateDynamicRoleTasks(title, company);
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
4. Make it 1-2 lines (15-30 words) - detailed enough to show full impact
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

  // Get company context and role-specific tasks (with AI fallback)
  let companyContext: string;
  let roleTaskList: string[];

  try {
    [companyContext, roleTaskList] = await Promise.all([
      getCompanyContext(role.company),
      getRoleTasksWithFallback(role.title, role.company),
    ]);
  } catch (contextError) {
    console.error("[generateEnhancedOnboardingBullets] Error getting context:", contextError);
    // Fallback to generic context
    companyContext = `${role.company} is a company where the candidate worked.`;
    roleTaskList = [];
  }

  // Debug logging

  // Use the improved seniority detection
  const seniority = detectSeniority(role.title);
  const seniorityLevel = seniority === 'entry' ? 'entry-level' :
                          seniority === 'executive' ? 'executive' :
                          seniority === 'senior' ? 'senior' : 'mid-level';


  const prompt = `You are a ${role.title} at ${role.company}. Write 8 resume bullet points describing your SPECIFIC work at this company.

ABOUT ${role.company.toUpperCase()}:
${companyContext}

YOUR DAY-TO-DAY ACTIVITIES AS ${role.title.toUpperCase()}:
${roleTaskList.length > 0 ? roleTaskList.map(t => `• ${t}`).join("\n") : "• Research the typical responsibilities for this role"}

SENIORITY: ${seniorityLevel}

${existingBullets.length > 0 ? `EXISTING BULLETS (DO NOT DUPLICATE):
${existingBullets.map((d, i) => `${i + 1}. ${d}`).join("\n")}

` : ""}CRITICAL INSTRUCTIONS:
1. Each bullet should be 1-2 lines (15-30 words) - detailed enough to show impact
2. Each bullet must describe a SPECIFIC activity you did, not just a result
3. Reference ${role.company}'s actual product/service/industry in at least 3 bullets
4. Include WHO you worked with (clients, teams, stakeholders)
5. Include WHAT tools/methods you used
6. Include the RESULT with a metric

GOOD: "Prospected 200+ enterprise accounts using ${role.company}'s platform, generating $1.2M in qualified pipeline within 6 months through strategic outbound campaigns"

BAD (generic): "Exceeded sales targets by 30%"
GOOD (specific): "Booked 15+ demos weekly, exceeding quota 30% for 4 quarters"

REFERENCE EXAMPLES:
${exampleBulletsText || "Use general best practices"}

METRIC FORMAT: Always use numbers (25%, $1.2M, 50+) - never write them out

RESPOND WITH ONLY A JSON ARRAY:
["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5", "Bullet 6", "Bullet 7", "Bullet 8"]`;

  const response = await callAI(prompt);

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
