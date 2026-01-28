"use client";

import { useState, useEffect } from "react";
import { JobAnalysis, JobAnalysisKeyword, JobAnalysisRequirement } from "@/lib/db";

interface JobDetailsParsed {
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  salary_range: string | null;
  location: string | null;
  work_type: string | null;
}

interface JobAnalysisPanelProps {
  jobId: number;
  companyName: string;
  jobTitle: string;
  jobDescription: string | null;
  jobDetailsParsed: JobDetailsParsed | null;
}

export default function JobAnalysisPanel({
  jobId,
  companyName,
  jobTitle,
  jobDescription,
  jobDetailsParsed,
}: JobAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
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

      {/* Full Job Description (Collapsible) */}
      {jobDescription && (
        <div className="bg-white rounded-xl shadow p-4">
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-medium text-gray-900">Full Job Description</h3>
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
