"use client";

import { Step } from "./types";

interface SummaryStepProps {
  summaryOptions: string[];
  selectedSummary: string;
  setSelectedSummary: (summary: string) => void;
  loadingSummary: boolean;
  fetchSummaryOptions: () => void;
  handleSave: () => void;
  setStep: (step: Step) => void;
}

export default function SummaryStep({
  summaryOptions,
  selectedSummary,
  setSelectedSummary,
  loadingSummary,
  fetchSummaryOptions,
  handleSave,
  setStep,
}: SummaryStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Finalize Your Resume</h2>
          <p className="text-gray-600 text-sm">Choose your summary and template</p>
        </div>
      </div>

      <div>
        <div className="space-y-6">
          {/* Summary Section */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Professional Summary</h3>
            {loadingSummary ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <span className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                Generating summary options...
              </div>
            ) : summaryOptions.length > 0 ? (
              <div className="space-y-3">
                {summaryOptions.map((summary, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSummary(summary)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors text-sm ${
                      selectedSummary === summary
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${
                        selectedSummary === summary
                          ? "border-indigo-500 bg-indigo-500"
                          : "border-gray-300"
                      }`}>
                        {selectedSummary === summary && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-gray-700">{summary}</span>
                    </div>
                  </button>
                ))}
                <div className="pt-2">
                  <label className="block text-xs text-gray-500 mb-1">Or edit your summary:</label>
                  <textarea
                    value={selectedSummary}
                    onChange={(e) => setSelectedSummary(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                <p className="mb-2">No summary generated yet.</p>
                <button
                  onClick={fetchSummaryOptions}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Generate summaries
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <p className="text-sm text-gray-500 mt-6 mb-4 text-center">
        You can edit this information anytime in the Master Resume tab.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => setStep("honors")}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={!selectedSummary}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm & Continue
        </button>
      </div>
    </div>
  );
}
