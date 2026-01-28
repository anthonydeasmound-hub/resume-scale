"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import TabsNav from "@/components/TabsNav";
import WeekCalendar from "@/components/applied/WeekCalendar";
import JobListRow, { JobAlert, AlertType } from "@/components/applied/JobListRow";

interface InterviewStage {
  id: number;
  job_id: number;
  stage_number: number;
  stage_type: string;
  stage_name: string | null;
  status: string;
  scheduled_at: string | null;
}

interface EmailAction {
  id: number;
  job_id: number;
  email_type: string;
  status: string;
  detected_at: string | null;
}

interface Job {
  id: number;
  company_name: string;
  job_title: string;
  status: string;
  date_applied: string | null;
  pinned: number;
  archived_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  interview_stages?: InterviewStage[];
  email_actions?: EmailAction[];
}

type SortOption = "priority" | "date_newest" | "date_oldest" | "company" | "stage" | "last_activity";

export default function AppliedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    document.title = "ResumeGenie - Applied";
  }, []);

  useEffect(() => {
    if (session) {
      fetchJobs();
      fetchReviewCount();
    }
  }, [session]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs?include=stages,emails");
      if (response.ok) {
        const data = await response.json();
        const appliedJobs = data.filter(
          (j: Job) =>
            j.status === "applied" ||
            j.status === "interview" ||
            j.status === "rejected" ||
            j.status === "offer"
        );
        setJobs(appliedJobs);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewCount = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setReviewCount(data.review_count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch review count:", err);
    }
  };

  const togglePin = async (jobId: number, currentPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: currentPinned ? 0 : 1 }),
      });
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, pinned: currentPinned ? 0 : 1 } : j))
      );
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  // Get alerts for a job
  const getJobAlerts = (job: Job): JobAlert[] => {
    const alerts: JobAlert[] = [];
    const now = new Date();

    // Check for unread emails
    const unreadEmails = job.email_actions?.filter(
      (e) => e.status === "detected" && e.email_type !== "confirmation"
    );
    if (unreadEmails && unreadEmails.length > 0) {
      alerts.push({
        type: "email" as AlertType,
        message: "New email",
        count: unreadEmails.length,
      });
    }

    // Check for upcoming interviews (next 48 hours)
    const upcomingInterview = job.interview_stages?.find((s) => {
      if (s.status === "scheduled" && s.scheduled_at) {
        const scheduled = new Date(s.scheduled_at);
        const diff = scheduled.getTime() - now.getTime();
        return diff > 0 && diff < 48 * 60 * 60 * 1000;
      }
      return false;
    });
    if (upcomingInterview) {
      const scheduledDate = new Date(upcomingInterview.scheduled_at!);
      const isToday = scheduledDate.toDateString() === now.toDateString();
      const isTomorrow = scheduledDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
      alerts.push({
        type: "interview" as AlertType,
        message: isToday ? "Interview today" : isTomorrow ? "Interview tomorrow" : "Interview soon",
      });
    }

    // Check for follow-up needed (no activity in 7+ days for applied status)
    if (job.status === "applied" && job.date_applied) {
      const applied = new Date(job.date_applied);
      const daysSince = Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= 7) {
        alerts.push({
          type: "follow_up" as AlertType,
          message: `No response (${daysSince}d)`,
        });
      }
    }

    // Check for rejection
    if (job.status === "rejected") {
      alerts.push({
        type: "rejection" as AlertType,
        message: "Rejected",
      });
    }

    // Check for offer
    if (job.status === "offer") {
      alerts.push({
        type: "offer" as AlertType,
        message: "Offer received",
      });
    }

    return alerts;
  };

  // Get current interview stage for a job
  const getCurrentStage = (job: Job): number => {
    if (!job.interview_stages || job.interview_stages.length === 0) {
      return job.status === "applied" ? 1 : 0;
    }
    const completedStages = job.interview_stages.filter((s) => s.status === "completed").length;
    return completedStages + 1;
  };

  // Get total stages for a job
  const getTotalStages = (job: Job): number => {
    if (!job.interview_stages || job.interview_stages.length === 0) {
      return 5; // Default
    }
    return Math.max(5, job.interview_stages.length);
  };

  // Calculate priority score for sorting
  const getPriorityScore = (job: Job): number => {
    let score = 0;
    const alerts = getJobAlerts(job);
    const now = new Date();

    // Pinned jobs always first
    if (job.pinned) score += 10000;

    // Offer is highest priority
    if (job.status === "offer") score += 5000;

    // Upcoming interview in next 48 hours
    const hasUpcomingInterview = alerts.some((a) => a.type === "interview");
    if (hasUpcomingInterview) score += 4000;

    // Unread emails (action needed)
    const emailAlert = alerts.find((a) => a.type === "email");
    if (emailAlert) score += 3000 + (emailAlert.count || 1) * 100;

    // Interview stage (further along = higher priority)
    score += getCurrentStage(job) * 100;

    // Waiting for response but not too long
    if (job.status === "applied" && job.date_applied) {
      const applied = new Date(job.date_applied);
      const daysSince = Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince >= 7 && daysSince <= 30) score += 500;
    }

    return score;
  };

  // Get upcoming interviews for calendar
  const upcomingInterviews = useMemo(() => {
    const interviews: {
      id: number;
      jobId: number;
      companyName: string;
      jobTitle: string;
      stageName: string;
      scheduledAt: string;
    }[] = [];

    jobs.forEach((job) => {
      if (job.interview_stages) {
        job.interview_stages.forEach((stage) => {
          if (stage.status === "scheduled" && stage.scheduled_at) {
            interviews.push({
              id: stage.id,
              jobId: job.id,
              companyName: job.company_name,
              jobTitle: job.job_title,
              stageName: stage.stage_name || stage.stage_type,
              scheduledAt: stage.scheduled_at,
            });
          }
        });
      }
    });

    return interviews.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [jobs]);

  // Filter and sort jobs
  const { activeJobs, archivedJobs } = useMemo(() => {
    // Separate archived jobs
    const archived = jobs.filter((j) => j.archived_at || j.status === "rejected");
    const active = jobs.filter((j) => !j.archived_at && j.status !== "rejected");

    // Apply search filter
    const filterBySearch = (list: Job[]) => {
      if (!searchQuery) return list;
      const query = searchQuery.toLowerCase();
      return list.filter(
        (j) =>
          j.company_name.toLowerCase().includes(query) ||
          j.job_title.toLowerCase().includes(query)
      );
    };

    // Apply sorting
    const sortJobs = (list: Job[]) => {
      return [...list].sort((a, b) => {
        switch (sortBy) {
          case "priority":
            return getPriorityScore(b) - getPriorityScore(a);
          case "date_newest":
            return (
              new Date(b.date_applied || b.created_at).getTime() -
              new Date(a.date_applied || a.created_at).getTime()
            );
          case "date_oldest":
            return (
              new Date(a.date_applied || a.created_at).getTime() -
              new Date(b.date_applied || b.created_at).getTime()
            );
          case "company":
            return a.company_name.localeCompare(b.company_name);
          case "stage":
            return getCurrentStage(b) - getCurrentStage(a);
          case "last_activity":
            const aActivity = a.last_activity_at || a.date_applied || a.created_at;
            const bActivity = b.last_activity_at || b.date_applied || b.created_at;
            return new Date(bActivity).getTime() - new Date(aActivity).getTime();
          default:
            return 0;
        }
      });
    };

    return {
      activeJobs: sortJobs(filterBySearch(active)),
      archivedJobs: sortJobs(filterBySearch(archived)),
    };
  }, [jobs, searchQuery, sortBy]);

  const handleJobClick = (jobId: number) => {
    router.push(`/applied/${jobId}`);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <TabsNav reviewCount={reviewCount} />

      <div className="ml-64 p-8">
        {/* Week Calendar */}
        <WeekCalendar
          interviews={upcomingInterviews}
          onInterviewClick={handleJobClick}
        />

        {/* Header with search and sort */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Applications ({activeJobs.length})
          </h1>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="priority">Sort by: Priority</option>
              <option value="date_newest">Date Applied (Newest)</option>
              <option value="date_oldest">Date Applied (Oldest)</option>
              <option value="company">Company (A-Z)</option>
              <option value="stage">Interview Stage</option>
              <option value="last_activity">Last Activity</option>
            </select>
          </div>
        </div>

        {/* Job List */}
        {activeJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
            {jobs.length === 0
              ? "No applied jobs yet. Review and submit applications from the Review tab."
              : "No jobs match your search."}
          </div>
        ) : (
          <div className="space-y-2">
            {activeJobs.map((job) => (
              <JobListRow
                key={job.id}
                id={job.id}
                companyName={job.company_name}
                jobTitle={job.job_title}
                dateApplied={job.date_applied}
                currentStage={getCurrentStage(job)}
                totalStages={getTotalStages(job)}
                pinned={!!job.pinned}
                alerts={getJobAlerts(job)}
                status={job.status}
                onClick={() => handleJobClick(job.id)}
                onPinToggle={(e) => togglePin(job.id, !!job.pinned, e)}
              />
            ))}
          </div>
        )}

        {/* Archived Section */}
        {archivedJobs.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-3"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showArchived ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span>Archived ({archivedJobs.length})</span>
            </button>

            {showArchived && (
              <div className="space-y-2 opacity-60">
                {archivedJobs.map((job) => (
                  <JobListRow
                    key={job.id}
                    id={job.id}
                    companyName={job.company_name}
                    jobTitle={job.job_title}
                    dateApplied={job.date_applied}
                    currentStage={getCurrentStage(job)}
                    totalStages={getTotalStages(job)}
                    pinned={!!job.pinned}
                    alerts={getJobAlerts(job)}
                    status={job.status}
                    onClick={() => handleJobClick(job.id)}
                    onPinToggle={(e) => togglePin(job.id, !!job.pinned, e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
