import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Resumes - ResumeGenie",
  description: "Review and approve AI-tailored resumes and cover letters for your job applications.",
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
