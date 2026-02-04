"use client";

import React, { useState, useRef, useEffect } from "react";

type TabType = "resume" | "cover" | "apply" | "job-details" | "contacts" | "emails" | "interview-prep";

interface WorkflowProgressProps {
  jobId: number;
  activeTab: TabType;
  hasResume: boolean;
  hasCoverLetter: boolean;
  hasContact: boolean;
  hasApplicationUrl: boolean;
  status: string;
  onStageClick: (tab: TabType | null, status?: string) => void;
  onCloseJob: (reason: string) => void;
}

interface Stage {
  id: string;
  label: string;
  tab: TabType | null;
  status?: string;
}

interface Task {
  id: string;
  label: string;
  tip: string;
}

const STAGES: Stage[] = [
  { id: "resume", label: "Resume", tab: "resume" },
  { id: "cover", label: "Cover Letter", tab: "cover" },
  { id: "apply", label: "Apply", tab: "apply" },
  { id: "interview", label: "Interview", tab: "interview-prep", status: "interviewing" },
  { id: "accepted", label: "Accepted", tab: null, status: "accepted" },
];

const STAGE_TASKS: Record<string, Task[]> = {
  resume: [
    { id: "generate_resume", label: "Generate tailored resume", tip: "Customize your resume to highlight relevant experience" },
  ],
  cover: [
    { id: "generate_cover", label: "Generate cover letter", tip: "Create a compelling cover letter that tells your story" },
  ],
  apply: [
    { id: "find_contact", label: "Find recruiter or hiring manager", tip: "Having a contact improves your chances of getting noticed" },
    { id: "add_url", label: "Add application URL", tip: "Save the job posting link so you can easily apply" },
    { id: "submit_app", label: "Submit your application", tip: "Use the Apply button to submit and track your application" },
  ],
  interview: [
    { id: "review_guide", label: "Review interview guide", tip: "Prepare answers to common questions for this role" },
    { id: "add_calendar", label: "Add interview to calendar", tip: "Block time and set reminders for your interview" },
    { id: "practice", label: "Practice common questions", tip: "Rehearse your answers out loud to build confidence" },
  ],
  accepted: [],
};

const CLOSE_REASONS = [
  { id: "withdrew", label: "I Withdrew" },
  { id: "not_selected", label: "Not Selected" },
  { id: "no_response", label: "No Response" },
  { id: "archived", label: "Archived" },
  { id: "delete", label: "Delete Job", danger: true },
];

function getCurrentStageIndex(status: string, hasResume: boolean, hasCoverLetter: boolean): number {
  // Stages: 0=Resume, 1=Cover Letter, 2=Apply, 3=Interview, 4=Accepted
  const statusMap: Record<string, number> = {
    bookmarked: 0,
    review: 0,
    draft: 0,
    applied: 3,
    interviewing: 3,
    negotiating: 4, // Maps to Accepted now
    accepted: 4,
  };

  const baseIndex = statusMap[status] ?? 0;

  // If we haven't applied yet, determine stage based on what's been completed
  if (baseIndex < 3) {
    if (hasCoverLetter) return 2; // Move to Apply stage
    if (hasResume) return 1; // Move to Cover Letter stage
    return 0; // Stay on Resume stage
  }

  return baseIndex;
}

function getTaskStorageKey(jobId: number) {
  return `resumegenie_tasks_${jobId}`;
}

function loadCompletedTasks(jobId: number): Set<string> {
  if (typeof window === "undefined") return new Set();
  const stored = localStorage.getItem(getTaskStorageKey(jobId));
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

function saveCompletedTasks(jobId: number, tasks: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getTaskStorageKey(jobId), JSON.stringify([...tasks]));
  // Dispatch custom event for same-tab updates (syncs with ChecklistTab)
  window.dispatchEvent(new CustomEvent("checklist-updated"));
}

