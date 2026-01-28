import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Tools - ResumeGenie",
  description: "Access all ResumeGenie tools: resume builder, job tracker, interview prep, and more.",
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
