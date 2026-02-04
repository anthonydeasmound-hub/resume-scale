"use client";

import React, { useState } from "react";
import { ATSScore } from "@/lib/ats-scorer";

interface ATSDashboardProps {
  score: ATSScore | null;
  loading: boolean;
  onCalculate: () => void;
  disabled: boolean;
  // Actions
  onOptimizeBullets?: () => void;
  optimizingBullets?: boolean;
  hasBullets?: boolean;
  onAddSkill?: (skill: string) => void;
  onAddAllSkills?: (skills: string[]) => void;
  addingAllSkills?: boolean;
  onOptimizeTitles?: () => void;
  optimizingTitles?: boolean;
  onScrollToSection?: (section: "summary" | "experience" | "skills") => void;
}

function ScoreRing({ score, size = "large" }: { score: number; size?: "large" | "small" }) {
  const getColor = (s: number) => {
    if (s >= 70) return { ring: "stroke-green-500", text: "text-green-600", bg: "bg-green-50" };
    if (s >= 50) return { ring: "stroke-yellow-500", text: "text-yellow-600", bg: "bg-yellow-50" };
    return { ring: "stroke-red-500", text: "text-red-600", bg: "bg-red-50" };
  };

  const colors = getColor(score);
  const isLarge = size === "large";
  const radius = isLarge ? 54 : 36;
  const strokeWidth = isLarge ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const svgSize = isLarge ? 140 : 90;

  return (
    <div className={`relative inline-flex items-center justify-center ${isLarge ? "w-36 h-36" : "w-24 h-24"}`}>
      <svg className="transform -rotate-90" width={svgSize} height={svgSize}>
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          className={colors.ring}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${isLarge ? "text-4xl" : "text-2xl"} font-bold ${colors.text}`}>{score}</span>
        {isLarge && <span className="text-xs text-gray-500 mt-1">out of 100</span>}
      </div>
    </div>
  );
}

function IssueCard({
  icon,
  title,
  description,
  items,
  actionLabel,
  onAction,
  actionLoading,
  variant = "warning",
  onItemAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  items?: string[];
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  variant?: "warning" | "error" | "info";
  onItemAction?: (item: string) => void;
}) {
  const variantStyles = {
    warning: "border-amber-200 bg-amber-50",
    error: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50",
  };

  const iconStyles = {
    warning: "text-amber-600 bg-amber-100",
    error: "text-red-600 bg-red-100",
    info: "text-blue-600 bg-blue-100",
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconStyles[variant]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>

          {items && items.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {items.slice(0, 6).map((item, i) => (
                <span
                  key={i}
                  onClick={() => onItemAction?.(item)}
                  className={`text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700 ${
                    onItemAction ? "cursor-pointer hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-colors" : ""
                  }`}
                >
                  {onItemAction && <span className="mr-1">+</span>}
                  {item}
                </span>
              ))}
              {items.length > 6 && (
                <span className="text-xs text-gray-500 py-1">+{items.length - 6} more</span>
              )}
            </div>
          )}

          {actionLabel && onAction && (
            <button
              onClick={onAction}
              disabled={actionLoading}
              className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1 disabled:opacity-50"
            >
              {actionLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {actionLabel}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessCard({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg text-green-600 bg-green-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {items.slice(0, 8).map((item, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                {item}
              </span>
            ))}
            {items.length > 8 && (
              <span className="text-xs text-green-600 py-1">+{items.length - 8} more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ATSDashboard({
  score,
  loading,
  onCalculate,
  disabled,
  onOptimizeBullets,
  optimizingBullets,
  hasBullets,
  onAddSkill,
  onAddAllSkills,
  addingAllSkills,
  onOptimizeTitles,
  optimizingTitles,
  onScrollToSection,
}: ATSDashboardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // No score yet - show calculate prompt
  if (!score && !loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ATS Compatibility Score</h3>
          <p className="text-sm text-gray-600 mb-4">
            Analyze how well your resume matches this job description
          </p>
          <button
            onClick={onCalculate}
            disabled={disabled}
            className="bg-brand-blue text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Calculate Score
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-600">Analyzing your resume...</span>
        </div>
      </div>
    );
  }

  // Has score - show dashboard
  const { breakdown, suggestions } = score!;

  // Determine which issues to show (must match the conditions for displaying each card)
  const hasSkillsIssue = breakdown.hardSkills.missing.length > 0;
  const hasKeywordIssue = breakdown.keywords.score < 25 && hasBullets; // Only count if card will show
  const hasTitleIssue = breakdown.jobTitle.relevance === "low";
  const hasFormatIssues = breakdown.format.issues.length > 0;

  const issueCount = [hasSkillsIssue, hasKeywordIssue, hasTitleIssue, hasFormatIssues].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      {/* Score Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-6">
          <ScoreRing score={score!.overall} />

          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">ATS Compatibility</h3>
            <p className="text-sm text-gray-600 mt-1">
              {score!.overall >= 70
                ? "Great match! Your resume aligns well with this job."
                : score!.overall >= 50
                ? "Good start. A few improvements could boost your chances."
                : "Needs work. Address the issues below to improve your match."}
            </p>

            {/* Quick stats */}
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{breakdown.keywords.matches.length}</div>
                <div className="text-xs text-gray-500">Keywords matched</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{breakdown.hardSkills.matches.length}</div>
                <div className="text-xs text-gray-500">Skills matched</div>
              </div>
              {issueCount > 0 && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-amber-600">{issueCount}</div>
                  <div className="text-xs text-gray-500">Issues to fix</div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onCalculate}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-gray-700 p-2"
            title="Recalculate"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Issues Section */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">
            {issueCount > 0 ? "Issues to Address" : "Looking Good!"}
          </h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-brand-blue hover:text-brand-blue-dark"
          >
            {showDetails ? "Hide details" : "Show all details"}
          </button>
        </div>

        {/* Missing Skills */}
        {hasSkillsIssue && (
          <IssueCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            }
            title={`Add ${breakdown.hardSkills.missing.length} missing skill${breakdown.hardSkills.missing.length > 1 ? "s" : ""}`}
            description="These skills appear in the job description but not your resume"
            items={breakdown.hardSkills.missing}
            variant="warning"
            onItemAction={onAddSkill}
            actionLabel="Add All Missing Skills"
            onAction={() => onAddAllSkills?.(breakdown.hardSkills.missing)}
            actionLoading={addingAllSkills}
          />
        )}

        {/* Keyword Optimization */}
        {hasKeywordIssue && hasBullets && (
          <IssueCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            title="Optimize bullets for keywords"
            description={`Your resume matches ${breakdown.keywords.score}/40 keyword points. AI can help improve this.`}
            actionLabel="Optimize All Bullets"
            onAction={onOptimizeBullets}
            actionLoading={optimizingBullets}
            variant="warning"
          />
        )}

        {/* Title Match */}
        {hasTitleIssue && (
          <IssueCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            title="Improve title relevance"
            description={breakdown.jobTitle.details}
            actionLabel="Optimize Bullets for Title Match"
            onAction={onOptimizeTitles}
            actionLoading={optimizingTitles}
            variant="warning"
          />
        )}

        {/* Format Issues */}
        {hasFormatIssues && (
          <IssueCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Format improvements"
            description="These changes can help ATS systems parse your resume better"
            items={breakdown.format.issues}
            variant="info"
          />
        )}

        {/* Success - Matched Skills */}
        {showDetails && breakdown.hardSkills.matches.length > 0 && (
          <SuccessCard
            title={`${breakdown.hardSkills.matches.length} skills matched`}
            items={breakdown.hardSkills.matches}
          />
        )}

        {/* Success - Matched Keywords */}
        {showDetails && breakdown.keywords.matches.length > 0 && (
          <SuccessCard
            title={`${breakdown.keywords.matches.length} keywords matched`}
            items={breakdown.keywords.matches}
          />
        )}

        {/* No issues */}
        {issueCount === 0 && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Your resume is well-optimized for this job!</p>
          </div>
        )}
      </div>

      {/* Detailed Breakdown Toggle */}
      {showDetails && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Score Breakdown</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Keywords", score: breakdown.keywords.score, max: 40 },
              { label: "Skills", score: breakdown.hardSkills.score, max: 20 },
              { label: "Title Match", score: breakdown.jobTitle.score, max: 15 },
              { label: "Education", score: breakdown.education.score, max: 10 },
              { label: "Format", score: breakdown.format.score, max: 10 },
              { label: "Soft Skills", score: breakdown.softSkills.score, max: 5 },
            ].map(({ label, score, max }) => {
              const pct = (score / max) * 100;
              const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={label} className="text-center">
                  <div className="text-sm font-medium text-gray-700">{score}/{max}</div>
                  <div className="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
