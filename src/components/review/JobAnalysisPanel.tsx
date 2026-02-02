"use client";

import { useState, useEffect } from "react";
import { JobAnalysis, JobAnalysisKeyword, JobAnalysisRequirement } from "@/lib/db";

interface JobDetailsParsed {
  about_company?: string | null;
  role_summary?: string | null;
  responsibilities: string[];
  requirements: string[];
  nice_to_haves?: string[];
  benefits: string[];
  salary_range: string | null;
  location: string | null;
  work_type: string | null;
  // Legacy field
  qualifications?: string[];
}

interface JobAnalysisPanelProps {
  jobId: number;
  companyName: string;
  jobTitle: string;
  jobDescription: string | null;
  jobDetailsParsed: JobDetailsParsed | null;
  onJobDetailsUpdated?: (jobDetails: JobDetailsParsed) => void;
}

export default function JobAnalysisPanel({
  jobId,
  companyName,
  jobTitle,
  jobDescription,
  jobDetailsParsed: initialJobDetails,
  onJobDetailsUpdated,
}: JobAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [jobDetailsParsed, setJobDetailsParsed] = useState<JobDetailsParsed | null>(initialJobDetails);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, [jobId]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/analyze`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load analysis");
      }
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  const regenerateAnalysis = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/analyze`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to regenerate analysis");
      }
      const data = await res.json();
      setAnalysis(data.analysis);
      // Update job details if returned (re-parsing adds new fields)
      if (data.jobDetails) {
        setJobDetailsParsed(data.jobDetails);
        // Notify parent to update its state (for JobHeader salary/location display)
        onJobDetailsUpdated?.(data.jobDetails);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  const getCoverageColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getCoverageBarColor = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getMatchBadgeStyle = (status: JobAnalysisRequirement["matchStatus"]) => {
    switch (status) {
      case "matched":
        return "bg-green-100 text-green-700";
      case "partial":
        return "bg-yellow-100 text-yellow-700";
      case "missing":
        return "bg-red-100 text-red-700";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded-full w-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-center py-4">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-brand-gold text-gray-900 rounded-lg hover:bg-brand-gold-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-xl font-bold text-white">
              {companyName?.charAt(0) || "?"}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{companyName}</h2>
            <p className="text-gray-600">{jobTitle}</p>
          </div>
          {analysis && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${getCoverageColor(analysis.coverageScore)}`}>
                {analysis.coverageScore}%
              </div>
              <div className="text-xs text-gray-500">Match Score</div>
            </div>
          )}
        </div>

        {/* Employment Details Pills */}
        {jobDetailsParsed && (
          <div className="flex flex-wrap gap-2 mb-4">
            {jobDetailsParsed.work_type && (
              <span className="px-3 py-1 bg-blue-100 text-brand-blue rounded-full text-sm font-medium">
                {jobDetailsParsed.work_type}
              </span>
            )}
            {jobDetailsParsed.location && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {jobDetailsParsed.location}
              </span>
            )}
            {jobDetailsParsed.salary_range && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                {jobDetailsParsed.salary_range}
              </span>
            )}
          </div>
        )}

        {/* AI Summary */}
        {analysis?.summary && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        {/* Coverage Bar */}
        {analysis && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Resume Coverage</span>
              <span>{analysis.coverageScore}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getCoverageBarColor(analysis.coverageScore)} transition-all`}
                style={{ width: `${analysis.coverageScore}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Keywords Panel */}
      {analysis?.keywords && analysis.keywords.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Key Skills & Technologies</h3>
            <div className="text-xs text-gray-500">
              {analysis.keywords.filter((k) => k.inResume).length}/{analysis.keywords.length} in resume
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((keyword, idx) => (
              <span
                key={idx}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  keyword.inResume
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : keyword.importance === "required"
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
                title={
                  keyword.inResume
                    ? "In your resume"
                    : keyword.importance === "required"
                    ? "Required - not in resume"
                    : "Preferred - not in resume"
                }
              >
                {keyword.inResume && (
                  <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {keyword.skill}
                {keyword.importance === "required" && !keyword.inResume && (
                  <span className="ml-1 text-xs opacity-75">*</span>
                )}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <span className="text-red-600">*</span> = Required skill missing from resume
          </p>
        </div>
      )}

      {/* Requirements Comparison */}
      {analysis?.requirements && analysis.requirements.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-medium text-gray-900 mb-3">Requirements Analysis</h3>
          <div className="space-y-3">
            {analysis.requirements.map((req, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${
                  req.matchStatus === "matched"
                    ? "border-green-200 bg-green-50"
                    : req.matchStatus === "partial"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-800 flex-1">{req.text}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        req.priority === "required"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {req.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getMatchBadgeStyle(
                        req.matchStatus
                      )}`}
                    >
                      {req.matchStatus === "matched"
                        ? "Match"
                        : req.matchStatus === "partial"
                        ? "Partial"
                        : "Gap"}
                    </span>
                  </div>
                </div>
                {req.matchedExperience && (
                  <p className="text-xs text-gray-600 mt-1 pl-3 border-l-2 border-gray-300">
                    Your experience: {req.matchedExperience}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured Job Details Sections */}
      {jobDetailsParsed && (
        <div className="space-y-3">
          {/* About the Company */}
          {jobDetailsParsed.about_company && (
            <JobSection
              icon={<BuildingIcon />}
              title="About the Company"
              accentColor="blue"
            >
              <p className="text-sm text-gray-700 leading-relaxed">{jobDetailsParsed.about_company}</p>
            </JobSection>
          )}

          {/* Role Summary */}
          {jobDetailsParsed.role_summary && (
            <JobSection
              icon={<BriefcaseIcon />}
              title="About the Role"
              accentColor="indigo"
            >
              <p className="text-sm text-gray-700 leading-relaxed">{jobDetailsParsed.role_summary}</p>
            </JobSection>
          )}

          {/* Responsibilities */}
          {jobDetailsParsed.responsibilities && jobDetailsParsed.responsibilities.length > 0 && (
            <JobSection
              icon={<ClipboardIcon />}
              title="Responsibilities"
              accentColor="purple"
            >
              <ul className="space-y-2">
                {jobDetailsParsed.responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </JobSection>
          )}

          {/* Requirements */}
          {jobDetailsParsed.requirements && jobDetailsParsed.requirements.length > 0 && (
            <JobSection
              icon={<CheckBadgeIcon />}
              title="Requirements"
              accentColor="red"
              badge="Required"
            >
              <ul className="space-y-2">
                {jobDetailsParsed.requirements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </JobSection>
          )}

          {/* Nice to Haves */}
          {((jobDetailsParsed.nice_to_haves && jobDetailsParsed.nice_to_haves.length > 0) ||
            (jobDetailsParsed.qualifications && jobDetailsParsed.qualifications.length > 0)) && (
            <JobSection
              icon={<SparklesIcon />}
              title="Nice to Have"
              accentColor="amber"
              badge="Preferred"
            >
              <ul className="space-y-2">
                {(jobDetailsParsed.nice_to_haves || jobDetailsParsed.qualifications || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </JobSection>
          )}

          {/* Compensation */}
          {jobDetailsParsed.salary_range && (
            <JobSection
              icon={<CurrencyIcon />}
              title="Compensation"
              accentColor="green"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-green-700">{jobDetailsParsed.salary_range}</span>
              </div>
            </JobSection>
          )}

          {/* Benefits */}
          {jobDetailsParsed.benefits && jobDetailsParsed.benefits.length > 0 && (
            <JobSection
              icon={<GiftIcon />}
              title="Benefits & Perks"
              accentColor="teal"
            >
              <ul className="space-y-2">
                {jobDetailsParsed.benefits.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-teal-500 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </JobSection>
          )}

          {/* Location & Work Type */}
          {(jobDetailsParsed.location || jobDetailsParsed.work_type) && (
            <JobSection
              icon={<LocationIcon />}
              title="Location & Work Arrangement"
              accentColor="blue"
            >
              <div className="flex flex-wrap gap-3">
                {jobDetailsParsed.work_type && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-lg">
                    <span className="text-sm font-medium text-blue-700 capitalize">{jobDetailsParsed.work_type}</span>
                  </div>
                )}
                {jobDetailsParsed.location && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <span className="text-sm text-gray-700">{jobDetailsParsed.location}</span>
                  </div>
                )}
              </div>
            </JobSection>
          )}
        </div>
      )}

      {/* Full Job Description (Collapsible - as fallback) */}
      {jobDescription && (
        <div className="bg-white rounded-xl shadow p-4">
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <DocumentIcon />
              Full Job Description
            </h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                showFullDescription ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFullDescription && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {jobDescription}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regenerate Button */}
      <div className="flex justify-end">
        <button
          onClick={regenerateAnalysis}
          disabled={regenerating}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {regenerating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Re-analyze
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Reusable Job Section Component
function JobSection({
  icon,
  title,
  accentColor,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accentColor: "blue" | "indigo" | "purple" | "red" | "amber" | "green" | "teal";
  badge?: string;
  children: React.ReactNode;
}) {
  const colorClasses = {
    blue: "border-l-blue-500 bg-blue-50/50",
    indigo: "border-l-indigo-500 bg-indigo-50/50",
    purple: "border-l-purple-500 bg-purple-50/50",
    red: "border-l-red-500 bg-red-50/50",
    amber: "border-l-amber-500 bg-amber-50/50",
    green: "border-l-green-500 bg-green-50/50",
    teal: "border-l-teal-500 bg-teal-50/50",
  };

  const badgeClasses = {
    blue: "bg-blue-100 text-blue-700",
    indigo: "bg-indigo-100 text-indigo-700",
    purple: "bg-purple-100 text-purple-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    teal: "bg-teal-100 text-teal-700",
  };

  const iconClasses = {
    blue: "text-blue-600",
    indigo: "text-indigo-600",
    purple: "text-purple-600",
    red: "text-red-600",
    amber: "text-amber-600",
    green: "text-green-600",
    teal: "text-teal-600",
  };

  return (
    <div className={`bg-white rounded-xl shadow p-4 border-l-4 ${colorClasses[accentColor]}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={iconClasses[accentColor]}>{icon}</span>
        <h3 className="font-medium text-gray-900">{title}</h3>
        {badge && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClasses[accentColor]}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// Icon Components
function BuildingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function CheckBadgeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
