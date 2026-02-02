-- Migration: Add job_contacts table for tracking multiple contacts per job
-- Run this migration to add contact tracking functionality

CREATE TABLE IF NOT EXISTS job_contacts (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  title TEXT,
  phone TEXT,
  linkedin TEXT,
  company TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  source TEXT, -- 'manual', 'linkedin', 'email_detected', 'job_posting'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient lookup by job
CREATE INDEX IF NOT EXISTS idx_job_contacts_job_id ON job_contacts(job_id);

-- Ensure only one primary contact per job
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_contacts_primary ON job_contacts (job_id) WHERE is_primary = TRUE;
