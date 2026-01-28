"use client";

import { Honor } from "./types";

interface HonorsSectionProps {
  honors: Honor[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof Honor, value: string) => void;
}

export default function HonorsSection({ honors, onAdd, onRemove, onUpdate }: HonorsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Honors & Awards</h2>
        <button
          onClick={onAdd}
          className="text-brand-blue hover:text-brand-blue-dark text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Honor
        </button>
      </div>

      {honors.length === 0 ? (
        <p className="text-gray-500 text-sm">No honors or awards added yet.</p>
      ) : (
        <div className="space-y-3">
          {honors.map((honor, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Honor #{index + 1}</span>
                <button onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={honor.title}
                    onChange={(e) => onUpdate(index, "title", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue text-gray-900"
                    placeholder="Employee of the Year"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Issuer</label>
                  <input
                    type="text"
                    value={honor.issuer}
                    onChange={(e) => onUpdate(index, "issuer", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue text-gray-900"
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                  <input
                    type="text"
                    value={honor.date}
                    onChange={(e) => onUpdate(index, "date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue text-gray-900"
                    placeholder="2023"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
