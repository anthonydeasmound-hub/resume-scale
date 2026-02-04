"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import TabsNav from "@/components/TabsNav";
import PipelineStages, {
  PipelineStatus,
  calculatePipelineCounts,
  mapStatusToPipeline,
} from "@/components/review/PipelineStages";
import JobTrackerTable, { TrackerJob } from "@/components/review/JobTrackerTable";
import AddJobModal from "@/components/review/AddJobModal";
import { ReviewSkeleton } from "@/components/Skeleton";

export default function ReviewPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<TrackerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<PipelineStatus | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    document.title = "ResumeGenie - ATS Optimizer";
  }, []);

  useEffect(() => {
    if (session) {
      fetchJobs();
    }
  }, [session]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs?include=follow_ups");
      if (response.ok) {
        const data = await response.json();
        // Filter out archived jobs
        const activeJobs = data.filter((j: TrackerJob & { archived_at?: string | null }) => !j.archived_at);
        setJobs(activeJobs);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const pipelineCounts = useMemo(() => calculatePipelineCounts(jobs), [jobs]);

  const filteredJobs = useMemo(() => {
    if (!activeFilter) return jobs;
    return jobs.filter((job) => mapStatusToPipeline(job.status) === activeFilter);
  }, [jobs, activeFilter]);

  const handleStatusChange = async (jobId: number, newStatus: PipelineStatus) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, status: newStatus } : job
          )
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleExcitementChange = async (jobId: number, level: number) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excitement_level: level }),
      });

      if (response.ok) {
        // Update local state
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, excitement_level: level } : job
          )
        );
      }
    } catch (err) {
      console.error("Failed to update excitement level:", err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} job(s)?`
    );
    if (!confirmed) return;

    try {
      // Delete jobs in parallel
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/jobs/${id}`, { method: "DELETE" })
        )
      );

      // Update local state
      setJobs((prev) => prev.filter((job) => !selectedIds.has(job.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to delete jobs:", err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-brand-gray">
        <TabsNav />
        <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
          <ReviewSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <TabsNav />

      <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Job Tracker</h1>
        </div>

        {/* Pipeline Stages */}
        <PipelineStages
          counts={pipelineCounts}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              <span className="font-medium">{selectedIds.size}</span> selected
            </span>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Delete selected
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add a New Job
            </button>
          </div>
        </div>

        {/* Job Table */}
        <JobTrackerTable
          jobs={filteredJobs}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onStatusChange={handleStatusChange}
          onExcitementChange={handleExcitementChange}
        />
      </div>

      {/* Add Job Modal */}
      <AddJobModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onJobAdded={fetchJobs}
      />
    </div>
  );
}
