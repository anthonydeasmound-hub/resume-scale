"use client";

import React, { useState } from "react";
import { JobStatus } from "./types";

interface StatusBarProps {
  status: JobStatus;
  onStatusChange: (status: JobStatus) => void;
}

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: "bookmarked", label: "Bookmarked" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer Received" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

function getStatusStyle(status: JobStatus): string {
  switch (status) {
    case "bookmarked":
    case "review":
    case "draft":
      return "bg-brand-blue text-white";
    case "applying":
      return "bg-brand-blue text-white";
    case "applied":
      return "bg-green-600 text-white";
    case "interviewing":
    case "interview":
      return "bg-purple-600 text-white";
    case "negotiating":
      return "bg-orange-500 text-white";
    case "offer":
      return "bg-emerald-600 text-white";
    case "accepted":
      return "bg-emerald-700 text-white";
    case "rejected":
      return "bg-gray-500 text-white";
    default:
      return "bg-brand-blue text-white";
  }
}

export default function StatusBar({ status, onStatusChange }: StatusBarProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === status) ||
    STATUS_OPTIONS.find((s) => s.value === "bookmarked")!;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-between transition-colors ${getStatusStyle(status)}`}
      >
        <span>{currentStatus.label}</span>
        <svg
          className={`w-5 h-5 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 overflow-hidden">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onStatusChange(option.value);
                  setShowDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between ${
                  option.value === status ? "bg-gray-50 font-medium text-gray-900" : ""
                }`}
              >
                <span>{option.label}</span>
                {option.value === status && (
                  <svg className="w-5 h-5 text-brand-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
