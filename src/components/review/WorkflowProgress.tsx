"use client";

import React, { useState, useRef, useEffect } from "react";

type TabType = "resume" | "cover" | "apply" | "job-details" | "contacts" | "emails" | "interview-prep";

interface WorkflowProgressProps {
  activeTab: TabType;
  hasResume: boolean;
  hasCoverLetter: boolean;
  status: string;
  onStageClick: (tab: TabType | null, status?: string) => void;
  onCloseJob: (reason: string) => void;
}

interface Stage {
  id: string;
  label: string;
  shortLabel?: string;
  tab: TabType | null;
  status?: string;
}

const STAGES: Stage[] = [
  { id: "resume", label: "Resume", tab: "resume" },
  { id: "cover", label: "Cover Letter", shortLabel: "Cover", tab: "cover" },
  { id: "apply", label: "Apply", tab: "apply" },
  { id: "interview", label: "Interview", tab: "interview-prep", status: "interviewing" },
  { id: "negotiation", label: "Negotiation", shortLabel: "Negotiate", tab: null, status: "negotiating" },
  { id: "accepted", label: "Accepted", tab: null, status: "accepted" },
];

const CLOSE_REASONS = [
  { id: "withdrew", label: "I Withdrew" },
  { id: "not_selected", label: "Not Selected" },
  { id: "no_response", label: "No Response" },
  { id: "archived", label: "Archived" },
  { id: "delete", label: "Delete Job", danger: true },
];

function getStageState(
  stageId: string,
  activeTab: TabType,
  hasResume: boolean,
  hasCoverLetter: boolean,
  status: string
): "active" | "complete" | "default" {
  const statusOrder = ["bookmarked", "review", "draft", "applied", "interviewing", "negotiating", "accepted"];
  const currentStatusIndex = statusOrder.indexOf(status);

  // Check if this stage is the active tab
  const stage = STAGES.find(s => s.id === stageId);
  if (stage?.tab === activeTab) return "active";
  if (stage?.status && stage.status === status) return "active";

  // Check completion
  switch (stageId) {
    case "resume":
      if (hasResume) return "complete";
      break;
    case "cover":
      if (hasCoverLetter) return "complete";
      break;
    case "apply":
      if (currentStatusIndex >= statusOrder.indexOf("applied")) return "complete";
      break;
    case "interview":
      if (currentStatusIndex > statusOrder.indexOf("interviewing")) return "complete";
      break;
    case "negotiation":
      if (currentStatusIndex > statusOrder.indexOf("negotiating")) return "complete";
      break;
    case "accepted":
      if (status === "accepted") return "complete";
      break;
  }

  return "default";
}

export default function WorkflowProgress({
  activeTab,
  hasResume,
  hasCoverLetter,
  status,
  onStageClick,
  onCloseJob,
}: WorkflowProgressProps) {
  const [showCloseMenu, setShowCloseMenu] = useState(false);
  const closeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (closeMenuRef.current && !closeMenuRef.current.contains(event.target as Node)) {
        setShowCloseMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStageClick = (stage: Stage) => {
    if (stage.tab) {
      onStageClick(stage.tab);
    } else if (stage.status) {
      onStageClick(null, stage.status);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Segmented Control Container */}
      <div className="inline-flex bg-gray-100 rounded-lg p-1 shadow-inner">
        {STAGES.map((stage) => {
          const state = getStageState(stage.id, activeTab, hasResume, hasCoverLetter, status);

          return (
            <button
              key={stage.id}
              onClick={() => handleStageClick(stage)}
              className={`
                relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out
                min-w-[90px] text-center
                ${state === "active"
                  ? "bg-white text-gray-900 shadow-sm"
                  : state === "complete"
                  ? "text-brand-blue hover:bg-white/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                }
              `}
            >
              {/* Completion dot for completed stages */}
              {state === "complete" && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
              )}
              <span className="hidden sm:inline">{stage.label}</span>
              <span className="sm:hidden">{stage.shortLabel || stage.label}</span>
            </button>
          );
        })}
      </div>

      {/* Close Job button */}
      <div className="relative" ref={closeMenuRef}>
        <button
          onClick={() => setShowCloseMenu(!showCloseMenu)}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg whitespace-nowrap"
        >
          Close Job
        </button>

        {showCloseMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-40 z-50">
            {CLOSE_REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => {
                  onCloseJob(reason.id);
                  setShowCloseMenu(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  reason.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"
                }`}
              >
                {reason.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
