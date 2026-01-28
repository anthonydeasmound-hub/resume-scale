-- PostgreSQL schema for ResumeGenie (Neon)
-- Run this once to create all tables in your Neon database.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  contact_info TEXT,
  work_experience TEXT,
  skills TEXT,
  education TEXT,
  certifications TEXT,
  languages TEXT,
  honors TEXT,
  profile_photo_path TEXT,
  summary TEXT,
  resume_style TEXT DEFAULT 'basic',
  accent_color TEXT,
  raw_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  tailored_resume TEXT,
  cover_letter TEXT,
  resume_style TEXT DEFAULT 'basic',
  resume_color TEXT DEFAULT '#2563eb',
  status TEXT DEFAULT 'draft',
  reviewed INTEGER DEFAULT 0,
  date_applied TEXT,
  job_details_parsed TEXT,
  recruiter_name TEXT,
  recruiter_email TEXT,
  recruiter_title TEXT,
  recruiter_source TEXT,
  interview_guide TEXT,
  interview_guide_generated_at TEXT,
  job_analysis TEXT,
  archived_at TEXT,
  pinned INTEGER DEFAULT 0,
  last_activity_at TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_notes (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bullet_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role_title TEXT NOT NULL,
  company TEXT,
  bullet_text TEXT NOT NULL,
  feedback TEXT NOT NULL,
  was_user_written INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_stages (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  stage_type TEXT NOT NULL,
  stage_name TEXT,
  status TEXT DEFAULT 'pending',
  scheduled_at TEXT,
  completed_at TEXT,
  notes TEXT,
  source TEXT,
  source_email_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_actions (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  stage_id INTEGER REFERENCES interview_stages(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  recipient_email TEXT,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TEXT,
  detected_at TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  stage_id INTEGER REFERENCES interview_stages(id) ON DELETE SET NULL,
  google_event_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT,
  meeting_link TEXT,
  sync_status TEXT DEFAULT 'local',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS extension_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance (foreign keys and frequently filtered columns)
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_notes_job_id ON job_notes(job_id);
CREATE INDEX IF NOT EXISTS idx_bullet_feedback_user_id ON bullet_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_stages_job_id ON interview_stages(job_id);
CREATE INDEX IF NOT EXISTS idx_email_actions_job_id ON email_actions(job_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_job_id ON calendar_events(job_id);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_user_id ON extension_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_token ON extension_tokens(token);
