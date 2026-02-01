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
  // Canva templates - 12 designs
  { id: "navy-header", name: "Navy Header", category: "professional", description: "Navy header with centered photo", layout: "single" },
  { id: "blush-sidebar", name: "Blush Sidebar", category: "creative", description: "Elegant script headings", layout: "two-column-left" },
  { id: "navy-initials", name: "Navy Initials", category: "professional", description: "Bold sidebar with initials", layout: "two-column-left" },
  { id: "teal-header-split", name: "Teal Split", category: "modern", description: "Modern header design", layout: "single" },
  { id: "coral-sidebar", name: "Coral Sidebar", category: "creative", description: "Warm coral accents", layout: "two-column-left" },
  { id: "lavender-right", name: "Lavender Right", category: "creative", description: "Elegant right sidebar", layout: "two-column-right" },
  { id: "teal-contact", name: "Teal Contact", category: "professional", description: "Prominent contact icons", layout: "two-column-left" },
  { id: "dusty-blue", name: "Dusty Blue", category: "professional", description: "Soft blue accents", layout: "two-column-left" },
  { id: "minimalist-bars", name: "Minimalist Bars", category: "modern", description: "Clean section blocks", layout: "single" },
  { id: "clean-dividers", name: "Clean Dividers", category: "professional", description: "Thin line dividers", layout: "single" },
  { id: "block-accent", name: "Block Accent", category: "modern", description: "Colored accent blocks", layout: "two-column-left" },
  { id: "minimal-photo", name: "Minimal Photo", category: "modern", description: "Clean minimal with photo", layout: "single" },
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
