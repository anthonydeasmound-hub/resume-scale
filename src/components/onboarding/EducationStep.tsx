"use client";

import { LinkedInData, Step } from "./types";

interface EducationStepProps {
  editableData: LinkedInData;
  setEditableData: (data: LinkedInData) => void;
  setStep: (step: Step) => void;
}

export default function EducationStep({
  editableData,
  setEditableData,
  setStep,
}: EducationStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Education</h2>
          <p className="text-gray-600 text-sm">Add your educational background</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {editableData.education.map((edu, idx) => (
          <div key={idx} className="p-4 bg-brand-gray rounded-lg relative">
            <button
              onClick={() => {
                const updated = { ...editableData };
                updated.education = updated.education.filter((_, i) => i !== idx);
                setEditableData(updated);
              }}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove education"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">School/University</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.education[idx].institution = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Stanford University"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Degree</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.education[idx].degree = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Bachelor of Science"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Field of Study</label>
                <input
                  type="text"
                  value={edu.field}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.education[idx].field = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Graduation Date</label>
                <input
                  type="text"
                  value={edu.graduation_date}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.education[idx].graduation_date = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="May 2020"
                />
              </div>
            </div>
          </div>
        ))}
        {editableData.education.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No education added yet</p>
        )}
      </div>

      <button
        onClick={() => {
          const updated = { ...editableData };
          updated.education = [...updated.education, { institution: "", degree: "", field: "", graduation_date: "" }];
          setEditableData(updated);
        }}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-brand-blue transition-colors mb-6 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Education
      </button>

      <div className="flex gap-4">
        <button
          onClick={() => setStep("skills")}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep("certifications")}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
