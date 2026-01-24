import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "resumescale.db");

// Ensure data directory exists
import fs from "fs";
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_info TEXT,
    work_experience TEXT,
    skills TEXT,
    education TEXT,
    certifications TEXT,
    languages TEXT,
    honors TEXT,
    profile_photo_path TEXT,
    raw_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS job_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    job_description TEXT,
    tailored_resume TEXT,
    cover_letter TEXT,
    resume_style TEXT DEFAULT 'classic',
    resume_color TEXT DEFAULT '#000000',
    status TEXT DEFAULT 'draft',
    reviewed INTEGER DEFAULT 0,
    date_applied DATETIME,
    interview_1 TEXT,
    interview_2 TEXT,
    interview_3 TEXT,
    interview_4 TEXT,
    interview_5 TEXT,
    job_details_parsed TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS extension_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS linkedin_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    profile_data TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Add reviewed column if it doesn't exist (for existing databases)
try {
  db.exec(`ALTER TABLE job_applications ADD COLUMN reviewed INTEGER DEFAULT 0`);
} catch {
  // Column already exists
}

// Add new resume columns for existing databases
const newResumeColumns = [
  { name: 'certifications', type: 'TEXT' },
  { name: 'languages', type: 'TEXT' },
  { name: 'honors', type: 'TEXT' },
  { name: 'profile_photo_path', type: 'TEXT' },
];

for (const col of newResumeColumns) {
  try {
    db.exec(`ALTER TABLE resumes ADD COLUMN ${col.name} ${col.type}`);
  } catch {
    // Column already exists
  }
}

// Add job_details_parsed column for existing databases
try {
  db.exec(`ALTER TABLE job_applications ADD COLUMN job_details_parsed TEXT`);
} catch {
  // Column already exists
}

// Add recruiter tracking columns for existing databases
const recruiterColumns = [
  { name: 'recruiter_name', type: 'TEXT' },
  { name: 'recruiter_email', type: 'TEXT' },
  { name: 'recruiter_title', type: 'TEXT' },
  { name: 'recruiter_source', type: 'TEXT' },
];

for (const col of recruiterColumns) {
  try {
    db.exec(`ALTER TABLE job_applications ADD COLUMN ${col.name} ${col.type}`);
  } catch {
    // Column already exists
  }
}

// Add interview guide columns for existing databases
const interviewGuideColumns = [
  { name: 'interview_guide', type: 'TEXT' },
  { name: 'interview_guide_generated_at', type: 'DATETIME' },
];

for (const col of interviewGuideColumns) {
  try {
    db.exec(`ALTER TABLE job_applications ADD COLUMN ${col.name} ${col.type}`);
  } catch {
    // Column already exists
  }
}

// Add archived_at column for auto-archiving rejections
try {
  db.exec(`ALTER TABLE job_applications ADD COLUMN archived_at DATETIME`);
} catch {
  // Column already exists
}

// Create dynamic interview stages table
db.exec(`
  CREATE TABLE IF NOT EXISTS interview_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    stage_number INTEGER NOT NULL,
    stage_type TEXT NOT NULL,
    stage_name TEXT,
    status TEXT DEFAULT 'pending',
    scheduled_at DATETIME,
    completed_at DATETIME,
    notes TEXT,
    source TEXT,
    source_email_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_applications(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_interview_stages_job_id ON interview_stages(job_id);
`);

// Create email actions table for tracking detected emails and drafts
db.exec(`
  CREATE TABLE IF NOT EXISTS email_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    stage_id INTEGER,
    email_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    recipient_email TEXT,
    gmail_message_id TEXT,
    gmail_thread_id TEXT,
    status TEXT DEFAULT 'pending',
    sent_at DATETIME,
    detected_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES interview_stages(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_email_actions_job_id ON email_actions(job_id);
  CREATE INDEX IF NOT EXISTS idx_email_actions_gmail_id ON email_actions(gmail_message_id);
`);

// Create calendar events table for two-way sync
db.exec(`
  CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    stage_id INTEGER,
    google_event_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    location TEXT,
    meeting_link TEXT,
    sync_status TEXT DEFAULT 'local',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES interview_stages(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_calendar_events_job_id ON calendar_events(job_id);
  CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON calendar_events(google_event_id);
`);

