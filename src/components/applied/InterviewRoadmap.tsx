"use client";

import { useState } from "react";

interface InterviewRoadmapProps {
  interviews: { interview_1: string | null; interview_2: string | null; interview_3: string | null; interview_4: string | null; interview_5: string | null; };
  onUpdateInterview: (stage: string, status: string | null) => Promise<void>;
}

type InterviewStatus = "pending" | "scheduled" | "completed" | "rejected";

const STAGES = [
  { key: "interview_1", label: "Phone Screen" },
  { key: "interview_2", label: "Technical" },
  { key: "interview_3", label: "Behavioral" },
  { key: "interview_4", label: "Hiring Mgr" },
  { key: "interview_5", label: "Final" },
] as const;

const CHECKLISTS: Record<string, string[]> = {
  interview_1: ["Research company background", "Prepare elevator pitch", "Review job description", "Prepare questions to ask", "Test audio/video"],
  interview_2: ["Review technical concepts", "Practice coding problems", "Prepare work samples", "Review past projects", "Prepare technical questions"],
  interview_3: ["Prepare STAR stories", "Review company values", "Practice conflict examples", "Prepare teamwork stories", "Think about strengths/weaknesses"],
  interview_4: ["Research hiring manager", "Prepare team questions", "Review team structure", "Prepare growth questions", "Think about management style"],
  interview_5: ["Review all interview notes", "Prepare exec questions", "Research company strategy", "Prepare compensation points", "Draft thank-you notes"],
};

export default function InterviewRoadmap({ interviews, onUpdateInterview }: InterviewRoadmapProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Record<string, Set<number>>>({});

  const getStatus = (key: string): InterviewStatus => {
    const value = interviews[key as keyof typeof interviews];
    if (!value) return "pending";
    if (value === "rejected") return "rejected";
    if (value === "scheduled") return "scheduled";
    return "completed";
  };

  const getStatusColor = (status: InterviewStatus): string => {
    switch (status) {
      case "completed": return "bg-green-500 border-green-500";
      case "scheduled": return "bg-yellow-500 border-yellow-500";
      case "rejected": return "bg-red-500 border-red-500";
      default: return "bg-gray-200 border-gray-300";
    }
  };

  const cycleStatus = async (key: string) => {
    const current = getStatus(key);
    let next: string | null;
    switch (current) {
      case "pending": next = "scheduled"; break;
      case "scheduled": next = "completed"; break;
      case "completed": next = "rejected"; break;
      case "rejected": next = null; break;
      default: next = null;
    }
    await onUpdateInterview(key, next);
  };

  const toggleChecklistItem = (stage: string, idx: number) => {
    setCompletedItems(prev => {
      const stageItems = prev[stage] || new Set();
      const newItems = new Set(stageItems);
      if (newItems.has(idx)) newItems.delete(idx);
      else newItems.add(idx);
      return { ...prev, [stage]: newItems };
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Interview Roadmap</h3>
      <div className="relative flex justify-between items-center px-4">
        {STAGES.map((stage, idx) => {
          const status = getStatus(stage.key);
          const isExpanded = expandedStage === stage.key;
          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10">
              {idx < STAGES.length - 1 && (
                <div className={`absolute top-5 left-1/2 h-1 ${status === "completed" ? "bg-green-500" : status === "scheduled" ? "bg-yellow-500" : "bg-gray-200"}`} style={{ width: "calc(100% + 2rem)" }} />
              )}
              <button onClick={() => cycleStatus(stage.key)} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${getStatusColor(status)} ${status === "pending" ? "text-gray-400" : "text-white"} hover:scale-110`} title={`Click to change (${status})`}>
                <span className="text-xs font-bold">{idx + 1}</span>
              </button>
              <span className="text-xs text-gray-600 mt-2 text-center whitespace-nowrap">{stage.label}</span>
              {status === "scheduled" && (
                <button onClick={() => setExpandedStage(isExpanded ? null : stage.key)} className="text-xs text-blue-600 hover:text-blue-800 mt-1">{isExpanded ? "Hide" : "Checklist"}</button>
              )}
            </div>
          );
        })}
      </div>
      {expandedStage && (
        <div className="bg-blue-50 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-gray-900 mb-3">{STAGES.find(s => s.key === expandedStage)?.label} Checklist</h4>
          <div className="space-y-2">
            {CHECKLISTS[expandedStage]?.map((item, idx) => {
              const isChecked = completedItems[expandedStage]?.has(idx) || false;
              return (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isChecked} onChange={() => toggleChecklistItem(expandedStage, idx)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className={isChecked ? "text-gray-400 line-through" : "text-gray-700"}>{item}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
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
