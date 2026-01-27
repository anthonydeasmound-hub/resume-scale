/**
 * Resume Examples Loader Utility
 * Provides functions to access curated resume examples data from JSON files
 */

// Import JSON data
import bulletsData from '@/data/resume-examples/bullets.json';
import skillsData from '@/data/resume-examples/skills.json';
import rolesData from '@/data/resume-examples/roles.json';
import actionVerbsData from '@/data/resume-examples/action-verbs.json';
import metricsGuideData from '@/data/resume-examples/metrics-guide.json';
import summariesData from '@/data/resume-examples/summaries.json';
import roleSummariesData from '@/data/resume-examples/role-summaries.json';

// Type definitions
export interface BulletExample {
  role: string;
  category: string;
  seniority: string;
  bullet: string;
  actionVerb: string;
  metricType: string;
  skills: string[];
}

export interface SkillsData {
  role: string;
  category: string;
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  certifications: string[];
}

export interface RoleData {
  id: number;
  role: string;
  category: string;
  url: string;
  status: string;
}

export interface ActionVerbCategory {
  category: string;
  verbs: string[];
  bestFor: string;
}

export interface MetricGuide {
  metricType: string;
  examples: string[];
  bestFor: string;
  formulaPattern: string;
}

export interface SummaryExample {
  id: number;
  type: 'GOOD' | 'BAD';
  text: string;
  explanation: string;
}

export interface RoleSummary {
  role: string;
  summary: string;
  skills: string[];
}

export interface RoleExamples {
  role: string;
  category: string;
  bullets: BulletExample[];
  skills: SkillsData | null;
  similarRoles: string[];
}

// Cast imported data to proper types
const bullets: BulletExample[] = bulletsData as BulletExample[];
const skills: SkillsData[] = skillsData as SkillsData[];
const roles: RoleData[] = rolesData as RoleData[];
const actionVerbs: ActionVerbCategory[] = actionVerbsData as ActionVerbCategory[];
const metricsGuide: MetricGuide[] = metricsGuideData as MetricGuide[];
const summaries: SummaryExample[] = summariesData as SummaryExample[];
const roleSummaries: RoleSummary[] = roleSummariesData as RoleSummary[];

/**
 * Normalize a role name for matching (lowercase, remove special characters)
 */
function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

/**
 * Calculate similarity score between two strings (simple word overlap)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = normalizeRole(str1).split(/\s+/);
  const words2 = normalizeRole(str2).split(/\s+/);

  let matchCount = 0;
  for (const word of words1) {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      matchCount++;
    }
  }

  return matchCount / Math.max(words1.length, words2.length);
}

/**
 * Role keyword mappings for better matching
 * Includes IC levels, abbreviations, and common variations
 */
