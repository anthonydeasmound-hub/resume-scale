export type JobStatus =
  | "draft"
  | "review"
  | "applied"
  | "interview"
  | "rejected"
  | "offer"
  | "bookmarked"
  | "applying"
  | "interviewing"
  | "negotiating"
  | "accepted";

export interface Job {
  id: number;
  company_name: string;
  job_title: string;
  job_description: string;
  tailored_resume: string | null;
  cover_letter: string | null;
  resume_style: string;
  resume_color: string;
  status: JobStatus;
  reviewed: boolean;
  created_at: string;
  date_applied: string | null;
  job_details_parsed: string | null;
  source_profile_id: number | null;
  job_url: string | null;
  excitement_level: number | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_title: string | null;
  interview_guide: string | null;
}

export interface JobDetailsParsed {
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  salary_range: string | null;
  location: string | null;
  work_type: string | null;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduation_date: string;
}

export interface MasterResume {
  contact_info: ContactInfo;
  work_experience: WorkExperience[];
  skills: string[];
  education: Education[];
  accent_color?: string;
}

export interface TailoredResume {
  contact_info: ContactInfo;
  summary: string;
  work_experience: WorkExperience[];
  skills: string[];
  education: Education[];
}

export interface SelectedRole {
  roleIndex: number;
  selectedBullets: number[];
  masterBullets: string[];
  aiBullets: string[];
  bulletOptions: string[];
  loadingBullets: boolean;
  customTitle?: string; // Optimized job title for ATS matching
}

export interface ResumeReviewResult {
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
