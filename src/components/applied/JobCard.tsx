"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import InterviewProgressBar from "./InterviewProgressBar";

type InterviewStatus = "pending" | "scheduled" | "completed" | "rejected";
type JobStatus = "applied" | "interview" | "offer" | "rejected";

interface Job {
  id: number;
  company_name: string;
  job_title: string;
  status: string;
  date_applied: string | null;
  interview_1: string | null;
  interview_2: string | null;
  interview_3: string | null;
  interview_4: string | null;
  interview_5: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_title: string | null;
  recruiter_source: 'email' | 'job_description' | 'manual' | null;
  created_at: string;
}

interface JobCardProps {
  job: Job;
  onStatusChange: (jobId: number, newStatus: string) => void;
  onInterviewChange: (jobId: number, stage: string, value: string | null) => void;
  onInterviewPrepClick?: (job: Job) => void;
}

const borderColors: Record<JobStatus, string> = {
  applied: "border-l-blue-500",
  interview: "border-l-yellow-500",
  offer: "border-l-green-500",
  rejected: "border-l-red-500",
};

const INTERVIEW_STAGES = ["interview_1", "interview_2", "interview_3", "interview_4", "interview_5"] as const;

export default function JobCard({ job, onStatusChange, onInterviewChange, onInterviewPrepClick }: JobCardProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const status = job.status as JobStatus;
  const borderColor = borderColors[status] || borderColors.applied;

  const getInterviewStatus = (stage: typeof INTERVIEW_STAGES[number]): InterviewStatus => {
    const value = job[stage];
    if (!value) return "pending";
    if (value === "rejected") return "rejected";
    if (value === "scheduled") return "scheduled";
    return "completed";
  };

  const interviewStages: InterviewStatus[] = INTERVIEW_STAGES.map(getInterviewStatus);

  const cycleInterviewStatus = (stageIndex: number) => {
    const stage = INTERVIEW_STAGES[stageIndex];
    const current = getInterviewStatus(stage);
    let next: string | null;

    switch (current) {
      case "pending":
        next = "scheduled";
        break;
      case "scheduled":
        next = "completed";
        break;
      case "completed":
        next = "rejected";
        break;
      case "rejected":
        next = null;
        break;
      default:
        next = null;
    }

    onInterviewChange(job.id, stage, next);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const cardBackground = status === "offer"
    ? "bg-green-50/50"
    : status === "rejected"
    ? "bg-red-50/50 opacity-75"
    : "bg-white";

  return (
    <div
      className={`${cardBackground} rounded-lg shadow-md border-l-4 ${borderColor} p-4 hover:shadow-lg transition-shadow relative`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <StatusBadge
          status={status}
          onClick={() => setShowStatusMenu(!showStatusMenu)}
        />
        <span className="text-xs text-gray-500 font-medium">
          {formatDate(job.date_applied)}
        </span>
      </div>

      {/* Status Dropdown */}
      {showStatusMenu && (
        <div className="absolute top-12 left-4 bg-white rounded-lg shadow-lg border p-2 z-10 min-w-[120px]">
          {(["applied", "interview", "offer", "rejected"] as JobStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                onStatusChange(job.id, s);
                setShowStatusMenu(false);
              }}
              className={`block w-full text-left px-3 py-1.5 text-sm rounded hover:bg-gray-100 capitalize ${
                job.status === s ? "font-medium bg-gray-50" : ""
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Company & Title */}
      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 truncate" title={job.company_name}>
        {job.company_name}
      </h3>
      <p className="text-gray-600 text-sm mb-4 truncate" title={job.job_title}>
        {job.job_title}
      </p>

      {/* Interview Progress */}
      <div className="mb-4">
        <InterviewProgressBar
          stages={interviewStages}
          onStageClick={cycleInterviewStatus}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => window.open(`/api/jobs/${job.id}/resume`, "_blank")}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          View Resume
        </button>
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
        >
          Change Status
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Interview Prep Button */}
      {onInterviewPrepClick && (
        <button
          onClick={() => onInterviewPrepClick(job)}
          className="w-full mt-2 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Interview Prep
        </button>
      )}

      {/* Click outside to close menu */}
      {showStatusMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowStatusMenu(false)}
        />
      )}
    </div>
  );
}
