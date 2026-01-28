"use client";

import { LinkedInData, Step } from "./types";

interface HonorsStepProps {
  editableData: LinkedInData;
  setEditableData: (data: LinkedInData) => void;
  setStep: (step: Step) => void;
}

export default function HonorsStep({
  editableData,
  setEditableData,
  setStep,
}: HonorsStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Honors & Awards</h2>
          <p className="text-gray-600 text-sm">Add your achievements and recognition</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {editableData.honors.map((honor, idx) => (
          <div key={idx} className="p-3 bg-brand-gray rounded-lg relative">
            <button
              onClick={() => {
                const updated = { ...editableData };
                updated.honors = updated.honors.filter((_, i) => i !== idx);
                setEditableData(updated);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 sm:col-span-1">
                <label className="block text-xs text-gray-500 mb-1">Award/Honor</label>
                <input
                  type="text"
                  value={honor.title}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.honors[idx].title = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-500 mb-1">Issuer/Organization</label>
                <input
                  type="text"
                  value={honor.issuer}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.honors[idx].issuer = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input
                  type="text"
                  value={honor.date}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.honors[idx].date = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                  placeholder="e.g., 2023"
                />
              </div>
            </div>
          </div>
        ))}
        {editableData.honors.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No honors or awards added yet</p>
        )}
      </div>

      <button
        onClick={() => {
          const updated = { ...editableData };
          updated.honors = [...updated.honors, { title: "", issuer: "", date: "" }];
          setEditableData(updated);
        }}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-brand-blue transition-colors mb-6"
      >
        + Add Honor/Award
      </button>

      <div className="flex gap-4">
        <button
          onClick={() => setStep("languages")}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep("summary")}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
