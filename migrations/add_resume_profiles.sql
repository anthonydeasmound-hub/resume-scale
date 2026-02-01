-- Migration: Add multi-resume profiles support
-- Run this on existing databases to add profile support

-- Add new columns to resumes table
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS profile_name TEXT NOT NULL DEFAULT 'Master Resume';
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS profile_description TEXT;

-- Ensure only one primary profile per user (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_resumes_user_primary ON resumes (user_id) WHERE is_primary = TRUE;

-- Prevent duplicate profile names per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_profile_name'
  ) THEN
    ALTER TABLE resumes ADD CONSTRAINT unique_user_profile_name UNIQUE (user_id, profile_name);
  END IF;
END $$;

-- Add source_profile_id to job_applications table
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS source_profile_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL;

-- Create index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_resumes_user_profile ON resumes(user_id, is_primary);
