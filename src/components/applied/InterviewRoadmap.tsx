"use client";

import { useState } from "react";

interface InterviewRoadmapProps {
  interviews: {
    interview_1: string | null;
    interview_2: string | null;
    interview_3: string | null;
    interview_4: string | null;
    interview_5: string | null;
  };
  onUpdateInterview: (stage: string, status: string | null) => Promise<void>;
}

type InterviewStatus = "pending" | "scheduled" | "completed" | "rejected";

const STAGES = [
  { key: "interview_1", label: "Phone Screen", icon: "phone" },
  { key: "interview_2", label: "Technical", icon: "code" },
  { key: "interview_3", label: "Behavioral", icon: "chat" },
  { key: "interview_4", label: "Hiring Manager", icon: "user" },
  { key: "interview_5", label: "Final Round", icon: "flag" },
] as const;

const CHECKLISTS: Record<string, string[]> = {
  interview_1: [
    "Research company background",
    "Prepare 2-minute elevator pitch",
    "Review job description highlights",
    "Prepare questions about the role",
    "Test audio/video setup",
  ],
  interview_2: [
    "Review relevant technical concepts",
    "Practice coding problems",
    "Prepare portfolio/work samples",
    "Review past project details",
    "Prepare technical questions to ask",
  ],
  interview_3: [
    "Prepare STAR stories for common questions",
    "Review company values and culture",
    "Practice conflict resolution examples",
    "Prepare leadership/teamwork stories",
    "Think about strengths and weaknesses",
  ],
  interview_4: [
    "Research the hiring manager on LinkedIn",
    "Prepare questions about team dynamics",
    "Review team structure if known",
    "Prepare growth/career path questions",
    "Think about management style preferences",
  ],
  interview_5: [
    "Review all previous interview notes",
    "Prepare executive-level questions",
    "Research company strategy and vision",
    "Prepare salary/compensation talking points",
    "Thank-you notes ready for all interviewers",
  ],
};

export default function InterviewRoadmap({
  interviews,
  onUpdateInterview,
}: InterviewRoadmapProps) {
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
      case "completed":
        return "bg-green-500 border-green-500";
      case "scheduled":
        return "bg-yellow-500 border-yellow-500";
      case "rejected":
        return "bg-red-500 border-red-500";
      default:
        return "bg-gray-200 border-gray-300";
    }
  };

  const getLineColor = (currentIdx: number): string => {
    const currentStatus = getStatus(STAGES[currentIdx].key);
    if (currentStatus === "completed") return "bg-green-500";
    if (currentStatus === "scheduled") return "bg-yellow-500";
    return "bg-gray-200";
  };

  const cycleStatus = async (key: string) => {
    const current = getStatus(key);
    let next: string | null;

    switch (current) {
      case "pending":
        next = "scheduled";
        break;
      case "scheduled":
        next = "completed";
        break;
      case "completed":
        next = "rejected";
        break;
      case "rejected":
        next = null;
        break;
      default:
        next = null;
    }

    await onUpdateInterview(key, next);
  };

  const toggleChecklistItem = (stage: string, idx: number) => {
    setCompletedItems(prev => {
      const stageItems = prev[stage] || new Set();
      const newStageItems = new Set(stageItems);
      if (newStageItems.has(idx)) {
        newStageItems.delete(idx);
      } else {
        newStageItems.add(idx);
      }
      return { ...prev, [stage]: newStageItems };
    });
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case "phone":
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case "code":
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case "chat":
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case "user":
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "flag":
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">Interview Roadmap</h3>

      {/* Timeline */}
      <div className="relative">
        <div className="flex justify-between items-center">
          {STAGES.map((stage, idx) => {
            const status = getStatus(stage.key);
            const isExpanded = expandedStage === stage.key;

            return (
              <div key={stage.key} className="flex flex-col items-center relative z-10">
                {/* Connecting line */}
                {idx < STAGES.length - 1 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-1 ${getLineColor(idx)}`}
                    style={{ width: "calc(100% + 4rem)" }}
                  />
                )}

                {/* Circle */}
                <button
                  onClick={() => cycleStatus(stage.key)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${getStatusColor(status)} ${
                    status === "pending" ? "text-gray-400" : "text-white"
                  } hover:scale-110`}
                  title={`Click to change status (${status})`}
                >
                  {getIcon(stage.icon)}
                </button>

                {/* Label */}
                <span className="text-xs text-gray-600 mt-2 text-center whitespace-nowrap">
                  {stage.label}
                </span>

                {/* Expand button for scheduled interviews */}
                {status === "scheduled" && (
                  <button
                    onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    {isExpanded ? "Hide checklist" : "View checklist"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist for expanded stage */}
      {expandedStage && (
        <div className="bg-blue-50 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-gray-900 mb-3">
            {STAGES.find(s => s.key === expandedStage)?.label} Preparation Checklist
          </h4>
          <div className="space-y-2">
            {CHECKLISTS[expandedStage]?.map((item, idx) => {
              const isChecked = completedItems[expandedStage]?.has(idx) || false;
              return (
                <label
                  key={idx}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleChecklistItem(expandedStage, idx)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={isChecked ? "text-gray-400 line-through" : "text-gray-700"}>
                    {item}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t">
        <span className="text-gray-600">Click circles to change status:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-200"></span>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span>Rejected</span>
        </div>
      </div>
    </div>
  );
}
