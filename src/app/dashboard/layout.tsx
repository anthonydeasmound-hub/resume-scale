import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - ResumeGenie",
  description: "Your job application dashboard. Track applications, manage resumes, and prepare for interviews.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
