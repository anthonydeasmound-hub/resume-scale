-- Add fields for improved job header display
-- job_url: The source URL where the job posting was found
-- excitement_level: 1-5 star rating for user's excitement about the job

ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS job_url TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS excitement_level INTEGER CHECK (excitement_level >= 1 AND excitement_level <= 5);
