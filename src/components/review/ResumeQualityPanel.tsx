"use client";

import { ResumeReviewResult } from "./types";

interface ResumeQualityPanelProps {
  reviewScore: ResumeReviewResult | null;
  loadingReview: boolean;
  showReviewPanel: boolean;
  selectedRolesCount: number;
  onTogglePanel: () => void;
  onReviewResumeQuality: () => void;
}

export default function ResumeQualityPanel({
  reviewScore,
  loadingReview,
  showReviewPanel,
  selectedRolesCount,
  onTogglePanel,
  onReviewResumeQuality,
}: ResumeQualityPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={onTogglePanel}
        disabled={selectedRolesCount === 0 || loadingReview}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
            reviewScore ? (reviewScore.overallScore >= 70 ? "bg-green-100 text-green-700" : reviewScore.overallScore >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700") : "bg-purple-100 text-purple-600"
          }`}>
            {loadingReview ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : reviewScore ? (
              Math.round(reviewScore.overallScore)
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
          </div>
          <span className="font-medium text-gray-900">
            {loadingReview ? "Analyzing..." : reviewScore ? `Score: ${reviewScore.overallScore}/100` : "AI Resume Score"}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${showReviewPanel ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showReviewPanel && (
        <div className="px-4 pb-4 border-t">
          {loadingReview ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-500">AI is reviewing your resume bullets...</p>
            </div>
          ) : reviewScore ? (
            <div className="pt-4 space-y-4">
              {/* Overall Score */}
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${
                  reviewScore.overallScore >= 70 ? "bg-green-100 text-green-700" :
                  reviewScore.overallScore >= 50 ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {reviewScore.overallScore}
                </div>
                <p className="text-sm text-gray-500 mt-2">Overall Score</p>
              </div>

              {/* Category Scores */}
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(reviewScore.categoryScores).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className={`text-sm font-semibold ${
                      value >= 7 ? "text-green-600" : value >= 5 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {value}/10
                    </div>
                    <div className="text-xs text-gray-500 capitalize">{key}</div>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {reviewScore.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">Strengths</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {reviewScore.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-green-500">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {reviewScore.improvements.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-1">Areas to Improve</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {reviewScore.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-amber-500">!</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bullet Feedback */}
              {reviewScore.bulletFeedback.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Bullet Analysis</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {reviewScore.bulletFeedback.map((fb, i) => (
                      <div key={i} className={`p-2 rounded text-xs ${
                        fb.score >= 7 ? "bg-green-50 border border-green-200" :
                        fb.score >= 5 ? "bg-yellow-50 border border-yellow-200" :
                        "bg-red-50 border border-red-200"
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-gray-700 truncate flex-1 mr-2">{fb.bullet}</span>
                          <span className={`font-semibold ${
                            fb.score >= 7 ? "text-green-600" : fb.score >= 5 ? "text-yellow-600" : "text-red-600"
                          }`}>{fb.score}/10</span>
                        </div>
                        <p className="text-gray-500">{fb.feedback}</p>
                        {fb.suggestion && (
                          <p className="text-purple-600 mt-1 italic">Suggestion: {fb.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onReviewResumeQuality}
                className="w-full py-2 text-sm text-purple-600 hover:text-purple-700"
              >
                Re-analyze
              </button>
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-gray-500">
              Click to analyze your resume bullets with AI
            </div>
          )}
        </div>
      )}
    </div>
  );
}
