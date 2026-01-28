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

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
}

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

export interface ResumeData {
  contact_info: ContactInfo;
  work_experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  languages: string[];
  honors: Honor[];
  profile_photo_path: string | null;
  summary: string;
  resume_style: string;
  accent_color: string;
}
