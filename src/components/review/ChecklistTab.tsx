"use client";

import React, { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  label: string;
  tip: string;
  autoComplete?: boolean;
}

interface ChecklistTabProps {
  jobId: number;
  hasResume: boolean;
  hasCoverLetter: boolean;
  hasContact: boolean;
  hasApplicationUrl: boolean;
  status: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "review_job",
    label: "Review job description",
    tip: "Understand the key requirements and responsibilities",
  },
  {
    id: "generate_resume",
    label: "Generate tailored resume",
    tip: "Customize your resume to highlight relevant experience",
    autoComplete: true,
  },
  {
    id: "generate_cover",
    label: "Generate cover letter",
    tip: "Create a compelling cover letter that tells your story",
    autoComplete: true,
  },
  {
    id: "find_contact",
    label: "Find recruiter or hiring manager",
    tip: "Having a contact improves your chances of getting noticed",
    autoComplete: true,
  },
  {
    id: "research_company",
    label: "Research the company",
    tip: "Learn about their culture, products, and recent news",
  },
  {
    id: "add_url",
    label: "Add application URL",
    tip: "Save the job posting link so you can easily apply",
    autoComplete: true,
  },
  {
    id: "submit_app",
    label: "Submit your application",
    tip: "Use the Apply button to submit and track your application",
    autoComplete: true,
  },
  {
    id: "review_guide",
    label: "Review interview guide",
    tip: "Prepare answers to common questions for this role",
  },
  {
    id: "add_calendar",
    label: "Add interview to calendar",
    tip: "Block time and set reminders for your interview",
  },
  {
    id: "practice",
    label: "Practice common questions",
    tip: "Rehearse your answers out loud to build confidence",
  },
  {
    id: "send_followup",
    label: "Send follow-up email",
    tip: "Follow up 1-2 weeks after applying if you haven't heard back",
  },
];

function getStorageKey(jobId: number) {
  // Use same key as WorkflowProgress to keep them in sync
  return `resumegenie_tasks_${jobId}`;
}

function loadCompletedItems(jobId: number): Set<string> {
  if (typeof window === "undefined") return new Set();
  const stored = localStorage.getItem(getStorageKey(jobId));
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

function saveCompletedItems(jobId: number, items: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(jobId), JSON.stringify([...items]));
  // Dispatch custom event for same-tab updates
  window.dispatchEvent(new CustomEvent("checklist-updated"));
}

export default function ChecklistTab({
  jobId,
  hasResume,
  hasCoverLetter,
  hasContact,
  hasApplicationUrl,
  status,
}: ChecklistTabProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    setCompletedItems(loadCompletedItems(jobId));
  }, [jobId]);

  // Listen for storage changes from other components (e.g., WorkflowProgress)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey(jobId)) {
        setCompletedItems(loadCompletedItems(jobId));
      }
    };

    // Also listen for custom event for same-tab updates
    const handleCustomEvent = () => {
      setCompletedItems(loadCompletedItems(jobId));
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("checklist-updated", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("checklist-updated", handleCustomEvent);
    };
  }, [jobId]);

  // Auto-complete items based on job state
  useEffect(() => {
    const autoCompleted = new Set(completedItems);
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
    if (["applied", "interviewing", "negotiating", "accepted"].includes(status)) {
      if (!autoCompleted.has("submit_app")) {
        autoCompleted.add("submit_app");
        changed = true;
      }
    }

    if (changed) {
      setCompletedItems(autoCompleted);
      saveCompletedItems(jobId, autoCompleted);
    }
  }, [hasResume, hasCoverLetter, hasContact, hasApplicationUrl, status, jobId, completedItems]);

  const toggleItem = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
    saveCompletedItems(jobId, newCompleted);
  };

  const completedCount = CHECKLIST_ITEMS.filter((item) => completedItems.has(item.id)).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Application Checklist</h3>
        <span className="text-sm font-medium text-gray-600">
          {completedCount}/{CHECKLIST_ITEMS.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="flex gap-6">
        <div className="flex-1 space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = completedItems.has(item.id);
            const isSelected = selectedItem === item.id;

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedItem(isSelected ? null : item.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(item.id);
                  }}
                  className={`
                    w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors
                    ${isChecked
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300 hover:border-green-400"
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
                  {item.label}
                </span>
                {item.autoComplete && !isChecked && (
                  <span className="ml-auto text-xs text-gray-400">auto</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Tip panel */}
        {selectedItem && (
          <div className="w-64 flex-shrink-0 pl-6 border-l border-gray-200">
            <div className="sticky top-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tip</h4>
              <p className="text-sm text-gray-600">
                {CHECKLIST_ITEMS.find((item) => item.id === selectedItem)?.tip}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
