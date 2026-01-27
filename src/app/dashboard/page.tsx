"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TabsNav from "@/components/TabsNav";

interface SetupStatus {
  hasResume: boolean;
  hasExtension: boolean;
  hasFirstJob: boolean;
  completedCount: number;
  totalTasks: number;
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
}

interface WorkExperience {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string[];
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  graduation_date: string;
}

interface ResumeData {
  contact_info: ContactInfo;
  work_experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: { name: string; issuer: string; date: string }[];
  languages: string[];
  honors: { title: string; issuer: string; date: string }[];
}

interface Job {
  id: number;
  company_name: string;
  job_title: string;
  tailored_resume: string | null;
  reviewed: number;
  status: string;
  interview_1: string | null;
  interview_2: string | null;
  interview_3: string | null;
  interview_4: string | null;
  interview_5: string | null;
  created_at: string;
}

interface EmailUpdate {
  company: string;
  type: string;
  summary: string;
}

interface Stats {
  review_count: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Post-setup state
  const [unreviewedJobs, setUnreviewedJobs] = useState<Job[]>([]);
  const [emailUpdates, setEmailUpdates] = useState<EmailUpdate[]>([]);
  const [emailMessage, setEmailMessage] = useState("");
  const [checkingEmails, setCheckingEmails] = useState(false);
  const [weekInterviews, setWeekInterviews] = useState<{ job: Job; stage: string; date: Date }[]>([]);

