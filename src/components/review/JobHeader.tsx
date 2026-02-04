"use client";

import React from "react";
import { Job, JobDetailsParsed } from "./types";

interface JobHeaderProps {
  job: Job;
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  onExcitementChange: (level: number | null) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? "" : "s"} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? "" : "s"} ago`;
}

function getDomainFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return domain;
  } catch {
    return null;
  }
}

export default function JobHeader({
  job,
  hasChanges,
  saving,
  onSave,
  onBack,
  onExcitementChange,
  onEdit,
  onDelete,
  deleting,
}: JobHeaderProps) {
  // Parse job details if available
  let jobDetails: JobDetailsParsed | null = null;
  if (job.job_details_parsed) {
    try {
      jobDetails = JSON.parse(job.job_details_parsed);
      console.log("[JobHeader] Parsed jobDetails:", jobDetails);
      console.log("[JobHeader] salary_range:", jobDetails?.salary_range);
    } catch (e) {
      console.error("[JobHeader] Failed to parse job_details_parsed:", e);
    }
  } else {
    console.log("[JobHeader] job.job_details_parsed is null/empty");
  }

  const domain = getDomainFromUrl(job.job_url);
  const relativeTime = getRelativeTime(job.created_at);

  return (
    <div className="mb-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-brand-blue hover:text-brand-blue-dark text-sm mb-3 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to jobs
      </button>

      {/* Main header content */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left side - Job info */}
        <div className="flex-1 min-w-0">
          {/* Job title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {job.job_title}
          </h1>

          {/* Company and location */}
          <div className="text-gray-600 mb-1">
            <span className="font-medium">{job.company_name}</span>
            {jobDetails?.location && (
              <>
                <span className="mx-2">—</span>
                <span>{jobDetails.location}</span>
              </>
            )}
          </div>

          {/* Saved time and source */}
          <div className="text-sm text-gray-500">
            Saved {relativeTime}
            {domain && (
              <>
                {" "}on{" "}
                <span className="text-brand-blue">{domain}</span>
              </>
            )}
          </div>
        </div>

        {/* Right side - Salary, Stars, and Actions */}
        <div className="flex flex-col items-start md:items-end gap-1 md:flex-shrink-0">
          {/* Salary range */}
          <div className="text-xl font-semibold text-gray-900">
            {jobDetails?.salary_range ? (
              <>
                {jobDetails.salary_range}
                {!jobDetails.salary_range.toLowerCase().includes("year") &&
                 !jobDetails.salary_range.toLowerCase().includes("yr") &&
                 !jobDetails.salary_range.toLowerCase().includes("hour") &&
                 !jobDetails.salary_range.toLowerCase().includes("hr") && (
                  <span className="text-sm font-normal text-gray-500">/yr</span>
                )}
              </>
            ) : (
              <span className="text-gray-400 font-normal text-base">Salary not specified</span>
            )}
          </div>

          {/* Interest rating - no label, just stars */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onExcitementChange(job.excitement_level === star ? null : star)}
                className="p-0.5 hover:scale-110 transition-transform"
                title={`${star} star${star === 1 ? "" : "s"} interest`}
              >
                <svg
                  className={`w-5 h-5 ${
                    job.excitement_level && star <= job.excitement_level
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-1">
          {hasChanges && (
            <button
              onClick={onSave}
              disabled={saving}
              className="bg-brand-gold text-gray-900 px-6 py-2.5 rounded-lg font-medium hover:bg-brand-gold-dark disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit job"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete job"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
