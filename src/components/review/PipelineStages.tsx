"use client";

export type PipelineStatus = "bookmarked" | "applying" | "applied" | "interviewing" | "negotiating" | "accepted";

interface PipelineStagesProps {
  counts: Record<PipelineStatus, number>;
  activeFilter: PipelineStatus | null;
  onFilterChange: (status: PipelineStatus | null) => void;
}

const STAGES: { id: PipelineStatus; label: string }[] = [
  { id: "bookmarked", label: "BOOKMARKED" },
  { id: "applying", label: "APPLYING" },
  { id: "applied", label: "APPLIED" },
  { id: "interviewing", label: "INTERVIEWING" },
  { id: "negotiating", label: "NEGOTIATING" },
  { id: "accepted", label: "ACCEPTED" },
];

export default function PipelineStages({ counts, activeFilter, onFilterChange }: PipelineStagesProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between overflow-x-auto">
        {STAGES.map((stage, index) => {
          const count = counts[stage.id] || 0;
          const isActive = activeFilter === stage.id;
          const hasJobs = count > 0;

          return (
            <div key={stage.id} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => onFilterChange(isActive ? null : stage.id)}
                className={`
                  relative flex flex-col items-center justify-center px-4 py-3 rounded-lg transition-all w-full
                  ${isActive ? "bg-teal-50 border-2 border-teal-500" : "hover:bg-gray-50 border-2 border-transparent"}
                  ${hasJobs ? "cursor-pointer" : "cursor-default"}
                `}
              >
                <span className={`text-2xl font-bold ${isActive ? "text-teal-600" : hasJobs ? "text-gray-900" : "text-gray-300"}`}>
                  {count > 0 ? count : "--"}
                </span>
                <span className={`text-xs font-medium mt-1 whitespace-nowrap ${isActive ? "text-teal-600" : "text-gray-500"}`}>
                  {stage.label}
                </span>
              </button>
              {index < STAGES.length - 1 && (
                <div className="flex-shrink-0 mx-1">
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {activeFilter && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing <span className="font-medium text-teal-600">{counts[activeFilter]}</span> jobs in {activeFilter}
          </span>
          <button
            onClick={() => onFilterChange(null)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function to map old statuses to new pipeline statuses
export function mapStatusToPipeline(status: string): PipelineStatus {
  switch (status) {
    case "draft":
      return "bookmarked";
    case "review":
      return "applying";
    case "applied":
      return "applied";
    case "interview":
      return "interviewing";
    case "offer":
      return "negotiating";
    case "rejected":
      return "bookmarked"; // Could also be kept separate
    // New statuses pass through
    case "bookmarked":
    case "applying":
    case "interviewing":
    case "negotiating":
    case "accepted":
      return status as PipelineStatus;
    default:
      return "bookmarked";
  }
}

// Helper to calculate counts from jobs array
export function calculatePipelineCounts(jobs: { status: string }[]): Record<PipelineStatus, number> {
  const counts: Record<PipelineStatus, number> = {
    bookmarked: 0,
    applying: 0,
    applied: 0,
    interviewing: 0,
    negotiating: 0,
    accepted: 0,
  };

  for (const job of jobs) {
    const pipelineStatus = mapStatusToPipeline(job.status);
    counts[pipelineStatus]++;
  }

  return counts;
}
