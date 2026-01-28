"use client";

import React from "react";
import { LinkedInData, Step, EntryPath } from "./types";

interface WorkExperienceStepProps {
  editableData: LinkedInData;
  setEditableData: (data: LinkedInData) => void;
  setStep: (step: Step) => void;
  entryPath: EntryPath;
  freshBulletSuggestions: Record<number, string[]>;
  setFreshBulletSuggestions: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  loadingFreshSuggestions: Record<number, boolean>;
  fetchFreshBulletSuggestions: (jobIdx: number, jobTitle: string, company: string) => void;
  triggerBulletSuggestions: (jobIdx: number, jobTitle: string, company: string) => void;
}

export default function WorkExperienceStep({
  editableData,
  setEditableData,
  setStep,
  entryPath,
  freshBulletSuggestions,
  setFreshBulletSuggestions,
  loadingFreshSuggestions,
  fetchFreshBulletSuggestions,
  triggerBulletSuggestions,
}: WorkExperienceStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Work Experience</h2>
          <p className="text-gray-600 text-sm">Review and edit your job history</p>
        </div>
      </div>

      {editableData.work_experience.length > 0 ? (
        <div className="space-y-4 mb-6">
          {editableData.work_experience.map((exp, idx) => (
            <div key={idx} className="p-4 bg-brand-gray rounded-lg relative">
              <button
                onClick={() => {
                  const updated = { ...editableData };
                  updated.work_experience = updated.work_experience.filter((_, i) => i !== idx);
                  setEditableData(updated);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove job"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => {
                      const updated = { ...editableData };
                      updated.work_experience[idx].title = e.target.value;
                      setEditableData(updated);
                    }}
                    onBlur={() => {
                      if (entryPath === "fresh" && exp.title && exp.title.length >= 3) {
                        triggerBulletSuggestions(idx, exp.title, exp.company);
                      }
                    }}
                    placeholder="e.g., Software Engineer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => {
                      const updated = { ...editableData };
                      updated.work_experience[idx].company = e.target.value;
                      setEditableData(updated);
                    }}
                    onBlur={() => {
                      if (entryPath === "fresh" && exp.title && exp.title.length >= 3) {
                        triggerBulletSuggestions(idx, exp.title, exp.company);
                      }
                    }}
                    placeholder="e.g., Google"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="text"
                    value={exp.start_date}
                    onChange={(e) => {
                      const updated = { ...editableData };
                      updated.work_experience[idx].start_date = e.target.value;
                      setEditableData(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="e.g., Jan 2020"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="text"
                    value={exp.end_date}
                    onChange={(e) => {
                      const updated = { ...editableData };
                      updated.work_experience[idx].end_date = e.target.value;
                      setEditableData(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="e.g., Present"
                  />
                </div>
              </div>

              {/* AI Bullet Suggestions for Fresh Path */}
              {entryPath === "fresh" && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">AI Suggestions</span>
                    </div>
                    {exp.title && exp.title.length >= 3 && (
                      <button
                        onClick={() => fetchFreshBulletSuggestions(idx, exp.title, exp.company)}
                        disabled={loadingFreshSuggestions[idx]}
                        className="text-xs text-brand-blue hover:text-brand-blue-dark disabled:opacity-50"
                      >
                        {loadingFreshSuggestions[idx] ? "Generating..." : "Regenerate"}
                      </button>
                    )}
                  </div>

                  {loadingFreshSuggestions[idx] ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                      <span className="ml-2 text-sm text-gray-500">Generating suggestions...</span>
                    </div>
                  ) : freshBulletSuggestions[idx]?.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 mb-2">Click to add to your resume:</p>
                      {freshBulletSuggestions[idx].map((bullet, bulletIdx) => (
                        <button
                          key={bulletIdx}
                          onClick={() => {
                            const updated = { ...editableData };
                            if (!updated.work_experience[idx].description.includes(bullet)) {
                              updated.work_experience[idx].description = [
                                ...updated.work_experience[idx].description,
                                bullet
                              ];
                              setEditableData(updated);
                              setFreshBulletSuggestions(prev => ({
                                ...prev,
                                [idx]: prev[idx].filter((_, i) => i !== bulletIdx)
                              }));
                            }
                          }}
                          className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-sm text-gray-700 transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>{bullet}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : exp.title && exp.title.length >= 3 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400 mb-2">No suggestions yet</p>
                      <button
                        onClick={() => fetchFreshBulletSuggestions(idx, exp.title, exp.company)}
                        className="text-xs text-brand-blue hover:text-brand-blue-dark"
                      >
                        Generate suggestions
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">
                      Enter a job title to get AI-powered bullet suggestions
                    </p>
                  )}

                  {/* Show already added bullets */}
                  {exp.description.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">Added bullets ({exp.description.length}):</p>
                      <div className="space-y-1">
                        {exp.description.map((bullet, bulletIdx) => (
                          <div key={bulletIdx} className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700 flex-1">{bullet}</span>
                            <button
                              onClick={() => {
                                const updated = { ...editableData };
                                updated.work_experience[idx].description = updated.work_experience[idx].description.filter((_, i) => i !== bulletIdx);
                                setEditableData(updated);
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add Position button for fresh path */}
          {entryPath === "fresh" && (
            <button
              onClick={() => {
                const updated = { ...editableData };
                updated.work_experience = [...updated.work_experience, {
                  company: "",
                  title: "",
                  start_date: "",
                  end_date: "Present",
                  description: [],
                }];
                setEditableData(updated);
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-brand-blue transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another Position
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400 mb-4">No work experience added yet</p>
          {entryPath === "fresh" && (
            <button
              onClick={() => {
                const updated = { ...editableData };
                updated.work_experience = [{
                  company: "",
                  title: "",
                  start_date: "",
                  end_date: "Present",
                  description: [],
                }];
                setEditableData(updated);
              }}
              className="px-6 py-3 bg-brand-gold text-gray-900 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Position
            </button>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setStep("contact")}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep("achievements")}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
