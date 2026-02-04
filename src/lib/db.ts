import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// Lazy initialization — avoids throwing during Next.js build when DATABASE_URL isn't set.
let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

/**
 * Query a single row. Returns undefined if no rows match.
 */
export async function queryOne<T>(query: string, params: unknown[] = []): Promise<T | undefined> {
  const sql = getSql();
  const rows = await sql.query(query, params);
  return rows[0] as T | undefined;
}

/**
 * Query multiple rows.
 */
export async function queryAll<T>(query: string, params: unknown[] = []): Promise<T[]> {
  const sql = getSql();
  const rows = await sql.query(query, params);
  return rows as T[];
}

/**
 * Execute a write query (INSERT/UPDATE/DELETE).
 * For INSERT, add "RETURNING id" to your query to get the new row's ID.
 */
export async function execute(query: string, params: unknown[] = []): Promise<{ rows: Record<string, unknown>[]; rowCount: number }> {
  const sql = getSql();
  const rows = await sql.query(query, params);
  return { rows: rows as Record<string, unknown>[], rowCount: rows.length };
}

// Re-export types for backwards compatibility
export interface User {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  created_at: string;
}

export interface Resume {
  id: number;
  user_id: number;
  profile_name: string;
  is_primary: boolean;
  profile_description: string | null;
  contact_info: string | null;
  work_experience: string | null;
  skills: string | null;
  education: string | null;
  certifications: string | null;
  languages: string | null;
  honors: string | null;
  profile_photo_path: string | null;
  summary: string | null;
  resume_style: string;
  accent_color: string | null;
  raw_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: number;
  user_id: number;
  company_name: string;
  job_title: string;
  job_description: string | null;
  tailored_resume: string | null;
  cover_letter: string | null;
  resume_style: string;
  resume_color: string;
  status: "draft" | "review" | "applied" | "interview" | "rejected" | "offer" | "bookmarked" | "applying" | "interviewing" | "negotiating" | "accepted";
  reviewed: number;
  date_applied: string | null;
  job_details_parsed: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_title: string | null;
  recruiter_source: "email" | "job_description" | "manual" | null;
  interview_guide: string | null;
  interview_guide_generated_at: string | null;
  job_analysis: string | null;
  archived_at: string | null;
  pinned: number;
  last_activity_at: string | null;
  source_profile_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobNote {
  id: number;
  job_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface BulletFeedback {
  id: number;
  user_id: number;
  role_title: string;
  company: string | null;
  bullet_text: string;
  feedback: "up" | "down";
  was_user_written: number;
  created_at: string;
}

export interface JobAnalysisKeyword {
  skill: string;
  importance: "required" | "preferred";
  inResume: boolean;
}

export interface JobAnalysisRequirement {
  text: string;
  priority: "required" | "preferred";
  matchedExperience: string | null;
  matchStatus: "matched" | "partial" | "missing";
}

export interface JobAnalysis {
  summary: string;
  keywords: JobAnalysisKeyword[];
  requirements: JobAnalysisRequirement[];
  coverageScore: number;
}

// Prep card for bite-sized study items
export interface PrepCard {
  id: string;
  type: "question" | "tip" | "talking_point" | "star_story";
  front: string;  // Question or prompt
  back: string;   // Answer framework or tip
  category?: string;
}

// Interview stage with flexible typing
export interface InterviewStagePrep {
  id: string;
  name: string;
  type: string;  // Flexible - can be "phone_screen", "sales_demo", "case_study", etc.
  duration: string;
  description: string;
  prepCards: PrepCard[];
  tips: string[];
}

export interface InterviewGuide {
  // Role detection (new format)
  detectedRoleType?: string;  // "sales", "engineering", "product", "marketing", "operations", "executive", "other"
  processExplanation?: string;  // Why these stages were suggested

  // Company research
  companyResearch: {
    overview: string;
    recentNews: string[];
    culture: string;
    competitors: string[];
  };

  // Flexible interview stages (new format)
  suggestedStages?: InterviewStagePrep[];

  // Legacy: Fixed interview rounds (old format - for backward compatibility)
  interviewRounds?: InterviewRound[];

  // Questions to ask, organized by when to ask them
  questionsToAsk: {
    category: string;
    questions: string[];
    bestAskedDuring?: string;  // Which stage to ask these (new format)
  }[];

  // General tips
  generalTips: string[];
}

// Legacy support - keep old interface for backward compatibility
export interface InterviewRound {
  round: number;
  type: "phone_screen" | "technical" | "behavioral" | "hiring_manager" | "final";
  typicalDuration: string;
  likelyQuestions: string[];
  starAnswers: {
    question: string;
    situation: string;
    task: string;
    action: string;
    result: string;
  }[];
  tips: string[];
}

export type StageType =
  | "phone_screen"
  | "technical"
  | "behavioral"
  | "hiring_manager"
  | "final"
  | "onsite"
  | "panel"
  | "take_home"
  | "other";
export type StageStatus = "pending" | "scheduled" | "completed" | "rejected" | "cancelled";
export type StageSource = "email" | "calendar" | "manual" | "migrated";

export interface InterviewStage {
  id: number;
  job_id: number;
  stage_number: number;
  stage_type: StageType;
  stage_name: string | null;
  status: StageStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  notes: string | null;
  source: StageSource | null;
  source_email_id: string | null;
  created_at: string;
  updated_at: string;
}

export type EmailType =
  | "confirmation"
  | "interview_invite"
  | "rejection"
  | "offer"
  | "follow_up"
  | "thank_you"
  | "reschedule"
  | "other";
export type EmailDirection = "inbound" | "outbound";
export type EmailStatus = "pending" | "draft" | "sent" | "detected";

export interface EmailAction {
  id: number;
  job_id: number;
  stage_id: number | null;
  email_type: EmailType;
  direction: EmailDirection;
  subject: string | null;
  body: string | null;
  recipient_email: string | null;
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  status: EmailStatus;
  sent_at: string | null;
  detected_at: string | null;
  created_at: string;
}

export type CalendarSyncStatus = "local" | "synced" | "conflict" | "deleted";

export interface CalendarEvent {
  id: number;
  job_id: number;
  stage_id: number | null;
  google_event_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_link: string | null;
  sync_status: CalendarSyncStatus;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: number;
  user_id: number;
  weekly_jobs_goal: number;
  weekly_reviews_goal: number;
  weekly_applications_goal: number;
  show_welcome_card: number;
  created_at: string;
  updated_at: string;
}
