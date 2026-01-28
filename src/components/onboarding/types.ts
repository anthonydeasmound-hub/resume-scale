export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface Honor {
  title: string;
  issuer: string;
  date: string;
}

export interface LinkedInData {
  contact_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  work_experience: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduation_date: string;
  }>;
  skills: string[];
  certifications: Certification[];
  languages: string[];
  honors: Honor[];
  profile_picture_url?: string;
}

export type Step = "entry" | "upload" | "connect" | "import" | "template" | "contact" | "work-experience" | "achievements" | "skills" | "education" | "certifications" | "languages" | "honors" | "summary" | "saving" | "complete";

export type EntryPath = "upload" | "linkedin" | "fresh" | null;

export interface Template {
  id: string;
  name: string;
  category: "professional" | "modern" | "creative" | "technical" | "executive";
  description: string;
  layout: "single" | "two-column-left" | "two-column-right";
}

export const TEMPLATES: Template[] = [
  { id: "executive", name: "Executive", category: "professional", description: "Traditional corporate style", layout: "single" },
  { id: "horizon", name: "Horizon", category: "modern", description: "Clean, contemporary design", layout: "two-column-left" },
  { id: "canvas", name: "Canvas", category: "creative", description: "Bold and artistic", layout: "two-column-right" },
  { id: "terminal", name: "Terminal", category: "technical", description: "Developer-focused minimal", layout: "single" },
  { id: "summit", name: "Summit", category: "executive", description: "C-suite elegance", layout: "single" },
  { id: "cornerstone", name: "Cornerstone", category: "professional", description: "Balanced two-column", layout: "two-column-left" },
];

export const COLORS = [
  { id: "blue", hex: "#2563eb", name: "Blue" },
  { id: "emerald", hex: "#059669", name: "Emerald" },
  { id: "violet", hex: "#7c3aed", name: "Violet" },
  { id: "rose", hex: "#e11d48", name: "Rose" },
  { id: "slate", hex: "#475569", name: "Slate" },
];

export interface SkillSuggestions {
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
}