  // Getting Started - inline job form
  const [jobDescription, setJobDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [jobError, setJobError] = useState("");

  const accentColor = "#3D5A80";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const fetchSetupStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/setup-status");
      if (res.ok) {
        const data = await res.json();
        setSetupStatus(data);
        return data as SetupStatus;
      }
    } catch (err) {
      console.error("Failed to fetch setup status:", err);
    }
    return null;
  }, []);

  const fetchResumePreview = useCallback(async () => {
    try {
      const res = await fetch("/api/resume/master");
      if (res.ok) {
        const data = await res.json();
        setResumeData({
          contact_info: data.contact_info || { name: "", email: "", phone: "", location: "", linkedin: "" },
          work_experience: data.work_experience || [],
          education: data.education || [],
          skills: data.skills || [],
          certifications: data.certifications || [],
          languages: data.languages || [],
          honors: data.honors || [],
        });
        setHasResume(true);
      } else if (res.status === 404) {
        setHasResume(false);
      }
    } catch (err) {
      console.error("Failed to fetch resume:", err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchUnreviewedJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const jobs: Job[] = await res.json();
        setUnreviewedJobs(jobs.filter((j) => j.reviewed === 0 && j.tailored_resume != null));

        // Extract interviews scheduled this week
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const interviews: { job: Job; stage: string; date: Date }[] = [];
        for (const job of jobs) {
          const stages = [
            { key: "interview_1", label: "Phone Screen" },
            { key: "interview_2", label: "Technical" },
            { key: "interview_3", label: "Behavioral" },
            { key: "interview_4", label: "Hiring Manager" },
            { key: "interview_5", label: "Final Round" },
          ];
          for (const stage of stages) {
            const raw = job[stage.key as keyof Job] as string | null;
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (parsed.status === "scheduled" && parsed.scheduled_at) {
                  const d = new Date(parsed.scheduled_at);
                  if (d >= weekStart && d < weekEnd) {
                    interviews.push({ job, stage: stage.label, date: d });
                  }
                }
              } catch {
                // not JSON, skip
              }
            }
          }
        }
        interviews.sort((a, b) => a.date.getTime() - b.date.getTime());
        setWeekInterviews(interviews);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  }, []);

  const autoCheckEmails = useCallback(async () => {
    setCheckingEmails(true);
    setEmailUpdates([]);
    setEmailMessage("");
    try {
      const res = await fetch("/api/gmail/check", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEmailMessage(data.message);
        setEmailUpdates(data.updates || []);
        if (data.updates?.length > 0) {
          fetchStats();
        }
      } else {
        setEmailMessage(data.error || "Failed to check emails");
      }
    } catch (err) {
      console.error("Failed to check emails:", err);
      setEmailMessage("Failed to check emails");
    } finally {
      setCheckingEmails(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    if (session) {
      Promise.all([fetchSetupStatus(), fetchResumePreview(), fetchStats()]).then(
        ([setupData]) => {
          setLoading(false);
          if (setupData && setupData.completedCount >= setupData.totalTasks) {
            fetchUnreviewedJobs();
            autoCheckEmails();
          }
        }
      );
    }
  }, [session, fetchSetupStatus, fetchResumePreview, fetchStats, fetchUnreviewedJobs, autoCheckEmails]);

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setJobError("Please paste a job description");
      return;
    }
    setSubmitting(true);
    setJobError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_description: jobDescription }),
      });
      if (!res.ok) throw new Error("Failed to create job");
      const data = await res.json();
      router.push(`/review?job=${data.job_id}`);
    } catch {
      setJobError("Failed to create job application");
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

  const setupComplete = setupStatus && setupStatus.completedCount >= setupStatus.totalTasks;
  const pct = setupStatus ? Math.round((setupStatus.completedCount / setupStatus.totalTasks) * 100) : 0;

  // Week calendar helpers
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <TabsNav reviewCount={stats?.review_count || 0} />

      <div className="ml-16 p-8">
        <div className="flex gap-8">
          {/* Left Column - Resume Preview */}
          <div className="w-[400px] shrink-0">
            {hasResume && resumeData ? (
              <div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Master Resume</span>
                    <Link href="/master-resume" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Edit Resume
                    </Link>
                  </div>
                  <div className="overflow-hidden" style={{ maxHeight: "calc(100vh - 140px)" }}>
                    <div
                      className="text-xs"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        transform: "scale(0.48)",
                        transformOrigin: "top left",
                        width: "208.33%",
                      }}
                    >
                      <div style={{ padding: "24px 28px", minHeight: "715px", display: "flex", flexDirection: "column" }}>
                        {/* Header */}
                        <div className="text-center" style={{ marginBottom: "6px" }}>
                          <div style={{ fontSize: "18pt", fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                            {resumeData.contact_info.name}
                          </div>
                          <div style={{ fontSize: "7.5pt", color: "#333", marginTop: "4px" }}>
                            {[resumeData.contact_info.location, resumeData.contact_info.phone, resumeData.contact_info.email].filter(Boolean).join(" \u2022 ")}
                          </div>
                          {resumeData.contact_info.linkedin && (
                            <div style={{ fontSize: "7.5pt", color: "#333" }}>{resumeData.contact_info.linkedin}</div>
                          )}
                        </div>

                        {/* Work Experience */}
                        <div style={{ flex: 1 }}>
                          {resumeData.work_experience.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <h3 style={{ fontSize: "9pt", fontWeight: 700, color: accentColor, textTransform: "uppercase", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px" }}>
                                Work Experience
                              </h3>
                              {resumeData.work_experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: "10px" }}>
                                  <div className="flex justify-between" style={{ marginBottom: "2px" }}>
                                    <span style={{ fontSize: "7.5pt", fontWeight: 600, color: "#1a1a1a" }}>
                                      {exp.title}, {exp.company}
                                    </span>
                                    <span style={{ fontSize: "7.5pt", color: "#333" }}>
                                      {exp.start_date} - {exp.end_date}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "7.5pt", color: "#333" }}>
                                    {exp.description.map((d, j) => (
                                      <p key={j} style={{ paddingLeft: "10px", position: "relative", marginBottom: "1px" }}>
                                        <span style={{ position: "absolute", left: 0 }}>&bull;</span> {d}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer - Skills and Education */}
                        <div style={{ marginTop: "auto" }}>
                          {resumeData.skills.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <h3 style={{ fontSize: "9pt", fontWeight: 700, color: accentColor, textTransform: "uppercase", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px" }}>
                                Skills
                              </h3>
                              <p style={{ fontSize: "7.5pt", color: "#333" }}>{resumeData.skills.join(" | ")}</p>
                            </div>
                          )}

                          {resumeData.education.length > 0 && (
                            <div>
                              <h3 style={{ fontSize: "9pt", fontWeight: 700, color: accentColor, textTransform: "uppercase", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px" }}>
                                Education
                              </h3>
                              {resumeData.education.map((edu, i) => (
                                <div key={i} style={{ marginBottom: "6px" }}>
                                  <div style={{ fontSize: "7.5pt", fontWeight: 600, color: "#1a1a1a" }}>{edu.degree}</div>
                                  <div style={{ fontSize: "7.5pt", color: "#333" }}>{edu.institution}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume Yet</h3>
                <p className="text-gray-500 text-sm mb-4">Build your master resume to get started.</p>
                <Link
                  href="/onboarding"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Build Resume
                </Link>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="flex-1 min-w-0">
            {!setupComplete ? (
              /* Getting Started Checklist */
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Getting Started</h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-medium text-blue-600">{pct}% Complete</span>
                  <span className="text-sm text-gray-500">{setupStatus?.completedCount || 0} of {setupStatus?.totalTasks || 3} Tasks</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Task List */}
                <div className="space-y-4">
                  {/* Task 1: Build Resume */}
                  <div className="flex items-start gap-3">
                    {setupStatus?.hasResume ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${setupStatus?.hasResume ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        Build your Resume
                      </p>
                      {!setupStatus?.hasResume && (
                        <Link href="/onboarding" className="text-sm text-blue-600 hover:text-blue-700">
                          Go to onboarding &rarr;
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Task 2: Chrome Extension */}
                  <div className="flex items-start gap-3">
                    {setupStatus?.hasExtension ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${setupStatus?.hasExtension ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        Download Chrome Extension
                      </p>
                      {!setupStatus?.hasExtension && (
                        <p className="text-sm text-gray-500">
                          Install the extension to quickly save jobs from any job board.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Task 3: Tailor to a Job */}
                  <div className="flex items-start gap-3">
                    {setupStatus?.hasFirstJob ? (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${setupStatus?.hasFirstJob ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        Tailor to a Job
                      </p>
                      {!setupStatus?.hasFirstJob && (
                        <form onSubmit={handleJobSubmit} className="mt-2 space-y-3">
                          {jobError && (
                            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                              {jobError}
                            </div>
                          )}
                          <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm text-gray-900"
                            placeholder="Paste a job description here..."
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {submitting ? "Analyzing..." : "Generate Tailored Resume"}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Post-Setup Content */
              <div className="space-y-6">
                {/* Resumes to Review */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumes to Review</h2>
                  {unreviewedJobs.length > 0 ? (
                    <div className="space-y-2">
                      {unreviewedJobs.map((job) => (
                        <Link
                          key={job.id}
                          href={`/review?job=${job.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-blue-600">{job.job_title}</p>
                            <p className="text-sm text-gray-500">{job.company_name}</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">All caught up!</p>
                  )}
                </div>

                {/* Email Alerts */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Alerts</h2>
                  {checkingEmails ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                      Checking emails...
                    </div>
                  ) : emailUpdates.length > 0 ? (
                    <div className="space-y-2">
                      {emailMessage && (
                        <p className="text-sm text-gray-600 mb-2">{emailMessage}</p>
                      )}
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
                  ) : (
                    <p className="text-sm text-gray-500">
                      {emailMessage || "No new alerts"}
                    </p>
                  )}
                </div>

                {/* Weekly Calendar */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week</h2>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day, i) => {
                      const date = new Date(weekStart);
                      date.setDate(weekStart.getDate() + i);
                      const isToday = date.toDateString() === now.toDateString();
                      const dayInterviews = weekInterviews.filter(
                        (iv) => iv.date.toDateString() === date.toDateString()
                      );
                      return (
                        <div
                          key={day}
                          className={`text-center p-2 rounded-lg ${isToday ? "bg-blue-50 ring-1 ring-blue-200" : ""}`}
                        >
                          <div className="text-xs font-medium text-gray-500">{day}</div>
                          <div className={`text-sm font-semibold ${isToday ? "text-blue-700" : "text-gray-900"}`}>
                            {date.getDate()}
                          </div>
                          {dayInterviews.map((iv, j) => (
                            <button
                              key={j}
                              onClick={() => router.push(`/applied`)}
                              className="mt-1 w-full text-[10px] bg-blue-100 text-blue-700 rounded px-1 py-0.5 truncate hover:bg-blue-200 transition-colors"
                              title={`${iv.stage} - ${iv.job.company_name}`}
                            >
                              {iv.stage}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  {weekInterviews.length === 0 && (
                    <p className="text-sm text-gray-500 mt-3">No interviews scheduled this week.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
