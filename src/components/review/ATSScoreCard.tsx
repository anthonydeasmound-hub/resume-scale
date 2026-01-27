"use client";

import { useState } from "react";
import { ATSScore } from "@/lib/ats-scorer";

interface ATSScoreCardProps {
  score: ATSScore | null;
  loading: boolean;
  onCalculate: () => void;
  disabled: boolean;
}

function ScoreCircle({ score, max, label }: { score: number; max: number; label: string }) {
  const percentage = (score / max) * 100;
  const isGood = percentage >= 70;
  const isMedium = percentage >= 50 && percentage < 70;

  return (
    <div className="text-center">
      <div className={`text-sm font-semibold ${
        isGood ? "text-green-600" : isMedium ? "text-yellow-600" : "text-red-600"
      }`}>
        {score}/{max}
      </div>
      <div className="text-xs text-gray-500 capitalize">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'exceeds' | 'meets' | 'partial' | 'missing' | 'high' | 'medium' | 'low' }) {
  const colors = {
    exceeds: "bg-green-100 text-green-700",
    meets: "bg-green-100 text-green-700",
    high: "bg-green-100 text-green-700",
    partial: "bg-yellow-100 text-yellow-700",
    medium: "bg-yellow-100 text-yellow-700",
    missing: "bg-red-100 text-red-700",
    low: "bg-red-100 text-red-700",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status]}`}>
      {status}
    </span>
  );
}

export default function ATSScoreCard({ score, loading, onCalculate, disabled }: ATSScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (overallScore: number) => {
    if (overallScore >= 70) return { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200" };
    if (overallScore >= 50) return { bg: "bg-yellow-100", text: "text-yellow-700", ring: "ring-yellow-200" };
    return { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" };
  };

  const handleClick = () => {
    if (score) {
      setIsExpanded(!isExpanded);
    } else {
      onCalculate();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
            score ? getScoreColor(score.overall).bg + " " + getScoreColor(score.overall).text : "bg-blue-100 text-blue-600"
          }`}>
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : score ? (
              score.overall
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <span className="font-medium text-gray-900">
            {loading ? "Calculating..." : score ? `ATS Score: ${score.overall}/100` : "ATS Compatibility Score"}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && score && (
        <div className="px-4 pb-4 border-t">
          <div className="pt-4 space-y-4">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ring-4 ${
                getScoreColor(score.overall).bg
              } ${getScoreColor(score.overall).text} ${getScoreColor(score.overall).ring}`}>
                {score.overall}
              </div>
              <p className="text-sm text-gray-500 mt-2">ATS Compatibility</p>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y">
              <ScoreCircle score={score.breakdown.keywords.score} max={40} label="Keywords" />
              <ScoreCircle score={score.breakdown.hardSkills.score} max={20} label="Tech Skills" />
              <ScoreCircle score={score.breakdown.jobTitle.score} max={15} label="Title Match" />
              <ScoreCircle score={score.breakdown.education.score} max={10} label="Education" />
              <ScoreCircle score={score.breakdown.format.score} max={10} label="Format" />
              <ScoreCircle score={score.breakdown.softSkills.score} max={5} label="Soft Skills" />
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-3">
              {/* Keywords */}
              {score.breakdown.keywords.matches.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">Matched Keywords ({score.breakdown.keywords.matches.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {score.breakdown.keywords.matches.slice(0, 10).map((kw, i) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                    {score.breakdown.keywords.matches.length > 10 && (
                      <span className="text-xs text-gray-500">+{score.breakdown.keywords.matches.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Hard Skills Match */}
              {score.breakdown.hardSkills.matches.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">Technical Skills Match</p>
                  <div className="flex flex-wrap gap-1">
                    {score.breakdown.hardSkills.matches.map((skill, i) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded capitalize">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Hard Skills */}
              {score.breakdown.hardSkills.missing.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-1">Missing Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {score.breakdown.hardSkills.missing.slice(0, 5).map((skill, i) => (
                      <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded capitalize">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Title */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Job Title Relevance</span>
                <StatusBadge status={score.breakdown.jobTitle.relevance} />
              </div>

              {/* Education */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Education Match</span>
                <StatusBadge status={score.breakdown.education.status} />
              </div>
            </div>

            {/* Suggestions */}
            {score.suggestions.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-blue-600 mb-2">Suggestions to Improve Score</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {score.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-blue-500 mt-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recalculate Button */}
            <button
              onClick={onCalculate}
              disabled={loading}
              className="w-full text-xs text-blue-600 hover:text-blue-700 py-2 border-t"
            >
              Recalculate Score
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
