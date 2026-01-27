"use client";

type InterviewStatus = "pending" | "scheduled" | "completed" | "rejected";

interface InterviewProgressBarProps {
  stages: InterviewStatus[];
  onStageClick?: (stageIndex: number) => void;
}

const statusColors: Record<InterviewStatus, string> = {
  pending: "bg-gray-200",
  scheduled: "bg-yellow-500",
  completed: "bg-green-500",
  rejected: "bg-red-500",
};

const statusBorderColors: Record<InterviewStatus, string> = {
  pending: "border-gray-200",
  scheduled: "border-yellow-500",
  completed: "border-green-500",
  rejected: "border-red-500",
};

export default function InterviewProgressBar({ stages, onStageClick }: InterviewProgressBarProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-0">
        {stages.map((status, idx) => (
          <div key={idx} className="flex items-center">
            {/* Circle */}
            <button
              onClick={() => onStageClick?.(idx)}
              className={`w-6 h-6 rounded-full ${statusColors[status]} border-2 ${statusBorderColors[status]} transition-all hover:scale-110 hover:opacity-80 flex items-center justify-center`}
              title={`Interview ${idx + 1}: ${status}`}
            />
            {/* Connecting line (not after last circle) */}
            {idx < stages.length - 1 && (
              <div
                className={`w-4 h-0.5 ${
                  status === "completed" || status === "scheduled"
                    ? statusColors[status]
                    : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {/* Labels */}
      <div className="flex items-center gap-0">
        {stages.map((_, idx) => (
          <div key={idx} className="flex items-center">
            <span className="w-6 text-center text-xs text-gray-500">{idx + 1}</span>
            {idx < stages.length - 1 && <div className="w-4" />}
          </div>
        ))}
      </div>
    </div>
  );
}