// CSS Chevron Component with flexible width
function ChevronSegment({
  label,
  index,
  isFirst,
  isLast,
  isCompleted,
  isCurrent,
  isClickable,
  onClick,
}: {
  label: string;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  isClickable: boolean;
  onClick: () => void;
}) {
  // Colors: Completed = dark blue, Current = light blue, Future = gray
  const bgColor = isCompleted
    ? "bg-[#3D5A80]"
    : isCurrent
    ? "bg-blue-100"
    : "bg-gray-100";

  const textColor = isCompleted
    ? "text-white"
    : isCurrent
    ? "text-[#3D5A80]"
    : "text-gray-500";

  // Clip paths for chevron shape
  // First segment: flat left, arrow right
  // Middle segments: notch left, arrow right
  // Last segment: notch left, flat right
  const clipPath = isFirst
    ? "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)"
    : isLast
    ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)"
    : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)";

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        relative h-9 flex items-center justify-center gap-1.5
        px-4 ${isFirst ? "pl-3" : "pl-5"} ${isLast ? "pr-3" : "pr-4"}
        ${bgColor} ${textColor}
        text-xs font-medium whitespace-nowrap
        transition-all duration-150
        ${isClickable ? "cursor-pointer hover:brightness-95" : "cursor-default"}
        ${!isClickable && !isCompleted && !isCurrent ? "opacity-60" : ""}
      `}
      style={{
        clipPath,
        marginLeft: isFirst ? 0 : -6,
        zIndex: index + 1, // Later segments on top for proper click targeting
      }}
    >
      {/* Checkmark for completed stages */}
      {isCompleted && (
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}

export default function WorkflowProgress({
  jobId,
  activeTab,
  hasResume,
  hasCoverLetter,
  hasContact,
  hasApplicationUrl,
  status,
  onStageClick,
  onCloseJob,
}: WorkflowProgressProps) {
  const [showCloseMenu, setShowCloseMenu] = useState(false);
  const [guidanceExpanded, setGuidanceExpanded] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const closeMenuRef = useRef<HTMLDivElement>(null);

  const currentStageIndex = getCurrentStageIndex(status, hasResume, hasCoverLetter);
  const currentStage = STAGES[currentStageIndex];
  const currentTasks = STAGE_TASKS[currentStage.id] || [];

  useEffect(() => {
    setCompletedTasks(loadCompletedTasks(jobId));
  }, [jobId]);

  // Listen for storage changes from other components (e.g., ChecklistTab)
  useEffect(() => {
    const handleCustomEvent = () => {
      setCompletedTasks(loadCompletedTasks(jobId));
    };

    window.addEventListener("checklist-updated", handleCustomEvent);

    return () => {
      window.removeEventListener("checklist-updated", handleCustomEvent);
    };
  }, [jobId]);

  useEffect(() => {
    const autoCompleted = new Set(completedTasks);
    let changed = false;

    if (hasResume && !autoCompleted.has("generate_resume")) {
      autoCompleted.add("generate_resume");
      changed = true;
    }
    if (hasCoverLetter && !autoCompleted.has("generate_cover")) {
      autoCompleted.add("generate_cover");
      changed = true;
    }
    if (hasContact && !autoCompleted.has("find_contact")) {
      autoCompleted.add("find_contact");
      changed = true;
    }
    if (hasApplicationUrl && !autoCompleted.has("add_url")) {
      autoCompleted.add("add_url");
      changed = true;
    }
    if (status === "applied" || status === "interviewing" || status === "negotiating" || status === "accepted") {
      if (!autoCompleted.has("submit_app")) {
        autoCompleted.add("submit_app");
        changed = true;
      }
    }

    if (changed) {
      setCompletedTasks(autoCompleted);
      saveCompletedTasks(jobId, autoCompleted);
    }
  }, [hasResume, hasCoverLetter, hasContact, hasApplicationUrl, status, jobId, completedTasks]);

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
    // Trigger confetti when Apply stage is clicked
    if (stage.id === "apply" && typeof window !== "undefined") {
      import("canvas-confetti").then((confettiModule) => {
        const confetti = confettiModule.default;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      });
    }

    // All stages are clickable
    if (stage.tab) {
      onStageClick(stage.tab);
    } else if (stage.status) {
      onStageClick(null, stage.status);
    }
  };

  // Explicit mapping of activeTab to stage index for highlighting
  const TAB_TO_STAGE_INDEX: Record<string, number> = {
    "resume": 0,
    "cover": 1,
    "apply": 2,
    "interview-prep": 3,
  };

  // Determine which stage to highlight based on active tab
  const getActiveStageIndex = (): number => {
    // Accepted status takes priority - always show Accepted stage as active
    if (status === "negotiating" || status === "accepted") return 4;

    // Direct tab mapping
    if (activeTab in TAB_TO_STAGE_INDEX) {
      return TAB_TO_STAGE_INDEX[activeTab];
    }
    // For other tabs (job-details, contacts, emails), use workflow progress
    return currentStageIndex;
  };
  const activeStageIndex = getActiveStageIndex();

  const toggleTask = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
    saveCompletedTasks(jobId, newCompleted);
  };

  // Use active stage (what user is viewing) for Guidance section
  const activeStage = STAGES[activeStageIndex];
  const activeTasks = STAGE_TASKS[activeStage.id] || [];

  const completedCount = activeTasks.filter(t => completedTasks.has(t.id)).length;
  const completionPercent = activeTasks.length > 0
    ? Math.round((completedCount / activeTasks.length) * 100)
    : 100;

  return (
    <div className="space-y-3">
      {/* Progress Bar with CSS Chevrons */}
      <div className="flex items-center gap-4">
        <div className="flex items-center relative">
          {STAGES.map((stage, index) => {
            // Stages to the left of active tab are "completed" (full blue)
            // Active tab is "current" (light blue)
            // Stages to the right are future (gray)
            const isCompleted = index < activeStageIndex;
            const isCurrent = index === activeStageIndex;
            const isFirst = index === 0;
            const isLast = index === STAGES.length - 1;

            return (
              <ChevronSegment
                key={stage.id}
                label={stage.label}
                index={index}
                isFirst={isFirst}
                isLast={isLast}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                isClickable={true}
                onClick={() => handleStageClick(stage)}
              />
            );
          })}
        </div>

        {/* Close Job button */}
        <div className="relative flex-shrink-0" ref={closeMenuRef}>
          <button
            onClick={() => setShowCloseMenu(!showCloseMenu)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg whitespace-nowrap"
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

      {/* Guidance Section */}
      {activeTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          {/* Guidance Header */}
          <button
            onClick={() => setGuidanceExpanded(!guidanceExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-medium text-gray-700">Guidance</span>
              <span className="text-gray-400 mx-1">&gt;</span>
              <span className="text-gray-600">
                {activeStage.label} Steps: {completionPercent}% Complete
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${guidanceExpanded ? "" : "-rotate-90"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Guidance Content */}
          {guidanceExpanded && (
            <div className="px-4 pb-4">
              <div className="flex gap-6">
                {/* Task Checklist */}
                <div className="space-y-1 flex-shrink-0 min-w-[280px]">
                  {activeTasks.map((task) => {
                    const isChecked = completedTasks.has(task.id);
                    const isSelected = selectedTask === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedTask(isSelected ? null : task.id)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id);
                          }}
                          className={`
                            w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors
                            ${isChecked
                              ? "bg-brand-gold border-brand-gold"
                              : "border-gray-300 hover:border-brand-gold"
                            }
                          `}
                        >
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <span className={`text-sm ${isChecked ? "text-gray-400 line-through" : "text-gray-700"}`}>
                          {task.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Tips Panel */}
                {selectedTask && (
                  <div className="flex-1 pl-6 border-l border-gray-200 flex items-start pt-2">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>{activeTasks.find(t => t.id === selectedTask)?.tip}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
