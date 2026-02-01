"use client";

import { useState } from "react";

export interface BulletSuggestion {
  roleIndex: number;
  bulletIndex: number;
  roleName: string;
  original: string;
  improved: string;
  selected: boolean;
}

interface BulletOptimizationModalProps {
  suggestions: BulletSuggestion[];
  onApply: (selectedSuggestions: BulletSuggestion[]) => void;
  onClose: () => void;
}

export default function BulletOptimizationModal({
  suggestions,
  onApply,
  onClose,
}: BulletOptimizationModalProps) {
  const [localSuggestions, setLocalSuggestions] = useState<BulletSuggestion[]>(
    suggestions.map(s => ({ ...s, selected: true }))
  );

  const toggleSuggestion = (index: number) => {
    setLocalSuggestions(prev =>
      prev.map((s, i) => (i === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const selectAll = () => {
    setLocalSuggestions(prev => prev.map(s => ({ ...s, selected: true })));
  };

  const deselectAll = () => {
    setLocalSuggestions(prev => prev.map(s => ({ ...s, selected: false })));
  };

  const handleApply = () => {
    const selected = localSuggestions.filter(s => s.selected);
    onApply(selected);
  };

  const selectedCount = localSuggestions.filter(s => s.selected).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              ATS-Optimized Bullet Suggestions
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Review and select which improvements to apply ({selectedCount} of {localSuggestions.length} selected)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selection Controls */}
        <div className="px-6 py-2 border-b bg-gray-50 flex items-center gap-4">
          <button
            onClick={selectAll}
            className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            Deselect All
          </button>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {localSuggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.roleIndex}-${suggestion.bulletIndex}`}
              className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                suggestion.selected
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => toggleSuggestion(index)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  suggestion.selected
                    ? "bg-amber-500 border-amber-500"
                    : "border-gray-300"
                }`}>
                  {suggestion.selected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-2">{suggestion.roleName}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Original:</p>
                      <p className="text-sm text-gray-500 line-through">{suggestion.original}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 mb-0.5">Improved:</p>
                      <p className="text-sm text-gray-900 font-medium">{suggestion.improved}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selectedCount} improvement{selectedCount !== 1 ? 's' : ''} will be applied
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={selectedCount === 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply {selectedCount} Improvement{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
