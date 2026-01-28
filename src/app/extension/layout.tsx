import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chrome Extension - ResumeGenie",
  description: "Install the ResumeGenie Chrome extension to save jobs from any job board with one click.",
};

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
