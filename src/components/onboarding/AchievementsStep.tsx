"use client";

import React from "react";
import { LinkedInData, Step } from "./types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable bullet item component
interface SortableBulletProps {
  id: string;
  bullet: string;
  bulletIdx: number;
  jobIdx: number;
  onUpdate: (value: string) => void;
  onRemove: () => void;
}

function SortableBullet({ id, bullet, bulletIdx, jobIdx, onUpdate, onRemove }: SortableBulletProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-center">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        title="Drag to reorder"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      <span className="text-gray-400">&#8226;</span>
      <input
        type="text"
        value={bullet}
        onChange={(e) => onUpdate(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
      />
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition-colors"
        title="Remove bullet"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (jobIdx: number) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = editableData.work_experience[jobIdx].description.findIndex(
        (_, i) => `bullet-${jobIdx}-${i}` === active.id
      );
      const newIndex = editableData.work_experience[jobIdx].description.findIndex(
        (_, i) => `bullet-${jobIdx}-${i}` === over.id
      );

      const updated = { ...editableData };
      updated.work_experience[jobIdx].description = arrayMove(
        updated.work_experience[jobIdx].description,
        oldIndex,
        newIndex
      );
      setEditableData(updated);
    }
  };

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
              {exp.title}{exp.company ? ` at ${exp.company}` : ''}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd(jobIdx)}
              >
                <SortableContext
                  items={exp.description.map((_, i) => `bullet-${jobIdx}-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {exp.description.map((bullet, bulletIdx) => (
                    <SortableBullet
                      key={`bullet-${jobIdx}-${bulletIdx}`}
                      id={`bullet-${jobIdx}-${bulletIdx}`}
                      bullet={bullet}
                      bulletIdx={bulletIdx}
                      jobIdx={jobIdx}
                      onUpdate={(value) => {
                        const updated = { ...editableData };
                        updated.work_experience[jobIdx].description[bulletIdx] = value;
                        setEditableData(updated);
                      }}
                      onRemove={() => {
                        const updated = { ...editableData };
                        updated.work_experience[jobIdx].description = updated.work_experience[jobIdx].description.filter((_, i) => i !== bulletIdx);
                        setEditableData(updated);
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
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
                                    {/* Plus - accept */}
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                    {/* Minus - regenerate */}
                                    <button
                                      onClick={() => handleBulletFeedback(jobIdx, recIdx, rec, 'down', exp)}
                                      className="p-1.5 rounded-full text-red-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                                      title="Generate a different suggestion"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
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
