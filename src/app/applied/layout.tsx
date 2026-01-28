import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Applied Jobs - ResumeGenie",
  description: "Track your job applications, interview stages, and recruiter contacts.",
};

export default function AppliedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
