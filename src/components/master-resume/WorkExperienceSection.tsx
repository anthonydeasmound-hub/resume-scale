"use client";

import { WorkExperience } from "./types";

interface WorkExperienceSectionProps {
  workExperience: WorkExperience[];
  expandedJobs: Set<number>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof WorkExperience, value: string | string[]) => void;
  onToggleExpanded: (index: number) => void;
  onAddBullet: (jobIndex: number) => void;
  onUpdateBullet: (jobIndex: number, bulletIndex: number, value: string) => void;
  onRemoveBullet: (jobIndex: number, bulletIndex: number) => void;
}

export default function WorkExperienceSection({
  workExperience,
  expandedJobs,
  onAdd,
  onRemove,
  onUpdate,
  onToggleExpanded,
  onAddBullet,
  onUpdateBullet,
  onRemoveBullet,
}: WorkExperienceSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Work Experience</h2>
        <button
          onClick={onAdd}
          className="text-brand-blue hover:text-brand-blue-dark text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Position
        </button>
      </div>

      {workExperience.length === 0 ? (
        <p className="text-gray-500 text-sm">No work experience added yet.</p>
      ) : (
        <div className="space-y-4">
          {workExperience.map((job, jobIndex) => (
            <div key={jobIndex} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Job Header */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                onClick={() => onToggleExpanded(jobIndex)}
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {job.title || "Untitled Position"} {job.company && `at ${job.company}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {job.start_date || "Start"} - {job.end_date || "Present"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(jobIndex);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedJobs.has(jobIndex) ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Job Details (Expanded) */}
              {expandedJobs.has(jobIndex) && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={job.title}
                        onChange={(e) => onUpdate(jobIndex, "title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-gray-900"
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
                      <input
                        type="text"
                        value={job.company}
                        onChange={(e) => onUpdate(jobIndex, "company", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-gray-900"
                        placeholder="Acme Inc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                      <input
                        type="text"
                        value={job.start_date}
                        onChange={(e) => onUpdate(jobIndex, "start_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-gray-900"
                        placeholder="Jan 2020"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                      <input
                        type="text"
                        value={job.end_date}
                        onChange={(e) => onUpdate(jobIndex, "end_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-gray-900"
                        placeholder="Present"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-600">Achievements / Responsibilities</label>
                      <button
                        onClick={() => onAddBullet(jobIndex)}
                        className="text-brand-blue hover:text-brand-blue-dark text-sm font-medium"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    <div className="space-y-2">
                      {job.description.map((bullet, bulletIndex) => (
                        <div key={bulletIndex} className="flex gap-2">
                          <span className="text-gray-400 mt-2">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => onUpdateBullet(jobIndex, bulletIndex, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-gray-900"
                            placeholder="Describe an achievement or responsibility..."
                          />
                          <button
                            onClick={() => onRemoveBullet(jobIndex, bulletIndex)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {job.description.length === 0 && (
                        <p className="text-gray-400 text-sm">No bullet points added.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
