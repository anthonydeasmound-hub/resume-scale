"use client";

import { LinkedInData, Step } from "./types";

interface CertificationsStepProps {
  editableData: LinkedInData;
  setEditableData: (data: LinkedInData) => void;
  setStep: (step: Step) => void;
}

export default function CertificationsStep({
  editableData,
  setEditableData,
  setStep,
}: CertificationsStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Certifications</h2>
          <p className="text-gray-600 text-sm">Add your professional certifications</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {editableData.certifications.map((cert, idx) => (
          <div key={idx} className="p-3 bg-brand-gray rounded-lg relative">
            <button
              onClick={() => {
                const updated = { ...editableData };
                updated.certifications = updated.certifications.filter((_, i) => i !== idx);
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
                <label className="block text-xs text-gray-500 mb-1">Certification Name</label>
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.certifications[idx].name = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-gray-500 mb-1">Issuer</label>
                <input
                  type="text"
                  value={cert.issuer}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.certifications[idx].issuer = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                  placeholder="e.g., AWS, Google"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input
                  type="text"
                  value={cert.date}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.certifications[idx].date = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                  placeholder="e.g., 2023"
                />
              </div>
            </div>
          </div>
        ))}
        {editableData.certifications.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No certifications added yet</p>
        )}
      </div>

      <button
        onClick={() => {
          const updated = { ...editableData };
          updated.certifications = [...updated.certifications, { name: "", issuer: "", date: "" }];
          setEditableData(updated);
        }}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-brand-blue transition-colors mb-6"
      >
        + Add Certification
      </button>

      <div className="flex gap-4">
        <button
          onClick={() => setStep("education")}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep("languages")}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
