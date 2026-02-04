"use client";

import React, { useState } from "react";

interface TitleSuggestion {
  roleIndex: number;
  currentTitle: string;
  company: string;
  suggestedTitle: string;
  reasoning: string;
  selected: boolean;
}

interface TitleOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: TitleSuggestion[];
  onApply: (suggestions: TitleSuggestion[]) => void;
  targetJobTitle: string;
}

export type { TitleSuggestion };

export default function TitleOptimizationModal({
  isOpen,
  onClose,
  suggestions: initialSuggestions,
  onApply,
  targetJobTitle,
}: TitleOptimizationModalProps) {
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>(initialSuggestions);

  if (!isOpen) return null;

  const toggleSuggestion = (index: number) => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const selectAll = () => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: true })));
  };

  const deselectAll = () => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: false })));
  };

  const selectedCount = suggestions.filter((s) => s.selected).length;

  const handleApply = () => {
    const selected = suggestions.filter((s) => s.selected);
    onApply(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Job Title Suggestions
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Optimize your job titles to better match: <span className="font-medium">{targetJobTitle}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selection controls */}
        <div className="px-6 py-2 border-b border-gray-100 flex items-center gap-4">
          <button onClick={selectAll} className="text-sm text-brand-blue hover:text-brand-blue-dark">
            Select All
          </button>
          <button onClick={deselectAll} className="text-sm text-gray-500 hover:text-gray-700">
            Deselect All
          </button>
        </div>

        {/* Suggestions */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => toggleSuggestion(index)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                suggestion.selected
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    suggestion.selected ? "bg-amber-500" : "bg-gray-200"
                  }`}
                >
                  {suggestion.selected && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">{suggestion.company}</div>

                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Current</div>
                      <div className="font-medium text-gray-700">{suggestion.currentTitle}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <div>
                      <div className="text-xs text-green-600 uppercase tracking-wide">Suggested</div>
                      <div className="font-medium text-green-700">{suggestion.suggestedTitle}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 italic">{suggestion.reasoning}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl">
          <span className="text-sm text-gray-600">
            {selectedCount} title{selectedCount !== 1 ? "s" : ""} will be updated
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={selectedCount === 0}
              className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply {selectedCount} Update{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
