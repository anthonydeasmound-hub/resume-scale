import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Resume - ResumeGenie",
  description: "Build and manage your master resume with AI-powered bullet points and formatting.",
};

export default function MasterResumeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
