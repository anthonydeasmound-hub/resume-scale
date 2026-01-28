"use client";

import { useState, useEffect } from "react";
import { InterviewStage, StageType, StageStatus } from "@/lib/db";

interface InterviewRoadmapProps {
  jobId: number;
  // Legacy props for backwards compatibility
  interviews?: { interview_1: string | null; interview_2: string | null; interview_3: string | null; interview_4: string | null; interview_5: string | null; };
  onUpdateInterview?: (stage: string, status: string | null) => Promise<void>;
}

const STAGE_TYPE_LABELS: Record<StageType, string> = {
  phone_screen: "Phone Screen",
  technical: "Technical",
  behavioral: "Behavioral",
  hiring_manager: "Hiring Mgr",
  final: "Final",
  onsite: "Onsite",
  panel: "Panel",
  take_home: "Take Home",
  other: "Interview",
};

const CHECKLISTS: Record<StageType, string[]> = {
  phone_screen: ["Research company background", "Prepare elevator pitch", "Review job description", "Prepare questions to ask", "Test audio/video"],
  technical: ["Review technical concepts", "Practice coding problems", "Prepare work samples", "Review past projects", "Prepare technical questions"],
  behavioral: ["Prepare STAR stories", "Review company values", "Practice conflict examples", "Prepare teamwork stories", "Think about strengths/weaknesses"],
  hiring_manager: ["Research hiring manager", "Prepare team questions", "Review team structure", "Prepare growth questions", "Think about management style"],
  final: ["Review all interview notes", "Prepare exec questions", "Research company strategy", "Prepare compensation points", "Draft thank-you notes"],
  onsite: ["Plan arrival time", "Bring copies of resume", "Dress appropriately", "Prepare for multiple interviews", "Research all interviewers"],
  panel: ["Research panel members", "Prepare for rapid questions", "Have diverse examples ready", "Make eye contact with all", "Follow up with each person"],
  take_home: ["Read instructions carefully", "Plan time allocation", "Ask clarifying questions", "Test thoroughly", "Document your approach"],
  other: ["Research the format", "Prepare relevant materials", "Review job requirements", "Prepare questions to ask", "Get good rest beforehand"],
};

const STAGE_TYPES: StageType[] = ['phone_screen', 'technical', 'behavioral', 'hiring_manager', 'final', 'onsite', 'panel', 'take_home', 'other'];

