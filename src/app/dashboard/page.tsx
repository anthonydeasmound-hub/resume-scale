"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import TabsNav from "@/components/TabsNav";

interface Stats {
  resumes_created: number;
  cover_letters_created: number;
  jobs_applied: number;
  rejections: number;
  interviews: number;
  offers: number;
  review_count: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Job form state
  const [jobDescription, setJobDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Email check state
  const [checkingEmails, setCheckingEmails] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState<{ company: string; type: string; summary: string }[]>([]);
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkEmails = async () => {
    setCheckingEmails(true);
    setEmailUpdates([]);
    setEmailMessage("");

    try {
      const response = await fetch("/api/gmail/check", { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        setEmailMessage(data.message);
        setEmailUpdates(data.updates || []);
        if (data.updates?.length > 0) {
          fetchStats(); // Refresh stats if there were updates
        }
      } else {
        setEmailMessage(data.error || "Failed to check emails");
      }
    } catch (err) {
      setEmailMessage("Failed to check emails");
      console.error(err);
    } finally {
      setCheckingEmails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError("Please paste a job description");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription }),
      });

      if (!response.ok) throw new Error("Failed to create job");

      const data = await response.json();
      // Redirect to review page for this job
      router.push(`/review?job=${data.job_id}`);
    } catch (err) {
      setError("Failed to create job application");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const statCards = [
    { label: "Resumes Created", value: stats?.resumes_created || 0, color: "bg-blue-500" },
    { label: "Cover Letters", value: stats?.cover_letters_created || 0, color: "bg-indigo-500" },
    { label: "Jobs Applied", value: stats?.jobs_applied || 0, color: "bg-green-500" },
    { label: "Interviews", value: stats?.interviews || 0, color: "bg-yellow-500" },
    { label: "Rejections", value: stats?.rejections || 0, color: "bg-red-500" },
    { label: "Offers", value: stats?.offers || 0, color: "bg-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TabsNav reviewCount={stats?.review_count || 0} />

      <div className="ml-64 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow p-4">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white font-bold text-lg mb-2`}>
                {stat.value}
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Gmail Check Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Email Updates</h2>
              <p className="text-gray-600 text-sm">Check Gmail for application status updates</p>
            </div>
            <button
              onClick={checkEmails}
              disabled={checkingEmails}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {checkingEmails ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Checking...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Check Emails
                </>
              )}
            </button>
          </div>

          {emailMessage && (
            <p className="text-sm text-gray-600 mb-3">{emailMessage}</p>
          )}

          {emailUpdates.length > 0 && (
            <div className="space-y-2">
              {emailUpdates.map((update, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${
                    update.type === "rejection"
                      ? "bg-red-50 text-red-700"
                      : update.type === "interview"
                      ? "bg-yellow-50 text-yellow-700"
                      : update.type === "offer"
                      ? "bg-green-50 text-green-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <span className="font-medium">{update.company}</span>: {update.summary}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Job Application Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            New Job Application
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Paste a job description and we&apos;ll automatically extract the company and position, then generate a tailored resume and cover letter.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
                placeholder="Paste the full job description here..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Analyzing..." : "Generate Resume & Cover Letter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