const roleKeywordMap: Record<string, string[]> = {
  // Technology roles
  'Software Engineer': ['software', 'developer', 'engineer', 'programmer', 'coding', 'full stack', 'fullstack', 'swe', 'ic3', 'ic4', 'ic5', 'ic6', 'l3', 'l4', 'l5', 'l6', 'sde', 'software development engineer'],
  'Frontend Developer': ['frontend', 'front end', 'front-end', 'ui developer', 'react developer', 'angular developer', 'vue developer', 'web developer'],
  'Backend Developer': ['backend', 'back end', 'back-end', 'api developer', 'server', 'node developer', 'python developer', 'java developer'],
  'DevOps Engineer': ['devops', 'dev ops', 'infrastructure engineer', 'build engineer', 'release engineer', 'ci/cd'],
  'Site Reliability Engineer': ['sre', 'site reliability', 'reliability engineer', 'production engineer'],
  'Platform Engineer': ['platform engineer', 'developer experience', 'internal tools', 'devx'],
  'Cloud Architect': ['cloud architect', 'solutions architect', 'aws architect', 'azure architect', 'gcp architect'],
  'Security Engineer': ['security engineer', 'cybersecurity', 'infosec', 'application security', 'appsec'],

  // Data roles
  'Data Scientist': ['data scientist', 'data science', 'research scientist', 'applied scientist', 'quantitative analyst'],
  'Machine Learning Engineer': ['machine learning', 'ml engineer', 'ai engineer', 'mlops', 'deep learning'],
  'Data Engineer': ['data engineer', 'data platform', 'analytics engineer', 'etl developer', 'data infrastructure'],
  'Data Analyst': ['data analyst', 'analytics', 'bi analyst', 'business intelligence', 'reporting analyst'],
  'BI Analyst': ['bi analyst', 'business intelligence analyst', 'tableau analyst', 'looker analyst'],

  // Product & Design
  'Product Manager': ['product manager', 'pm', 'product owner', 'product lead', 'apm', 'associate product manager'],
  'Product Designer': ['product designer', 'ux/ui designer', 'digital product designer', 'experience designer'],
  'UX Designer': ['ux', 'ui/ux', 'user experience', 'interaction designer', 'usability'],
  'Graphic Designer': ['graphic designer', 'visual designer', 'brand designer'],

  // Sales roles
  'Sales Manager': ['sales manager', 'sales director', 'sales lead', 'regional sales'],
  'Account Executive': ['account executive', 'ae', 'enterprise ae', 'smb ae', 'commercial ae'],
  'Sales Development Representative': ['sdr', 'sales development', 'outbound sdr', 'inbound sdr'],
  'Business Development Manager': ['business development', 'bd manager', 'bdr', 'partnerships'],
  'Customer Success Manager': ['customer success', 'csm', 'client success', 'customer success manager'],

  // Marketing roles
  'Marketing Manager': ['marketing manager', 'marketing director', 'growth marketing', 'demand gen', 'performance marketing'],
  'Content Marketing Manager': ['content marketing', 'content manager', 'content strategist'],

  // HR roles
  'HR Manager': ['hr manager', 'human resources', 'people manager', 'talent manager'],
  'Recruiter': ['recruiter', 'talent acquisition', 'sourcer', 'technical recruiter'],
  'People Operations Manager': ['people ops', 'people operations', 'hr operations'],
  'HR Business Partner': ['hrbp', 'hr business partner', 'people partner'],
  'L&D Manager': ['l&d', 'learning and development', 'training manager', 'talent development'],

  // Operations roles
  'Operations Manager': ['operations manager', 'ops manager', 'operations director', 'business ops'],
  'Project Manager': ['project manager', 'pm', 'program manager', 'technical pm', 'it pm', 'delivery manager'],
  'Supply Chain Manager': ['supply chain', 'logistics manager', 'procurement'],

  // Finance roles
  'Financial Analyst': ['financial analyst', 'finance analyst', 'fp&a', 'fpa'],
  'FP&A Analyst': ['fp&a analyst', 'financial planning', 'budget analyst', 'planning analyst'],
  'Controller': ['controller', 'financial controller', 'assistant controller'],
  'Investment Analyst': ['investment analyst', 'research analyst', 'equity analyst', 'credit analyst'],
  'Accountant': ['accountant', 'accounting', 'cpa', 'bookkeeper'],

  // Other roles
  'Business Analyst': ['business analyst', 'ba', 'systems analyst', 'requirements analyst'],
  'QA Engineer': ['qa engineer', 'quality assurance', 'test engineer', 'sdet', 'automation engineer'],
  'Executive Assistant': ['executive assistant', 'ea', 'admin assistant', 'administrative'],
  'Technical Writer': ['technical writer', 'documentation writer', 'api writer', 'content developer'],
  'Copywriter': ['copywriter', 'content writer', 'marketing copywriter'],
  'Content Strategist': ['content strategist', 'editorial strategist'],

  // Consulting
  'Management Consultant': ['management consultant', 'strategy consultant', 'business consultant', 'consultant'],
  'Solutions Consultant': ['solutions consultant', 'sales engineer', 'pre-sales', 'solutions engineer'],

  // Executive roles
  'Chief Technology Officer': ['cto', 'chief technology officer', 'chief technical officer'],
  'VP of Engineering': ['vp engineering', 'vice president engineering', 'head of engineering'],
  'Chief Marketing Officer': ['cmo', 'chief marketing officer', 'head of marketing'],
  'Chief Revenue Officer': ['cro', 'chief revenue officer', 'head of revenue', 'head of sales'],
  'VP of Product': ['vp product', 'vice president product', 'head of product', 'cpo', 'chief product officer'],

  // Healthcare
  'Clinical Operations Manager': ['clinical ops', 'clinical operations', 'healthcare operations'],
  'Medical Director': ['medical director', 'clinical director', 'physician director'],
};

/**
 * Compute Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill in the rest
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score using Levenshtein distance (0-1, where 1 is exact match)
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * Fuzzy match input against candidates using Levenshtein distance
 */
export function fuzzyMatch(input: string, candidates: string[], threshold = 0.7): string | null {
  let bestMatch: { candidate: string; score: number } | null = null;

  const normalizedInput = normalizeRole(input);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeRole(candidate);
    const score = levenshteinSimilarity(normalizedInput, normalizedCandidate);

    if (score >= threshold && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { candidate, score };
    }
  }

  return bestMatch?.candidate || null;
}

/**
 * Detect seniority level from job title
 */
