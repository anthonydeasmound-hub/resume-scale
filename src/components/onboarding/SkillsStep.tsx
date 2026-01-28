"use client";

import React from "react";
import { LinkedInData, Step, SkillSuggestions } from "./types";

interface SkillsStepProps {
  editableData: LinkedInData;
  setEditableData: (data: LinkedInData) => void;
  setStep: (step: Step) => void;
  newSkill: string;
  setNewSkill: (skill: string) => void;
  skillSuggestions: SkillSuggestions | null;
  setSkillSuggestions: React.Dispatch<React.SetStateAction<SkillSuggestions | null>>;
  loadingSkillSuggestions: boolean;
  expandedSkillCategory: Record<string, boolean>;
  setExpandedSkillCategory: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  INITIAL_SKILLS_SHOWN: number;
}

export default function SkillsStep({
  editableData,
  setEditableData,
  setStep,
  newSkill,
  setNewSkill,
  skillSuggestions,
  setSkillSuggestions,
  loadingSkillSuggestions,
  expandedSkillCategory,
  setExpandedSkillCategory,
  INITIAL_SKILLS_SHOWN,
}: SkillsStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Skills</h2>
          <p className="text-gray-600 text-sm">Review and edit your skills</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {editableData.skills.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-blue-100 text-brand-blue rounded-full text-sm flex items-center gap-2"
            >
              {skill}
              <button
                onClick={() => {
                  const updated = { ...editableData };
                  updated.skills = updated.skills.filter((_, i) => i !== idx);
                  setEditableData(updated);
                }}
                className="text-blue-500 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {editableData.skills.length === 0 && (
            <p className="text-sm text-gray-400">No skills added yet</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSkill.trim()) {
                const updated = { ...editableData };
                updated.skills = [...updated.skills, newSkill.trim()];
                setEditableData(updated);
                setNewSkill("");
              }
            }}
            placeholder="Add a skill..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
          <button
            onClick={() => {
              if (newSkill.trim()) {
                const updated = { ...editableData };
                updated.skills = [...updated.skills, newSkill.trim()];
                setEditableData(updated);
                setNewSkill("");
              }
            }}
            className="px-4 py-2 bg-brand-gold text-gray-900 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* AI Skill Suggestions */}
      <div className="mb-6 p-4 bg-brand-gray rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-medium text-purple-600">AI Suggestions</span>
        </div>

        {loadingSkillSuggestions ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <span className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
            Analyzing your roles for skill recommendations...
          </div>
        ) : skillSuggestions ? (
          <div className="space-y-4">
            {/* Hard Skills */}
            {skillSuggestions.hardSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Technical Skills</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const isExpanded = expandedSkillCategory["hardSkills"];
                    const skillsToShow = isExpanded
                      ? skillSuggestions.hardSkills
                      : skillSuggestions.hardSkills.slice(0, INITIAL_SKILLS_SHOWN);
                    const hasMore = skillSuggestions.hardSkills.length > INITIAL_SKILLS_SHOWN;

                    return (
                      <>
                        {skillsToShow.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => {
                              const updated = { ...editableData };
                              if (!updated.skills.includes(skill)) {
                                updated.skills = [...updated.skills, skill];
                                setEditableData(updated);
                                setSkillSuggestions(prev => prev ? {
                                  ...prev,
                                  hardSkills: prev.hardSkills.filter(s => s !== skill)
                                } : null);
                              }
                            }}
                            className="px-3 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full text-sm text-gray-700 transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                        {hasMore && !isExpanded && (
                          <button
                            onClick={() => setExpandedSkillCategory(prev => ({ ...prev, hardSkills: true }))}
                            className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700"
                          >
                            +{skillSuggestions.hardSkills.length - INITIAL_SKILLS_SHOWN} more
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Soft Skills */}
            {skillSuggestions.softSkills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Soft Skills</p>
                <div className="flex flex-wrap gap-2">
                  {skillSuggestions.softSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => {
                        const updated = { ...editableData };
                        if (!updated.skills.includes(skill)) {
                          updated.skills = [...updated.skills, skill];
                          setEditableData(updated);
                          setSkillSuggestions(prev => prev ? {
                            ...prev,
                            softSkills: prev.softSkills.filter(s => s !== skill)
                          } : null);
                        }
                      }}
                      className="px-3 py-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tools */}
            {skillSuggestions.tools.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Tools & Technologies</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const isExpanded = expandedSkillCategory["tools"];
                    const skillsToShow = isExpanded
                      ? skillSuggestions.tools
                      : skillSuggestions.tools.slice(0, INITIAL_SKILLS_SHOWN);
                    const hasMore = skillSuggestions.tools.length > INITIAL_SKILLS_SHOWN;

                    return (
                      <>
                        {skillsToShow.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => {
                              const updated = { ...editableData };
                              if (!updated.skills.includes(skill)) {
                                updated.skills = [...updated.skills, skill];
                                setEditableData(updated);
                                setSkillSuggestions(prev => prev ? {
                                  ...prev,
                                  tools: prev.tools.filter(s => s !== skill)
                                } : null);
                              }
                            }}
                            className="px-3 py-1 bg-brand-blue-light hover:bg-blue-100 border border-brand-blue rounded-full text-sm text-gray-700 transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                        {hasMore && !isExpanded && (
                          <button
                            onClick={() => setExpandedSkillCategory(prev => ({ ...prev, tools: true }))}
                            className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700"
                          >
                            +{skillSuggestions.tools.length - INITIAL_SKILLS_SHOWN} more
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {skillSuggestions.hardSkills.length === 0 &&
             skillSuggestions.softSkills.length === 0 &&
             skillSuggestions.tools.length === 0 && (
              <p className="text-xs text-gray-400">All suggestions have been added</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No suggestions available</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep("achievements")}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep("education")}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
