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
  job_details_parsed: string | null; // JSON with requirements, responsibilities, qualifications, etc.
  created_at: string;
  updated_at: string;
}
