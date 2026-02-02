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
  { id: "bookmarked", label: "Bookmarked", tab: "resume" },
  { id: "applying", label: "Applying", tab: "resume" },
  { id: "applied", label: "Applied", tab: "apply" },
  { id: "interviewing", label: "Interviewing", tab: "interview-prep", status: "interviewing" },
  { id: "negotiating", label: "Negotiating", tab: null, status: "negotiating" },
  { id: "accepted", label: "Accepted", tab: null, status: "accepted" },
];

const STAGE_TASKS: Record<string, Task[]> = {
  bookmarked: [
    { id: "review_job", label: "Review job requirements", tip: "Check the job description to understand what they're looking for" },
    { id: "rate_interest", label: "Rate your interest level", tip: "Use the stars to prioritize which jobs to focus on" },
    { id: "check_skills", label: "Check skill alignment", tip: "Compare your skills to the required qualifications" },
  ],
  applying: [
    { id: "generate_resume", label: "Generate tailored resume", tip: "Customize your resume to highlight relevant experience" },
    { id: "generate_cover", label: "Generate cover letter", tip: "Create a compelling cover letter that tells your story" },
    { id: "find_contact", label: "Find recruiter or hiring manager", tip: "Having a contact improves your chances of getting noticed" },
    { id: "add_url", label: "Add application URL", tip: "Save the job posting link so you can easily apply" },
  ],
  applied: [
    { id: "submit_app", label: "Submit your application", tip: "Use the Apply button to submit and track your application" },
    { id: "setup_followups", label: "Set up follow-up emails", tip: "Automated follow-ups keep you top of mind" },
  ],
  interviewing: [
    { id: "review_guide", label: "Review interview guide", tip: "Prepare answers to common questions for this role" },
    { id: "add_calendar", label: "Add interview to calendar", tip: "Block time and set reminders for your interview" },
    { id: "practice", label: "Practice common questions", tip: "Rehearse your answers out loud to build confidence" },
  ],
  negotiating: [
    { id: "research_salary", label: "Research salary data", tip: "Know the market rate for this position and location" },
    { id: "prepare_points", label: "Prepare negotiation talking points", tip: "List your achievements and unique value to justify your ask" },
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
  const statusMap: Record<string, number> = {
    bookmarked: 0,
    review: 1,
    draft: 1,
    applied: 2,
    interviewing: 3,
    negotiating: 4,
    accepted: 5,
  };

  const statusIndex = statusMap[status] ?? 0;

  if (statusIndex < 1 && (hasResume || hasCoverLetter)) {
    return 1;
  }

  return statusIndex;
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
}

// SVG Chevron Component
function ChevronSegment({
  label,
  isFirst,
  isLast,
  isCompleted,
  isCurrent,
  isClickable,
  onClick,
}: {
  label: string;
  isFirst: boolean;
  isLast: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  isClickable: boolean;
  onClick: () => void;
}) {
  const width = 100;
  const height = 36;
  const arrowWidth = 10;

  // Colors - completed is darkest, current is slightly lighter, future is gray
  const fillColor = isCompleted ? "#3D5A80" : isCurrent ? "#5A7A9A" : "#e5e7eb";
  const textColor = isCompleted || isCurrent ? "white" : "#6b7280";

  // Build the SVG path
  let path: string;

  if (isFirst) {
    // First segment: rounded left, arrow right
    path = `
      M 4 0
      L ${width - arrowWidth} 0
      L ${width} ${height / 2}
      L ${width - arrowWidth} ${height}
      L 4 ${height}
      Q 0 ${height} 0 ${height - 4}
      L 0 4
      Q 0 0 4 0
      Z
    `;
  } else if (isLast) {
    // Last segment: notch left, rounded right
    path = `
      M 0 0
      L ${width - 4} 0
      Q ${width} 0 ${width} 4
      L ${width} ${height - 4}
      Q ${width} ${height} ${width - 4} ${height}
      L 0 ${height}
      L ${arrowWidth} ${height / 2}
      Z
    `;
  } else {
    // Middle segment: notch left, arrow right
    path = `
      M 0 0
      L ${width - arrowWidth} 0
      L ${width} ${height / 2}
      L ${width - arrowWidth} ${height}
      L 0 ${height}
      L ${arrowWidth} ${height / 2}
      Z
    `;
  }

  // Shorter labels for compact display
  const shortLabel = label === "Bookmarked" ? "Saved"
    : label === "Interviewing" ? "Interview"
    : label === "Negotiating" ? "Negotiate"
    : label;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`relative flex-shrink-0 ${isClickable ? "cursor-pointer hover:opacity-90" : "cursor-not-allowed opacity-60"}`}
      style={{ marginLeft: isFirst ? 0 : -1 }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        <path d={path} fill={fillColor} />

        {/* Checkmark for completed stages */}
        {isCompleted && (
          <g transform={`translate(${isFirst ? 12 : 18}, ${height / 2 - 5})`}>
            <polyline
              points="0,5 3,8 10,1"
              fill="none"
              stroke={textColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Label */}
        <text
          x={isFirst ? (isCompleted ? 28 : 12) : (isCompleted ? 34 : 18)}
          y={height / 2}
          dy="0.35em"
          fill={textColor}
          fontSize="11"
          fontWeight="500"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {shortLabel}
        </text>
      </svg>
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

  const handleStageClick = (stage: Stage, index: number) => {
    if (index <= currentStageIndex || index === currentStageIndex + 1) {
      if (stage.tab) {
        onStageClick(stage.tab);
      } else if (stage.status) {
        onStageClick(null, stage.status);
      }
    }
  };

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

  const completedCount = currentTasks.filter(t => completedTasks.has(t.id)).length;
  const completionPercent = currentTasks.length > 0
    ? Math.round((completedCount / currentTasks.length) * 100)
    : 100;

  return (
    <div className="space-y-3">
      {/* Progress Bar with SVG Chevrons */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          {STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isClickable = index <= currentStageIndex + 1;
            const isFirst = index === 0;
            const isLast = index === STAGES.length - 1;

            return (
              <ChevronSegment
                key={stage.id}
                label={stage.label}
                isFirst={isFirst}
                isLast={isLast}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                isClickable={isClickable}
                onClick={() => handleStageClick(stage, index)}
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
      {currentTasks.length > 0 && (
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
                {currentStage.label} Steps: {completionPercent}% Complete
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
                  {currentTasks.map((task) => {
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
                      <li>{currentTasks.find(t => t.id === selectedTask)?.tip}</li>
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
