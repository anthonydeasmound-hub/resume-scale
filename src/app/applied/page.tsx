"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import TabsNav from "@/components/TabsNav";
import FilterBar from "@/components/applied/FilterBar";
import JobCard from "@/components/applied/JobCard";
import ExpandedJobCard from "@/components/applied/ExpandedJobCard";

interface Job {
  id: number;
  company_name: string;
  job_title: string;
  status: string;
  date_applied: string | null;
  interview_1: string | null;
  interview_2: string | null;
  interview_3: string | null;
  interview_4: string | null;
  interview_5: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_title: string | null;
  recruiter_source: 'email' | 'job_description' | 'manual' | null;
  created_at: string;
}

type JobStatus = "applied" | "interview" | "offer" | "rejected";

interface FilterState {
  status: JobStatus[];
  dateRange: { start: string; end: string };
  companySearch: string;
  interviewStage: number | null;
}

const INTERVIEW_STAGES = ["interview_1", "interview_2", "interview_3", "interview_4", "interview_5"] as const;

export default function AppliedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewCount, setReviewCount] = useState(0);
  const [expandedJob, setExpandedJob] = useState<Job | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    dateRange: { start: "", end: "" },
    companySearch: "",
    interviewStage: null,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchJobs();
      fetchReviewCount();
    }
  }, [session]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        const appliedJobs = data.filter(
          (j: Job) =>
            j.status === "applied" ||
            j.status === "interview" ||
            j.status === "rejected" ||
            j.status === "offer"
        );
        setJobs(appliedJobs);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewCount = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setReviewCount(data.review_count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch review count:", err);
    }
  };

  const updateJob = async (jobId: number, updates: Partial<Job>) => {
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      await fetchJobs();
      // Update expanded job if it's the one being updated
      if (expandedJob && expandedJob.id === jobId) {
        setExpandedJob(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      console.error("Failed to update job:", err);
    }
  };

  const handleInterviewPrepClick = (job: Job) => {
    setExpandedJob(job);
  };

  const handleStatusChange = (jobId: number, newStatus: string) => {
    updateJob(jobId, { status: newStatus });
  };

  const handleInterviewChange = (jobId: number, stage: string, value: string | null) => {
    updateJob(jobId, { [stage]: value });
  };

  // Get interview count for a job
  const getInterviewCount = (job: Job): number => {
    let count = 0;
    for (const stage of INTERVIEW_STAGES) {
      if (job[stage] && job[stage] !== "pending") {
        count = parseInt(stage.split("_")[1]);
      }
    }
    return count;
  };

  // Filter jobs based on current filter state
  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Status filter (multi-select)
    if (filters.status.length > 0) {
      result = result.filter((j) => filters.status.includes(j.status as JobStatus));
    }

    // Date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      result = result.filter((j) => {
        if (!j.date_applied) return false;
        return new Date(j.date_applied) >= startDate;
      });
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day
      result = result.filter((j) => {
        if (!j.date_applied) return false;
        return new Date(j.date_applied) <= endDate;
      });
    }

    // Company/title search filter
    if (filters.companySearch) {
      const search = filters.companySearch.toLowerCase();
      result = result.filter(
        (j) =>
          j.company_name.toLowerCase().includes(search) ||
          j.job_title.toLowerCase().includes(search)
      );
    }

    // Interview stage filter
    if (filters.interviewStage !== null) {
      if (filters.interviewStage === 0) {
        // No interviews - all stages are null or pending
        result = result.filter((j) => getInterviewCount(j) === 0);
      } else {
        // Has reached at least this stage
        result = result.filter((j) => getInterviewCount(j) >= filters.interviewStage!);
      }
    }

    return result;
  }, [jobs, filters]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TabsNav reviewCount={reviewCount} />

      <div className="ml-64 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Applied Jobs
        </h1>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={jobs.length}
          filteredCount={filteredJobs.length}
        />

        {/* Job Cards Grid */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
            {jobs.length === 0
              ? "No applied jobs yet. Review and submit applications from the Review tab."
              : "No jobs match your current filters."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusChange={handleStatusChange}
                onInterviewChange={handleInterviewChange}
                onInterviewPrepClick={handleInterviewPrepClick}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-md px-4 py-3 flex flex-wrap items-center gap-6 text-sm">
          <span className="text-gray-500 font-medium">Interview Legend:</span>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-gray-200"></span>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
            <span className="text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Rejected</span>
          </div>
        </div>
      </div>

      {/* Expanded Job Card Modal */}
      {expandedJob && (
        <ExpandedJobCard
          job={expandedJob}
          onClose={() => setExpandedJob(null)}
          onUpdate={updateJob}
        />
      )}
    </div>
  );
}
