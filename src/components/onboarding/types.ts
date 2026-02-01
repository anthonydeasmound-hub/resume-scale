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
  // Original templates
  { id: "executive", name: "Executive", category: "professional", description: "Traditional corporate style", layout: "single" },
  { id: "horizon", name: "Horizon", category: "modern", description: "Clean, contemporary design", layout: "two-column-left" },
  { id: "canvas", name: "Canvas", category: "creative", description: "Bold and artistic", layout: "two-column-right" },
  { id: "terminal", name: "Terminal", category: "technical", description: "Developer-focused minimal", layout: "single" },
  { id: "summit", name: "Summit", category: "executive", description: "C-suite elegance", layout: "single" },
  { id: "cornerstone", name: "Cornerstone", category: "professional", description: "Balanced two-column", layout: "two-column-left" },

  // Two-column left with photo
  { id: "navy-curve", name: "Navy Curve", category: "professional", description: "Curved navy header with photo", layout: "two-column-left" },
  { id: "warm-copper", name: "Warm Copper", category: "creative", description: "Warm copper accents with photo", layout: "two-column-left" },
  { id: "sage-blocks", name: "Sage Blocks", category: "modern", description: "Decorative block accents", layout: "two-column-left" },
  { id: "burgundy-classic", name: "Burgundy Classic", category: "executive", description: "Elegant serif with burgundy", layout: "two-column-left" },
  { id: "forest-green", name: "Forest Green", category: "professional", description: "Nature-inspired green sidebar", layout: "two-column-left" },
  { id: "ocean-blue", name: "Ocean Blue", category: "modern", description: "Wave-inspired blue design", layout: "two-column-left" },
  { id: "metro-split", name: "Metro Split", category: "modern", description: "Metro-style colored header", layout: "two-column-left" },
  { id: "divide-column", name: "Divide Column", category: "professional", description: "Clean vertical divider", layout: "two-column-left" },
  { id: "column-focus", name: "Column Focus", category: "modern", description: "Focus-driven sidebar design", layout: "two-column-left" },

  // Two-column right with photo
  { id: "slate-right", name: "Slate Right", category: "professional", description: "Slate sidebar on right", layout: "two-column-right" },
  { id: "charcoal-modern", name: "Charcoal Modern", category: "modern", description: "Dark charcoal sidebar", layout: "two-column-right" },
  { id: "plum-elegant", name: "Plum Elegant", category: "executive", description: "Elegant plum accents", layout: "two-column-right" },
  { id: "coral-fresh", name: "Coral Fresh", category: "creative", description: "Fresh coral color scheme", layout: "two-column-right" },
  { id: "panel-grid", name: "Panel Grid", category: "modern", description: "Card-based panel layout", layout: "two-column-right" },
  { id: "grid-modern", name: "Grid Modern", category: "modern", description: "Modern grid with dark sidebar", layout: "two-column-right" },

  // Single column with photo
  { id: "corporate-clean", name: "Corporate Clean", category: "professional", description: "Clean corporate with photo", layout: "single" },
  { id: "classic-photo", name: "Classic Photo", category: "professional", description: "Classic layout with header photo", layout: "single" },
  { id: "bold-header", name: "Bold Header", category: "creative", description: "Bold colored header band", layout: "single" },

  // Single column without photo
  { id: "minimal-tech", name: "Minimal Tech", category: "technical", description: "Ultra-minimal tech style", layout: "single" },
  { id: "modern-minimal", name: "Modern Minimal", category: "modern", description: "Clean minimalist design", layout: "single" },
  { id: "executive-modern", name: "Executive Modern", category: "executive", description: "Modern executive centered", layout: "single" },
  { id: "ats-classic", name: "ATS Classic", category: "professional", description: "ATS-optimized classic", layout: "single" },
  { id: "clean-lines", name: "Clean Lines", category: "professional", description: "Elegant line dividers", layout: "single" },
  { id: "accent-sidebar", name: "Accent Sidebar", category: "modern", description: "Thin accent bar design", layout: "single" },
  { id: "simple-professional", name: "Simple Professional", category: "professional", description: "Simple and professional", layout: "single" },
  { id: "bold-centered", name: "Bold Centered", category: "creative", description: "Bold centered header", layout: "single" },
  { id: "minimalist-one", name: "Minimalist One", category: "modern", description: "Ultra-minimalist single page", layout: "single" },
  { id: "swiss-design", name: "Swiss Design", category: "modern", description: "Swiss typography layout", layout: "single" },
  { id: "professional-serif", name: "Professional Serif", category: "professional", description: "Traditional serif style", layout: "single" },
  { id: "two-tone", name: "Two Tone", category: "modern", description: "Two-tone header design", layout: "single" },
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
