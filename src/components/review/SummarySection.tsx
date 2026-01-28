"use client";

interface SummarySectionProps {
  expandedSection: "summary" | "experience" | "skills" | null;
  toggleSection: (section: "summary" | "experience" | "skills") => void;
  loadingSummaries: boolean;
  summaryOptions: string[];
  selectedSummaryIndex: number | null;
  editingSummary: boolean;
  editedSummaryText: string;
  onSetEditingSummary: (editing: boolean) => void;
  onSetEditedSummaryText: (text: string) => void;
  onSaveSummaryEdit: (newOptions: string[]) => void;
  onSelectSummary: (index: number) => void;
}

export default function SummarySection({
  expandedSection,
  toggleSection,
  loadingSummaries,
  summaryOptions,
  selectedSummaryIndex,
  editingSummary,
  editedSummaryText,
  onSetEditingSummary,
  onSetEditedSummaryText,
  onSaveSummaryEdit,
  onSelectSummary,
}: SummarySectionProps) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={() => toggleSection("summary")}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
            selectedSummaryIndex !== null ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {selectedSummaryIndex !== null ? "\u2713" : "1"}
          </div>
          <span className="font-medium text-gray-900">Summary</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === "summary" ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expandedSection === "summary" && (
        <div className="px-4 pb-4 border-t">
          {loadingSummaries ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-500">Generating summary options...</p>
            </div>
          ) : (
            <div className="pt-3">
              {/* Selected Summary at top - Editable */}
              {selectedSummaryIndex !== null && summaryOptions[selectedSummaryIndex] && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600">Selected:</p>
                    {!editingSummary && (
                      <button
                        onClick={() => {
                          onSetEditingSummary(true);
                          onSetEditedSummaryText(summaryOptions[selectedSummaryIndex]);
                        }}
                        className="text-xs text-brand-blue hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingSummary ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedSummaryText}
                        onChange={(e) => onSetEditedSummaryText(e.target.value)}
                        className="w-full p-3 rounded-lg border-2 border-blue-500 bg-white text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            onSetEditingSummary(false);
                            onSetEditedSummaryText("");
                          }}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const newOptions = [...summaryOptions];
                            newOptions[selectedSummaryIndex] = editedSummaryText;
                            onSaveSummaryEdit(newOptions);
                            onSetEditingSummary(false);
                            onSetEditedSummaryText("");
                          }}
                          className="px-3 py-1 text-xs bg-brand-gold text-gray-900 rounded hover:bg-brand-gold-dark"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        onSetEditingSummary(true);
                        onSetEditedSummaryText(summaryOptions[selectedSummaryIndex]);
                      }}
                      className="p-3 rounded-lg border-2 border-blue-500 bg-brand-blue-light cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      <p className="text-sm text-gray-700">{summaryOptions[selectedSummaryIndex]}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Alternative summaries below */}
              {summaryOptions.filter((_, idx) => idx !== selectedSummaryIndex).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-purple-600 mb-2">AI Alternatives (click to select):</p>
                  <div className="space-y-2">
                    {summaryOptions.map((summary, idx) => {
                      if (idx === selectedSummaryIndex) return null;
                      return (
                        <div
                          key={idx}
                          onClick={() => onSelectSummary(idx)}
                          className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors"
                        >
                          <p className="text-sm text-gray-700">{summary}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