export default function InterviewRoadmap({ jobId, interviews, onUpdateInterview }: InterviewRoadmapProps) {
  const [stages, setStages] = useState<InterviewStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [completedItems, setCompletedItems] = useState<Record<number, Set<number>>>({});
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageType, setNewStageType] = useState<StageType>('phone_screen');
  const [newStageName, setNewStageName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStages();
  }, [jobId]);

  const fetchStages = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/jobs/${jobId}/stages`);
      if (response.ok) {
        const data = await response.json();
        setStages(data);
      } else {
        setError("Failed to load interview stages.");
      }
    } catch (err) {
      console.error("Failed to fetch stages:", err);
      setError("Failed to load interview stages.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: StageStatus): string => {
    switch (status) {
      case "completed": return "bg-green-500 border-green-500";
      case "scheduled": return "bg-yellow-500 border-yellow-500";
      case "rejected": return "bg-red-500 border-red-500";
      case "cancelled": return "bg-gray-400 border-gray-400";
      default: return "bg-gray-200 border-gray-300";
    }
  };

  const getLineColor = (status: StageStatus): string => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "scheduled": return "bg-yellow-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-200";
    }
  };

  const cycleStatus = async (stageId: number, currentStatus: StageStatus) => {
    const statusOrder: StageStatus[] = ['pending', 'scheduled', 'completed', 'rejected'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    try {
      const response = await fetch(`/api/jobs/${jobId}/stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.ok) {
        await fetchStages();
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
      setError("Failed to update stage status.");
    }
  };

  const addStage = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/jobs/${jobId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_type: newStageType,
          stage_name: newStageName || undefined,
        }),
      });

      if (response.ok) {
        await fetchStages();
        setShowAddStage(false);
        setNewStageType('phone_screen');
        setNewStageName('');
      } else {
        setError("Failed to add interview stage.");
      }
    } catch (err) {
      console.error("Failed to add stage:", err);
      setError("Failed to add interview stage.");
    }
  };

  const deleteStage = async (stageId: number) => {
    if (!confirm('Are you sure you want to delete this interview stage?')) return;

    try {
      setError(null);
      const response = await fetch(`/api/jobs/${jobId}/stages/${stageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchStages();
      } else {
        setError("Failed to delete interview stage.");
      }
    } catch (err) {
      console.error("Failed to delete stage:", err);
      setError("Failed to delete interview stage.");
    }
  };

  const toggleChecklistItem = (stageId: number, idx: number) => {
    setCompletedItems(prev => {
      const stageItems = prev[stageId] || new Set();
      const newItems = new Set(stageItems);
      if (newItems.has(idx)) newItems.delete(idx);
      else newItems.add(idx);
      return { ...prev, [stageId]: newItems };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">&times;</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Interview Roadmap</h3>
        <button
          onClick={() => setShowAddStage(!showAddStage)}
          className="text-sm text-brand-blue hover:text-blue-800 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Stage
        </button>
      </div>

      {/* Add Stage Form */}
      {showAddStage && (
        <div className="bg-brand-blue-light rounded-lg p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Interview Type</label>
              <select
                value={newStageType}
                onChange={(e) => setNewStageType(e.target.value as StageType)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {STAGE_TYPES.map(type => (
                  <option key={type} value={type}>{STAGE_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Custom Name (optional)</label>
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g., Technical Round 2"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddStage(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={addStage}
              className="px-3 py-1.5 text-sm bg-brand-gold text-gray-900 rounded hover:bg-brand-gold-dark"
            >
              Add Stage
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {stages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No interview stages yet.</p>
          <p className="text-xs mt-1">Add stages manually or they'll be created automatically from emails.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="flex justify-between items-start px-4">
            {stages.map((stage, idx) => {
              const isExpanded = expandedStage === stage.id;
              const checklist = CHECKLISTS[stage.stage_type as StageType] || CHECKLISTS.other;

              return (
                <div key={stage.id} className="flex flex-col items-center relative z-10 flex-1">
                  {/* Connecting line */}
                  {idx < stages.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 h-1 ${getLineColor(stage.status as StageStatus)}`}
                      style={{ width: "calc(100% - 1rem)" }}
                    />
                  )}

                  {/* Stage circle */}
                  <button
                    onClick={() => cycleStatus(stage.id, stage.status as StageStatus)}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${getStatusColor(stage.status as StageStatus)} ${stage.status === "pending" ? "text-gray-400" : "text-white"} hover:scale-110`}
                    title={`Click to change status (${stage.status})`}
                  >
                    <span className="text-xs font-bold">{stage.stage_number}</span>
                  </button>

                  {/* Stage label */}
                  <span className="text-xs text-gray-600 mt-2 text-center whitespace-nowrap">
                    {stage.stage_name || STAGE_TYPE_LABELS[stage.stage_type as StageType]}
                  </span>

                  {/* Scheduled time */}
                  {stage.scheduled_at && (
                    <span className="text-xs text-brand-blue mt-1">
                      {new Date(stage.scheduled_at).toLocaleDateString()}
                    </span>
                  )}

                  {/* Checklist toggle */}
                  {stage.status === "scheduled" && (
                    <button
                      onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                      className="text-xs text-brand-blue hover:text-blue-800 mt-1"
                    >
                      {isExpanded ? "Hide" : "Checklist"}
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => deleteStage(stage.id)}
                    className="text-xs text-red-500 hover:text-red-700 mt-1 opacity-50 hover:opacity-100"
                    title="Delete stage"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Expanded Checklist */}
          {expandedStage && (
            <div className="bg-brand-blue-light rounded-lg p-4 mt-4">
              {(() => {
                const stage = stages.find(s => s.id === expandedStage);
                if (!stage) return null;
                const checklist = CHECKLISTS[stage.stage_type as StageType] || CHECKLISTS.other;

                return (
                  <>
                    <h4 className="font-medium text-gray-900 mb-3">
                      {stage.stage_name || STAGE_TYPE_LABELS[stage.stage_type as StageType]} Checklist
                    </h4>
                    <div className="space-y-2">
                      {checklist.map((item, idx) => {
                        const isChecked = completedItems[expandedStage]?.has(idx) || false;
                        return (
                          <label key={idx} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleChecklistItem(expandedStage, idx)}
                              className="w-4 h-4 text-brand-blue rounded"
                            />
                            <span className={isChecked ? "text-gray-400 line-through" : "text-gray-700"}>
                              {item}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t">
        <span className="text-gray-600">Click circles to change:</span>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200"></span><span>Pending</span></div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span><span>Scheduled</span></div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span><span>Completed</span></div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span><span>Rejected</span></div>
      </div>
    </div>
  );
}
