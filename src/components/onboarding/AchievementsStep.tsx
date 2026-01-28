"use client";

import React from "react";
import { LinkedInData, Step } from "./types";

interface AchievementsStepProps {
  editableData: LinkedInData;
  setEditableData: (data: LinkedInData) => void;
  setStep: (step: Step) => void;
  aiRecommendations: Record<number, string[]>;
  loadingRecommendations: Record<number, boolean>;
  expandedSuggestions: Record<number, boolean>;
  setExpandedSuggestions: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  regeneratingBullets: Record<string, boolean>;
  handleBulletFeedback: (
    jobIdx: number,
    recIdx: number,
    bullet: string,
    feedback: 'up' | 'down',
    exp: { company: string; title: string; description: string[] }
  ) => void;
  clearRecommendationsAndGoBack: () => void;
  MAX_BULLETS_PER_ROLE: number;
  INITIAL_SUGGESTIONS_SHOWN: number;
}

export default function AchievementsStep({
  editableData,
  setEditableData,
  setStep,
  aiRecommendations,
  loadingRecommendations,
  expandedSuggestions,
  setExpandedSuggestions,
  regeneratingBullets,
  handleBulletFeedback,
  clearRecommendationsAndGoBack,
  MAX_BULLETS_PER_ROLE,
  INITIAL_SUGGESTIONS_SHOWN,
}: AchievementsStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Achievements</h2>
          <p className="text-gray-600 text-sm">Edit bullet points from your work experience</p>
        </div>
      </div>

      <div className="space-y-6 mb-6 max-h-[32rem] overflow-y-auto">
        {editableData.work_experience.map((exp, jobIdx) => (
          <div key={jobIdx} className="p-4 bg-brand-gray rounded-lg">
            <h3 className="font-medium text-gray-800 mb-3">
              {exp.title} at {exp.company}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  Bullets: {exp.description.filter(b => b.trim() !== "").length}/{MAX_BULLETS_PER_ROLE}
                </span>
                {exp.description.filter(b => b.trim() !== "").length >= MAX_BULLETS_PER_ROLE && (
                  <span className="text-xs text-amber-600">Maximum reached</span>
                )}
              </div>
              {exp.description.map((bullet, bulletIdx) => (
                <div key={bulletIdx} className="flex gap-2">
                  <span className="text-gray-400 mt-2">&#8226;</span>
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => {
                      const updated = { ...editableData };
                      updated.work_experience[jobIdx].description[bulletIdx] = e.target.value;
                      setEditableData(updated);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      const updated = { ...editableData };
                      updated.work_experience[jobIdx].description = updated.work_experience[jobIdx].description.filter((_, i) => i !== bulletIdx);
                      setEditableData(updated);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove bullet"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {exp.description.filter(b => b.trim() !== "").length < MAX_BULLETS_PER_ROLE && (
                <button
                  onClick={() => {
                    const updated = { ...editableData };
                    updated.work_experience[jobIdx].description.push("");
                    setEditableData(updated);
                  }}
                  className="text-sm text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 mt-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add bullet point
                </button>
              )}
            </div>

            {/* AI Recommendations */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-medium text-purple-600">AI Suggestions</span>
              </div>
              {loadingRecommendations[jobIdx] ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                  Generating suggestions...
                </div>
              ) : aiRecommendations[jobIdx] === null ? (
                <p className="text-xs text-gray-400">AI suggestions unavailable - check API keys</p>
              ) : aiRecommendations[jobIdx]?.length > 0 ? (
                <div className="space-y-2">
                  {(() => {
                    const currentBulletCount = exp.description.filter(b => b.trim() !== "").length;
                    const isAtLimit = currentBulletCount >= MAX_BULLETS_PER_ROLE;
                    const isExpanded = expandedSuggestions[jobIdx];
                    const suggestionsToShow = isExpanded
                      ? aiRecommendations[jobIdx]
                      : aiRecommendations[jobIdx].slice(0, INITIAL_SUGGESTIONS_SHOWN);
                    const hasMoreSuggestions = aiRecommendations[jobIdx].length > INITIAL_SUGGESTIONS_SHOWN;

                    return (
                      <>
                        {isAtLimit && (
                          <p className="text-xs text-amber-600 mb-2">
                            Remove a bullet to add more suggestions
                          </p>
                        )}
                        {suggestionsToShow.map((rec, recIdx) => {
                          const isRegenerating = regeneratingBullets[`${jobIdx}-${recIdx}`];
                          return (
                            <div
                              key={recIdx}
                              className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                                isAtLimit
                                  ? "bg-gray-100 border-gray-200 text-gray-400"
                                  : "bg-purple-50 border-purple-200 text-gray-700"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="flex-1">
                                  {isRegenerating ? (
                                    <span className="flex items-center gap-2 text-gray-500">
                                      <span className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                                      Generating new suggestion...
                                    </span>
                                  ) : (
                                    rec
                                  )}
                                </span>
                                {!isRegenerating && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    {/* Thumbs up - accept */}
                                    <button
                                      disabled={isAtLimit}
                                      onClick={() => handleBulletFeedback(jobIdx, recIdx, rec, 'up', exp)}
                                      className={`p-1.5 rounded-full transition-colors ${
                                        isAtLimit
                                          ? "text-gray-300 cursor-not-allowed"
                                          : "text-green-500 hover:bg-green-100 hover:text-green-600"
                                      }`}
                                      title={isAtLimit ? "Remove a bullet first" : "Add this bullet"}
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                      </svg>
                                    </button>
                                    {/* Thumbs down - regenerate */}
                                    <button
                                      onClick={() => handleBulletFeedback(jobIdx, recIdx, rec, 'down', exp)}
                                      className="p-1.5 rounded-full text-red-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                                      title="Generate a different suggestion"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {hasMoreSuggestions && !isExpanded && (
                          <button
                            onClick={() => setExpandedSuggestions(prev => ({ ...prev, [jobIdx]: true }))}
                            className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Load more suggestions ({aiRecommendations[jobIdx].length - INITIAL_SUGGESTIONS_SHOWN} more)
                          </button>
                        )}
                        {isExpanded && hasMoreSuggestions && (
                          <button
                            onClick={() => setExpandedSuggestions(prev => ({ ...prev, [jobIdx]: false }))}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-600 flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Show less
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No suggestions available</p>
              )}
            </div>
          </div>
        ))}
        {editableData.work_experience.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No work experience to show achievements</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={clearRecommendationsAndGoBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep("skills")}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
