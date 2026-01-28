"use client";

import { Job } from "./types";

interface JobSelectionListProps {
  jobs: Job[];
  onSelectJob: (jobId: number) => void;
}

export default function JobSelectionList({ jobs, onSelectJob }: JobSelectionListProps) {
  return (
    <>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Review ({jobs.length} pending)
      </h1>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
          No jobs to review. Add a job from the Dashboard.
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.job_title}</h3>
                  <p className="text-gray-600">{job.company_name}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(job.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
