"use client";

import { useState, useEffect } from "react";

type JobStatus = "applied" | "interview" | "offer" | "rejected";

interface FilterState {
  status: JobStatus[];
  dateRange: { start: string; end: string };
  companySearch: string;
  interviewStage: number | null;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const STATUS_OPTIONS: { value: JobStatus; label: string; color: string }[] = [
  { value: "applied", label: "Applied", color: "bg-blue-100 text-brand-blue border-blue-300" },
  { value: "interview", label: "Interview", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "offer", label: "Offer", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700 border-red-300" },
];

export default function FilterBar({ filters, onFiltersChange, totalCount, filteredCount }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.companySearch);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.companySearch) {
        onFiltersChange({ ...filters, companySearch: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleStatus = (status: JobStatus) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatuses });
  };

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({
      status: [],
      dateRange: { start: "", end: "" },
      companySearch: "",
      interviewStage: null,
    });
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.companySearch ||
    filters.interviewStage !== null;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-1">Status:</span>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleStatus(option.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filters.status.includes(option.value)
                  ? option.color
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 hidden md:block" />

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Date:</span>
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateRange: { ...filters.dateRange, start: e.target.value },
              })
            }
            className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateRange: { ...filters.dateRange, end: e.target.value },
              })
            }
            className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 hidden lg:block" />

        {/* Company Search */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Search:</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Company or title..."
            className="px-3 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue w-40"
          />
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 hidden xl:block" />

        {/* Interview Stage Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Stage:</span>
          <select
            value={filters.interviewStage ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                interviewStage: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">All Stages</option>
            <option value="0">No Interviews</option>
            <option value="1">Stage 1+</option>
            <option value="2">Stage 2+</option>
            <option value="3">Stage 3+</option>
            <option value="4">Stage 4+</option>
            <option value="5">Stage 5</option>
          </select>
        </div>
      </div>

      {/* Results count and clear */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredCount}</span> of{" "}
          <span className="font-medium">{totalCount}</span> applications
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-brand-blue hover:text-brand-blue-dark font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
