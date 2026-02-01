"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PipelineStatus, mapStatusToPipeline } from "./PipelineStages";

export interface TrackerJob {
  id: number;
  job_title: string;
  company_name: string;
  status: string;
  created_at: string;
  date_applied: string | null;
  job_details_parsed: string | null;
}

type SortField = "job_title" | "company_name" | "status" | "created_at" | "date_applied";
type SortDirection = "asc" | "desc";

interface JobTrackerTableProps {
  jobs: TrackerJob[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onStatusChange: (jobId: number, newStatus: PipelineStatus) => Promise<void>;
}

const STATUS_OPTIONS: { value: PipelineStatus; label: string; color: string }[] = [
  { value: "bookmarked", label: "Bookmarked", color: "bg-gray-100 text-gray-700" },
  { value: "applying", label: "Applying", color: "bg-blue-100 text-blue-700" },
  { value: "applied", label: "Applied", color: "bg-purple-100 text-purple-700" },
  { value: "interviewing", label: "Interviewing", color: "bg-yellow-100 text-yellow-700" },
  { value: "negotiating", label: "Negotiating", color: "bg-orange-100 text-orange-700" },
  { value: "accepted", label: "Accepted", color: "bg-green-100 text-green-700" },
];

function getLocationFromJob(job: TrackerJob): string {
  if (!job.job_details_parsed) return "--";
  try {
    const parsed = JSON.parse(job.job_details_parsed);
    return parsed.location || "--";
  } catch {
    return "--";
  }
}

function getStatusConfig(status: string) {
  const pipelineStatus = mapStatusToPipeline(status);
  return STATUS_OPTIONS.find((s) => s.value === pipelineStatus) || STATUS_OPTIONS[0];
}

export default function JobTrackerTable({
  jobs,
  selectedIds,
  onSelectionChange,
  onStatusChange,
}: JobTrackerTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortField) {
        case "job_title":
          aVal = a.job_title.toLowerCase();
          bVal = b.job_title.toLowerCase();
          break;
        case "company_name":
          aVal = a.company_name.toLowerCase();
          bVal = b.company_name.toLowerCase();
          break;
        case "status":
          aVal = mapStatusToPipeline(a.status);
          bVal = mapStatusToPipeline(b.status);
          break;
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case "date_applied":
          aVal = a.date_applied ? new Date(a.date_applied).getTime() : 0;
          bVal = b.date_applied ? new Date(b.date_applied).getTime() : 0;
          break;
      }

      if (aVal === null || bVal === null) return 0;
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [jobs, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === jobs.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(jobs.map((j) => j.id)));
    }
  };

  const handleSelectOne = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const handleRowClick = (jobId: number) => {
    router.push(`/review/${jobId}`);
  };

  const handleStatusSelect = async (jobId: number, newStatus: PipelineStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    await onStatusChange(jobId, newStatus);
    setEditingStatusId(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
      <svg className="w-4 h-4 text-teal-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-teal-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
        <p className="text-gray-500">Start by adding a job to track your applications</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === jobs.length && jobs.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("job_title")}
                  className="flex items-center text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                >
                  Job Position
                  <SortIcon field="job_title" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("company_name")}
                  className="flex items-center text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                >
                  Company
                  <SortIcon field="company_name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("created_at")}
                  className="flex items-center text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                >
                  Date Saved
                  <SortIcon field="created_at" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort("date_applied")}
                  className="flex items-center text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                >
                  Date Applied
                  <SortIcon field="date_applied" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedJobs.map((job) => {
              const statusConfig = getStatusConfig(job.status);
              const isSelected = selectedIds.has(job.id);

              return (
                <tr
                  key={job.id}
                  onClick={() => handleRowClick(job.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-teal-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => handleSelectOne(job.id, e)}
                      onChange={() => {}}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{job.job_title}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{job.company_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{getLocationFromJob(job)}</td>
                  <td className="px-4 py-3 relative">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStatusId(editingStatusId === job.id ? null : job.id);
                        }}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {editingStatusId === job.id && (
                        <div className="absolute z-10 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                          {STATUS_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={(e) => handleStatusSelect(job.id, option.value, e)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                mapStatusToPipeline(job.status) === option.value ? "bg-gray-50" : ""
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${option.color.split(" ")[0]}`} />
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {job.date_applied ? new Date(job.date_applied).toLocaleDateString() : "--"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