export function detectSeniority(title: string): 'entry' | 'mid' | 'senior' | 'executive' {
  const titleLower = title.toLowerCase();

  // Executive patterns
  const executivePatterns = [
    'cto', 'cfo', 'cmo', 'cro', 'cpo', 'coo', 'ceo',
    'chief', 'vp ', 'vice president', 'director',
    'head of', 'president', 'partner', 'founder',
    'general manager', 'gm', 'svp', 'evp'
  ];
  for (const pattern of executivePatterns) {
    if (titleLower.includes(pattern)) {
      return 'executive';
    }
  }

  // Senior patterns (including staff/principal/distinguished)
  const seniorPatterns = [
    'senior', 'sr.', 'sr ', 'lead', 'principal', 'staff',
    'architect', 'distinguished', 'fellow', 'manager',
    'ic5', 'ic6', 'ic7', 'l5', 'l6', 'l7',
    'team lead', 'tech lead', 'engineering lead'
  ];
  for (const pattern of seniorPatterns) {
    if (titleLower.includes(pattern)) {
      return 'senior';
    }
  }

  // Entry patterns
  const entryPatterns = [
    'junior', 'jr.', 'jr ', 'associate', 'intern',
    'entry', 'trainee', 'apprentice', 'graduate',
    'ic1', 'ic2', 'l1', 'l2', 'i ', 'ii'
  ];
  for (const pattern of entryPatterns) {
    if (titleLower.includes(pattern)) {
      return 'entry';
    }
  }

  // Default to mid-level
  return 'mid';
}

/**
 * Find the best matching role from our dataset
 * Uses a multi-stage matching approach: exact -> keyword -> fuzzy -> partial
 */
export function findSimilarRole(inputRole: string): string | null {
  const normalizedInput = normalizeRole(inputRole);

  // Stage 1: Exact match
  const exactMatch = roles.find(r => normalizeRole(r.role) === normalizedInput);
  if (exactMatch) return exactMatch.role;

  // Stage 2: Keyword matching (includes abbreviations, IC levels, etc.)
  for (const [role, keywords] of Object.entries(roleKeywordMap)) {
    for (const keyword of keywords) {
      // Check if input contains the keyword
      if (normalizedInput.includes(keyword)) {
        return role;
      }
      // Check if keyword contains the full input (for short abbreviations like "swe")
      if (keyword.length >= normalizedInput.length && keyword.includes(normalizedInput)) {
        return role;
      }
    }
  }

  // Stage 3: Fuzzy matching using Levenshtein distance
  const roleNames = roles.map(r => r.role);
  const fuzzyResult = fuzzyMatch(inputRole, roleNames, 0.7);
  if (fuzzyResult) return fuzzyResult;

  // Stage 4: Also try fuzzy matching against keyword map keys
  const keywordMapRoles = Object.keys(roleKeywordMap);
  const fuzzyKeywordResult = fuzzyMatch(inputRole, keywordMapRoles, 0.7);
  if (fuzzyKeywordResult) return fuzzyKeywordResult;

  // Stage 5: Partial match with word overlap scoring
  let bestMatch: { role: string; score: number } | null = null;

  for (const roleData of roles) {
    const score = calculateSimilarity(inputRole, roleData.role);

    // Also check if input contains the role or vice versa
    const normalizedRole = normalizeRole(roleData.role);
    if (normalizedInput.includes(normalizedRole) || normalizedRole.includes(normalizedInput)) {
      if (!bestMatch || score + 0.3 > bestMatch.score) {
        bestMatch = { role: roleData.role, score: score + 0.3 };
      }
    } else if (score > 0.2 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { role: roleData.role, score };
    }
  }

  return bestMatch?.role || null;
}

/**
 * Detect category from job title keywords
 */
