"use client";

import { LinkedInData, Step } from "./types";

interface LanguagesStepProps {
  editableData: LinkedInData;
  setEditableData: (data: LinkedInData) => void;
  setStep: (step: Step) => void;
}

export default function LanguagesStep({
  editableData,
  setEditableData,
  setStep,
}: LanguagesStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Languages</h2>
          <p className="text-gray-600 text-sm">Add languages you speak</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {editableData.languages.map((lang, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
            >
              {lang}
              <button
                onClick={() => {
                  const updated = { ...editableData };
                  updated.languages = updated.languages.filter((_, i) => i !== idx);
                  setEditableData(updated);
                }}
                className="text-indigo-500 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {editableData.languages.length === 0 && (
            <p className="text-sm text-gray-400">No languages added yet</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            id="new-language"
            placeholder="Add a language..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  const updated = { ...editableData };
                  updated.languages = [...updated.languages, input.value.trim()];
                  setEditableData(updated);
                  input.value = "";
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById("new-language") as HTMLInputElement;
              if (input.value.trim()) {
                const updated = { ...editableData };
                updated.languages = [...updated.languages, input.value.trim()];
                setEditableData(updated);
                input.value = "";
              }
            }}
            className="px-4 py-2 bg-brand-gold text-gray-900 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep("certifications")}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep("honors")}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
