"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TabsNav from "@/components/TabsNav";

const tools = [
  {
    name: "Master Resume",
    description: "Build and manage your master resume",
    href: "/master-resume",
    icon: (
      <svg
        className="w-10 h-10 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    name: "Review Resumes",
    description: "Review AI-tailored resumes",
    href: "/review",
    icon: (
      <svg
        className="w-10 h-10 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
  {
    name: "Job Tracker",
    description: "Track your job applications",
    href: "/applied",
    icon: (
      <svg
        className="w-10 h-10 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    name: "ATS Analysis",
    description: "Score your resume against job descriptions",
    href: "/review",
    icon: (
      <svg
        className="w-10 h-10 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    name: "Interview Guide",
    description: "AI-generated interview prep",
    href: "/applied",
    icon: (
      <svg
        className="w-10 h-10 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    name: "Chrome Extension",
    description: "Save jobs from any job board",
    href: "/extension",
    icon: (
      <svg
        className="w-10 h-10 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    ),
  },
];

const resources = [
  { name: "Help Center", href: "#" },
  { name: "Career Tips", href: "#" },
  { name: "Resume Examples", href: "#" },
  { name: "FAQ", href: "#" },
];

export default function ToolsPage() {
  const { data: session, status } = useSession();
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    document.title = "ResumeGenie - All Tools";
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setReviewCount(data.review_count || 0);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session, fetchStats]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <TabsNav reviewCount={reviewCount} />

      <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Tools</h1>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href}
              className="group flex flex-col items-center text-center border border-gray-200 rounded-xl bg-white p-6 hover:border-brand-blue hover:shadow-md transition-all"
            >
              <div className="mb-3 group-hover:text-brand-blue transition-colors">
                {tool.icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-blue transition-colors">
                {tool.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{tool.description}</p>
            </Link>
          ))}
        </div>

        {/* Resources Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Resources
          </h2>
          <div className="space-y-2">
            {resources.map((resource) => (
              <a
                key={resource.name}
                href={resource.href}
                className="flex items-center gap-3 text-brand-blue hover:text-brand-blue-dark font-medium text-sm transition-colors py-1.5"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                {resource.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
