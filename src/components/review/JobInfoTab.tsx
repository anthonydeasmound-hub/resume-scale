"use client";

import React, { useState } from "react";

interface JobDetailsParsed {
  location?: string;
  salary_range?: string;
  employment_type?: string;
  experience_level?: string;
  skills?: string[];
  benefits?: string[];
  responsibilities?: string[];
  requirements?: string[];
}

interface JobInfoTabProps {
  jobTitle: string;
  companyName: string;
  jobUrl: string | null;
  jobDescription: string | null;
  jobDetailsParsed: JobDetailsParsed | null;
  createdAt: string;
  onEdit: () => void;
}

// Extract domain from URL for display
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function JobInfoTab({
  jobTitle,
  companyName,
  jobUrl,
  jobDescription,
  jobDetailsParsed,
  createdAt,
  onEdit,
}: JobInfoTabProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Quick Info Cards - consistent heights, no shadows */}
      <div className="grid grid-cols-2 gap-2">
        {jobDetailsParsed?.location && (
          <div className="bg-gray-50 rounded-lg p-3 min-h-[72px]">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</div>
            <div className="font-medium text-gray-900 text-sm">{jobDetailsParsed.location}</div>
          </div>
        )}
        {jobDetailsParsed?.salary_range && (
          <div className="bg-gray-50 rounded-lg p-3 min-h-[72px]">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Salary</div>
            <div className="font-medium text-gray-900 text-sm">{jobDetailsParsed.salary_range}</div>
          </div>
        )}
        {jobDetailsParsed?.employment_type && (
          <div className="bg-gray-50 rounded-lg p-3 min-h-[72px]">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</div>
            <div className="font-medium text-gray-900 text-sm">{jobDetailsParsed.employment_type}</div>
          </div>
        )}
        {jobDetailsParsed?.experience_level && (
          <div className="bg-gray-50 rounded-lg p-3 min-h-[72px]">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Level</div>
            <div className="font-medium text-gray-900 text-sm">{jobDetailsParsed.experience_level}</div>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg p-3 min-h-[72px]">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Saved</div>
          <div className="font-medium text-gray-900 text-sm">{formatDate(createdAt)}</div>
        </div>
      </div>

      {/* Job URL - clean button style */}
      {jobUrl && (
        <a
          href={jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-brand-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-sm font-medium text-brand-blue truncate">{getDomain(jobUrl)}</span>
          </div>
          <svg className="w-4 h-4 text-brand-blue flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      {/* Skills */}
      {jobDetailsParsed?.skills && jobDetailsParsed.skills.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {jobDetailsParsed.skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Job Description */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Job Description</h4>
          <button
            onClick={onEdit}
            className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
          >
            Edit
          </button>
        </div>
        {jobDescription ? (
          <div className="relative">
            <div
              className={`text-gray-600 text-sm whitespace-pre-wrap leading-relaxed ${
                !showFullDescription ? "line-clamp-4" : ""
              }`}
            >
              {jobDescription}
            </div>
            {jobDescription.length > 300 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-1 text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
              >
                {showFullDescription ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">No job description added.</p>
        )}
      </div>

      {/* Requirements */}
      {jobDetailsParsed?.requirements && jobDetailsParsed.requirements.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements</h4>
          <ul className="space-y-1.5">
            {jobDetailsParsed.requirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-3.5 h-3.5 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Benefits */}
      {jobDetailsParsed?.benefits && jobDetailsParsed.benefits.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Benefits</h4>
          <ul className="space-y-1.5">
            {jobDetailsParsed.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-3.5 h-3.5 text-green-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
