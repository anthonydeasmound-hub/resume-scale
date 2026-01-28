"use client";

export type AlertType = "email" | "interview" | "follow_up" | "rejection" | "offer";

export interface JobAlert {
  type: AlertType;
  message: string;
  count?: number;
}

export interface JobListRowProps {
  id: number;
  companyName: string;
  jobTitle: string;
  dateApplied: string | null;
  currentStage: number;
  totalStages: number;
  pinned: boolean;
  alerts: JobAlert[];
  status: string;
  onClick: () => void;
  onPinToggle: (e: React.MouseEvent) => void;
}

export default function JobListRow({
  companyName,
  jobTitle,
  dateApplied,
  currentStage,
  totalStages,
  pinned,
  alerts,
  status,
  onClick,
  onPinToggle,
}: JobListRowProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "email":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "interview":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "follow_up":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "rejection":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case "offer":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
    }
  };

  const getAlertColor = (type: AlertType) => {
    switch (type) {
      case "email":
        return "text-brand-blue bg-brand-blue-light";
      case "interview":
        return "text-purple-600 bg-purple-50";
      case "follow_up":
        return "text-amber-600 bg-amber-50";
      case "rejection":
        return "text-red-600 bg-red-50";
      case "offer":
        return "text-green-600 bg-green-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-brand-blue";
      case "interview":
        return "bg-purple-100 text-purple-700";
      case "offer":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Calculate progress bar segments
  const renderProgressBar = () => {
    const segments = [];
    for (let i = 0; i < totalStages; i++) {
      const isFilled = i < currentStage;
      segments.push(
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            isFilled ? "bg-indigo-500" : "bg-gray-200"
          }`}
        />
      );
    }
    return segments;
  };

  const primaryAlert = alerts[0];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer flex items-center gap-4"
    >
      {/* Pin Button */}
      <button
        onClick={onPinToggle}
        className={`shrink-0 p-1 rounded hover:bg-gray-100 transition-colors ${
          pinned ? "text-yellow-500" : "text-gray-300 hover:text-gray-400"
        }`}
      >
        <svg
          className="w-5 h-5"
          fill={pinned ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </button>

      {/* Company Logo */}
      <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-lg font-bold text-gray-500">
          {companyName?.charAt(0)?.toUpperCase() || "?"}
        </span>
      </div>

      {/* Date Applied */}
      <div className="w-24 shrink-0">
        <div className="text-xs text-gray-400 uppercase tracking-wide">Applied</div>
        <div className="text-sm text-gray-700 font-medium">{formatDate(dateApplied)}</div>
      </div>

      {/* Company Name */}
      <div className="w-32 shrink-0">
        <div className="font-medium text-gray-900 truncate">{companyName}</div>
      </div>

      {/* Job Title */}
      <div className="flex-1 min-w-0">
        <div className="text-gray-700 truncate">{jobTitle}</div>
      </div>

      {/* Stage Progress */}
      <div className="w-24 shrink-0">
        <div className="flex gap-0.5 mb-1">
          {renderProgressBar()}
        </div>
        <div className="text-xs text-center text-gray-500">
          {currentStage}
        </div>
      </div>

      {/* Alert */}
      <div className="w-48 shrink-0">
        {primaryAlert ? (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${getAlertColor(
              primaryAlert.type
            )}`}
          >
            {getAlertIcon(primaryAlert.type)}
            <span className="truncate">{primaryAlert.message}</span>
            {primaryAlert.count && primaryAlert.count > 1 && (
              <span className="bg-white/50 px-1.5 py-0.5 rounded text-xs font-medium">
                {primaryAlert.count}
              </span>
            )}
          </div>
        ) : (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )}
      </div>

      {/* Chevron */}
      <div className="shrink-0 text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
