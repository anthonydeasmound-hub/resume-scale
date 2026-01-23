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
 */
const roleKeywordMap: Record<string, string[]> = {
  'Software Engineer': ['software', 'developer', 'engineer', 'programmer', 'coding', 'full stack', 'fullstack', 'swe'],
  'Frontend Developer': ['frontend', 'front end', 'front-end', 'ui developer', 'react', 'angular', 'vue'],
  'Backend Developer': ['backend', 'back end', 'back-end', 'api', 'server', 'node', 'python developer'],
  'DevOps Engineer': ['devops', 'dev ops', 'sre', 'site reliability', 'infrastructure', 'platform engineer'],
  'Data Scientist': ['data scientist', 'machine learning', 'ml engineer', 'ai engineer'],
  'Data Analyst': ['data analyst', 'analytics', 'bi analyst', 'business intelligence'],
  'Product Manager': ['product manager', 'pm', 'product owner', 'product lead'],
  'UX Designer': ['ux', 'ui/ux', 'user experience', 'product designer', 'interaction designer'],
  'Graphic Designer': ['graphic designer', 'visual designer', 'brand designer'],
  'Sales Manager': ['sales manager', 'sales director', 'sales lead', 'regional sales'],
  'Account Executive': ['account executive', 'ae', 'sales rep', 'sales representative', 'bdr', 'sdr'],
  'Business Development Manager': ['business development', 'bd manager', 'partnerships'],
  'Marketing Manager': ['marketing manager', 'marketing director', 'growth marketing', 'demand gen'],
  'Content Marketing Manager': ['content marketing', 'content manager', 'content strategist'],
  'HR Manager': ['hr manager', 'human resources', 'people manager', 'talent manager'],
  'Recruiter': ['recruiter', 'talent acquisition', 'sourcer'],
  'Operations Manager': ['operations manager', 'ops manager', 'operations director'],
  'Supply Chain Manager': ['supply chain', 'logistics manager', 'procurement'],
  'Financial Analyst': ['financial analyst', 'finance analyst', 'fp&a'],
  'Accountant': ['accountant', 'accounting', 'cpa', 'bookkeeper'],
  'Business Analyst': ['business analyst', 'ba', 'systems analyst', 'requirements analyst'],
  'IT Project Manager': ['project manager', 'pm', 'program manager', 'technical pm', 'it pm'],
  'Customer Success Manager': ['customer success', 'csm', 'client success', 'account manager'],
  'QA Engineer': ['qa engineer', 'quality assurance', 'test engineer', 'sdet', 'automation engineer'],
  'Executive Assistant': ['executive assistant', 'ea', 'admin assistant', 'administrative'],
};

/**
 * Find the best matching role from our dataset
 */
export function findSimilarRole(inputRole: string): string | null {
  const normalizedInput = normalizeRole(inputRole);

  // First, try exact match
  const exactMatch = roles.find(r => normalizeRole(r.role) === normalizedInput);
  if (exactMatch) return exactMatch.role;

  // Try keyword matching
  for (const [role, keywords] of Object.entries(roleKeywordMap)) {
    for (const keyword of keywords) {
      if (normalizedInput.includes(keyword) || keyword.includes(normalizedInput)) {
        return role;
      }
    }
  }

  // Try partial match with similarity scoring
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
