"use client";

type Status = "applied" | "interview" | "offer" | "rejected";

interface StatusBadgeProps {
  status: Status;
  onClick?: () => void;
}

const statusStyles: Record<Status, string> = {
  applied: "bg-blue-100 text-brand-blue",
  interview: "bg-yellow-100 text-yellow-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium capitalize";
  const colorClasses = statusStyles[status] || statusStyles.applied;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${colorClasses} hover:opacity-80 transition-opacity`}
      >
        {status}
      </button>
    );
  }

  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {status}
    </span>
  );
}