function detectCategory(inputRole: string): string {
  const normalizedInput = normalizeRole(inputRole);

  const categoryKeywords: Record<string, string[]> = {
    'Technology': ['software', 'developer', 'engineer', 'devops', 'qa', 'technical', 'programming', 'coding', 'it ', 'tech'],
    'Data/Analytics': ['data', 'analyst', 'analytics', 'scientist', 'bi ', 'intelligence'],
    'Product': ['product', 'pm'],
    'Design': ['designer', 'ux', 'ui', 'creative', 'visual', 'graphic'],
    'Sales': ['sales', 'account executive', 'business development', 'bdr', 'sdr'],
    'Marketing': ['marketing', 'growth', 'content', 'brand', 'demand'],
    'Human Resources': ['hr', 'human resources', 'recruiter', 'talent', 'people'],
    'Operations': ['operations', 'ops', 'supply chain', 'logistics', 'procurement'],
    'Finance': ['finance', 'financial', 'accountant', 'accounting', 'cfo', 'controller'],
    'Customer Success': ['customer success', 'csm', 'client', 'support'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalizedInput.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Technology'; // Default fallback
}

/**
 * Get all available roles
 */
export function getAllRoles(): RoleData[] {
  return roles;
}

/**
 * Get roles by category
 */
export function getRolesByCategory(category: string): RoleData[] {
  const normalizedCategory = category.toLowerCase();
  return roles.filter(r => r.category.toLowerCase().includes(normalizedCategory));
}

/**
 * Get bullet examples for a specific role
 */
export function getBulletsByRole(role: string, seniority?: string): BulletExample[] {
  // Try to find matching role
  const matchedRole = findSimilarRole(role);

  let filteredBullets: BulletExample[] = [];

  if (matchedRole) {
    // Found a matching role - get its bullets
    filteredBullets = bullets.filter(b =>
      normalizeRole(b.role) === normalizeRole(matchedRole)
    );
  }

  // If no role match or no bullets found, try category-based fallback
  if (filteredBullets.length === 0) {
    const detectedCategory = detectCategory(role);
    filteredBullets = bullets.filter(b =>
      b.category.toLowerCase() === detectedCategory.toLowerCase()
    );
  }

  // If still nothing, return all bullets as last resort
  if (filteredBullets.length === 0) {
    filteredBullets = bullets;
  }

  // Filter by seniority if specified
  if (seniority) {
    const seniorityFiltered = filteredBullets.filter(b =>
      b.seniority.toLowerCase() === seniority.toLowerCase()
    );
    // Only apply seniority filter if it returns results
    if (seniorityFiltered.length > 0) {
      filteredBullets = seniorityFiltered;
    }
  }

  return filteredBullets;
}

/**
 * Get skills data for a specific role
 */
export function getSkillsForRole(role: string): SkillsData | null {
  const matchedRole = findSimilarRole(role);

  if (!matchedRole) return null;

  return skills.find(s =>
    normalizeRole(s.role) === normalizeRole(matchedRole)
  ) || null;
}

/**
 * Get all examples for a role (bullets, skills, related info)
 */
export function getExamplesForRole(role: string): RoleExamples {
  const matchedRole = findSimilarRole(role) || role;
  const roleData = roles.find(r => normalizeRole(r.role) === normalizeRole(matchedRole));
  const category = roleData?.category || 'General';

  const roleBullets = getBulletsByRole(matchedRole);
  const roleSkills = getSkillsForRole(matchedRole);

  // Find similar roles in the same category
  const similarRoles = roles
    .filter(r => r.category === category && r.role !== matchedRole)
    .slice(0, 5)
    .map(r => r.role);

  return {
    role: matchedRole,
    category,
    bullets: roleBullets,
    skills: roleSkills,
    similarRoles,
  };
}

/**
 * Get GOOD summary examples
 */
export function getGoodSummaries(): SummaryExample[] {
  return summaries.filter(s => s.type === 'GOOD');
}

/**
 * Get BAD summary examples (useful for showing what to avoid)
 */
export function getBadSummaries(): SummaryExample[] {
  return summaries.filter(s => s.type === 'BAD');
}

/**
 * Get role-specific summary examples
 */
export function getRoleSummaries(role: string): RoleSummary[] {
  const matchedRole = findSimilarRole(role);

  if (matchedRole) {
    // First try exact match
    const exactMatches = roleSummaries.filter(s =>
      normalizeRole(s.role) === normalizeRole(matchedRole)
    );
    if (exactMatches.length > 0) return exactMatches;
  }

  // Try partial matching based on keywords
  const normalizedInput = normalizeRole(role);
  const partialMatches = roleSummaries.filter(s => {
    const normalizedSummaryRole = normalizeRole(s.role);
    return normalizedInput.includes(normalizedSummaryRole) ||
           normalizedSummaryRole.includes(normalizedInput) ||
           normalizedInput.split(' ').some(word =>
             word.length > 3 && normalizedSummaryRole.includes(word)
           );
  });

  if (partialMatches.length > 0) return partialMatches;

  // Return all summaries as fallback examples
  return roleSummaries.slice(0, 3);
}

/**
 * Get all role summaries
 */
export function getAllRoleSummaries(): RoleSummary[] {
  return roleSummaries;
}

/**
 * Get all summary examples with their explanations
 */
export function getAllSummaries(): SummaryExample[] {
  return summaries;
}

/**
 * Get action verbs by category
 */
export function getActionVerbs(category?: string): ActionVerbCategory[] {
  if (!category) return actionVerbs;

  const normalizedCategory = category.toLowerCase();
  return actionVerbs.filter(av =>
    av.category.toLowerCase().includes(normalizedCategory) ||
    av.bestFor.toLowerCase().includes(normalizedCategory)
  );
}

/**
 * Get a flat list of all action verbs
 */
export function getAllActionVerbs(): string[] {
  return actionVerbs.flatMap(av => av.verbs);
}

/**
 * Get random action verbs for variety
 */
export function getRandomActionVerbs(count: number = 5, category?: string): string[] {
  const verbCategories = category ? getActionVerbs(category) : actionVerbs;
  const allVerbs = verbCategories.flatMap(av => av.verbs);

  // Shuffle and take count
  const shuffled = [...allVerbs].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get metrics guide by type
 */
export function getMetricsGuide(metricType?: string): MetricGuide[] {
  if (!metricType) return metricsGuide;

  const normalizedType = metricType.toLowerCase();
  return metricsGuide.filter(mg =>
    mg.metricType.toLowerCase().includes(normalizedType) ||
    mg.bestFor.toLowerCase().includes(normalizedType)
  );
}

/**
 * Get suggested metrics for a specific role
 */
export function getSuggestedMetrics(role: string): MetricGuide[] {
  const matchedRole = findSimilarRole(role);
  if (!matchedRole) return metricsGuide.slice(0, 5);

  const roleData = roles.find(r => r.role === matchedRole);
  if (!roleData) return metricsGuide.slice(0, 5);

  // Map categories to relevant metric types
  const categoryMetricMap: Record<string, string[]> = {
    'Technology': ['Percentage Improvement', 'Time Savings', 'Count/Volume', 'Accuracy/Quality'],
    'Sales': ['Dollar Amount', 'Percentage Improvement', 'Count/Volume', 'Rankings/Awards'],
    'Marketing': ['Dollar Amount', 'Conversion/Engagement', 'Percentage Improvement', 'Count/Volume'],
    'Finance': ['Dollar Amount', 'Percentage Improvement', 'Accuracy/Quality'],
    'Operations': ['Percentage Improvement', 'Time Savings', 'Dollar Amount', 'Count/Volume'],
    'Human Resources': ['Time Savings', 'Count/Volume', 'Percentage Improvement'],
    'Data/Analytics': ['Percentage Improvement', 'Count/Volume', 'Accuracy/Quality', 'Time Savings'],
    'Design': ['Conversion/Engagement', 'Percentage Improvement', 'Count/Volume'],
    'Customer Success': ['Customer Metrics', 'Percentage Improvement', 'Count/Volume'],
  };

  const relevantTypes = categoryMetricMap[roleData.category] || [];

  return metricsGuide.filter(mg =>
    relevantTypes.some(type => mg.metricType.includes(type))
  );
}

/**
 * Build a comprehensive prompt context for AI enhancement
 */
export function buildEnhancementContext(role: string, seniority?: string): {
  exampleBullets: BulletExample[];
  goodSummaries: SummaryExample[];
  badSummaries: SummaryExample[];
  suggestedVerbs: string[];
  suggestedMetrics: MetricGuide[];
  roleSkills: SkillsData | null;
} {
  const examples = getExamplesForRole(role);
  const filteredBullets = seniority
    ? examples.bullets.filter(b => b.seniority.toLowerCase() === seniority.toLowerCase())
    : examples.bullets;

  // Get category-appropriate action verbs
  const roleData = roles.find(r => r.role === examples.role);
  const categoryVerbs = roleData
    ? getActionVerbs(roleData.category)
    : actionVerbs;

  return {
    exampleBullets: filteredBullets.slice(0, 10), // Limit for prompt size
    goodSummaries: getGoodSummaries(),
    badSummaries: getBadSummaries(),
    suggestedVerbs: categoryVerbs.flatMap(av => av.verbs).slice(0, 20),
    suggestedMetrics: getSuggestedMetrics(role),
    roleSkills: examples.skills,
  };
}

/**
 * Format bullets for AI prompt inclusion
 */
export function formatBulletsForPrompt(bullets: BulletExample[]): string {
  return bullets
    .map(b => `- ${b.bullet} (${b.actionVerb}, ${b.metricType})`)
    .join('\n');
}

/**
 * Format summaries for AI prompt inclusion
 */
export function formatSummariesForPrompt(summaries: SummaryExample[], type: 'GOOD' | 'BAD'): string {
  const filtered = summaries.filter(s => s.type === type);
  return filtered
    .map(s => `"${s.text}" - ${s.explanation}`)
    .join('\n');
}
