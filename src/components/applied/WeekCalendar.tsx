"use client";

import { useMemo } from "react";

interface Interview {
  id: number;
  jobId: number;
  companyName: string;
  jobTitle: string;
  stageName: string;
  scheduledAt: string;
}

interface WeekCalendarProps {
  interviews: Interview[];
  onInterviewClick: (jobId: number) => void;
}

export default function WeekCalendar({ interviews, onInterviewClick }: WeekCalendarProps) {
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Start from Sunday

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  const interviewsByDay = useMemo(() => {
    const grouped: Record<string, Interview[]> = {};

    weekDays.forEach((day) => {
      const dateKey = day.toISOString().split("T")[0];
      grouped[dateKey] = [];
    });

    interviews.forEach((interview) => {
      const dateKey = new Date(interview.scheduledAt).toISOString().split("T")[0];
      if (grouped[dateKey]) {
        grouped[dateKey].push(interview);
      }
    });

    return grouped;
  }, [interviews, weekDays]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Upcoming This Week
      </h2>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => {
          const dateKey = day.toISOString().split("T")[0];
          const dayInterviews = interviewsByDay[dateKey] || [];
          const today = isToday(day);

          return (
            <div
              key={dateKey}
              className={`min-h-[100px] rounded-lg p-2 ${
                today
                  ? "bg-brand-blue-light border-2 border-brand-blue"
                  : "bg-gray-50 border border-gray-100"
              }`}
            >
              <div className="text-center mb-2">
                <div className={`text-xs font-medium ${today ? "text-brand-blue" : "text-gray-500"}`}>
                  {dayNames[idx]}
                </div>
                <div
                  className={`text-lg font-bold ${
                    today ? "text-brand-blue" : "text-gray-700"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>

              <div className="space-y-1">
                {dayInterviews.slice(0, 2).map((interview) => (
                  <button
                    key={interview.id}
                    onClick={() => onInterviewClick(interview.jobId)}
                    className="w-full text-left p-1.5 bg-indigo-100 hover:bg-indigo-200 rounded text-xs transition-colors"
                  >
                    <div className="font-medium text-indigo-800 truncate">
                      {formatTime(interview.scheduledAt)}
                    </div>
                    <div className="text-indigo-600 truncate">
                      {interview.companyName}
                    </div>
                    <div className="text-indigo-500 truncate text-[10px]">
                      {interview.stageName}
                    </div>
                  </button>
                ))}
                {dayInterviews.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayInterviews.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
