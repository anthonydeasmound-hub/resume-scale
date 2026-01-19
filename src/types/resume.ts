export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
}

export interface Experience {
  title: string;
  company: string;
  dates: string;
  description: string | string[];
}

export interface Education {
  school: string;
  degree: string;
  dates?: string;
  specialty?: string;
}

export interface Reference {
  name: string;
  title: string;
  phone: string;
  email: string;
}

export interface ResumeData {
  contactInfo: ContactInfo;
  jobTitle: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills?: string[];
  references?: Reference[];
}

export interface CoverLetterData {
  contactInfo: ContactInfo;
  companyName: string;
  jobTitle: string;
  opening: string;
  body: string;
  closing: string;
}

export type TemplateName = 'professional' | 'basic';