// Migrate existing interview_1-5 data to interview_stages table
const migrateExistingInterviews = () => {
  const jobs = db.prepare(`
    SELECT id, interview_1, interview_2, interview_3, interview_4, interview_5
    FROM job_applications
    WHERE (interview_1 IS NOT NULL OR interview_2 IS NOT NULL OR interview_3 IS NOT NULL OR interview_4 IS NOT NULL OR interview_5 IS NOT NULL)
  `).all() as { id: number; interview_1: string | null; interview_2: string | null; interview_3: string | null; interview_4: string | null; interview_5: string | null }[];

  const stageTypes = ['phone_screen', 'technical', 'behavioral', 'hiring_manager', 'final'];
  const stageNames = ['Phone Screen', 'Technical Interview', 'Behavioral Interview', 'Hiring Manager', 'Final Round'];

  const insertStage = db.prepare(`
    INSERT INTO interview_stages (job_id, stage_number, stage_type, stage_name, status, source)
    VALUES (?, ?, ?, ?, ?, 'migrated')
  `);

  const checkExisting = db.prepare(`
    SELECT COUNT(*) as count FROM interview_stages WHERE job_id = ?
  `);

  for (const job of jobs) {
    // Skip if already migrated
    const existing = checkExisting.get(job.id) as { count: number };
    if (existing.count > 0) continue;

    const interviews = [job.interview_1, job.interview_2, job.interview_3, job.interview_4, job.interview_5];

    for (let i = 0; i < interviews.length; i++) {
      const value = interviews[i];
      if (value) {
        // Map old status values to new format
        let status = value;
        if (value === 'completed') status = 'completed';
        else if (value === 'scheduled') status = 'scheduled';
        else if (value === 'rejected') status = 'rejected';
        else status = 'pending';

        insertStage.run(job.id, i + 1, stageTypes[i], stageNames[i], status);
      }
    }
  }
};

// Run migration
try {
  migrateExistingInterviews();
} catch (err) {
  console.error('Interview migration error:', err);
}

export default db;

// Helper types
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
  contact_info: string | null;
  work_experience: string | null;
  skills: string | null;
  education: string | null;
  certifications: string | null;
  languages: string | null;
  honors: string | null;
  profile_photo_path: string | null;
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
  status: "draft" | "review" | "applied" | "interview" | "rejected" | "offer";
  reviewed: number; // 0 = not reviewed, 1 = reviewed
  date_applied: string | null;
  interview_1: string | null;
  interview_2: string | null;
  interview_3: string | null;
  interview_4: string | null;
  interview_5: string | null;
  job_details_parsed: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_title: string | null;
  recruiter_source: 'email' | 'job_description' | 'manual' | null;
  interview_guide: string | null;
  interview_guide_generated_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

// Interview Guide Types
export interface InterviewRound {
  round: number;
  type: 'phone_screen' | 'technical' | 'behavioral' | 'hiring_manager' | 'final';
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

export interface InterviewGuide {
  companyResearch: {
    overview: string;
    recentNews: string[];
    culture: string;
    competitors: string[];
  };
  interviewRounds: InterviewRound[];
  questionsToAsk: { category: string; questions: string[] }[];
  generalTips: string[];
}

// Dynamic Interview Tracking Types
export type StageType = 'phone_screen' | 'technical' | 'behavioral' | 'hiring_manager' | 'final' | 'onsite' | 'panel' | 'take_home' | 'other';
export type StageStatus = 'pending' | 'scheduled' | 'completed' | 'rejected' | 'cancelled';
export type StageSource = 'email' | 'calendar' | 'manual' | 'migrated';

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

export type EmailType = 'confirmation' | 'interview_invite' | 'rejection' | 'offer' | 'follow_up' | 'thank_you' | 'reschedule' | 'other';
export type EmailDirection = 'inbound' | 'outbound';
export type EmailStatus = 'pending' | 'draft' | 'sent' | 'detected';

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

export type CalendarSyncStatus = 'local' | 'synced' | 'conflict' | 'deleted';

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
