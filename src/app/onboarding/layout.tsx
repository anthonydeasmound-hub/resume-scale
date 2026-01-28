import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started - ResumeGenie",
  description: "Set up your ResumeGenie profile by uploading or building your master resume.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
