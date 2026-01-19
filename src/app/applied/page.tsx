"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import TabsNav from "@/components/TabsNav";

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
  created_at: string;
}

type InterviewStatus = "pending" | "scheduled" | "completed" | "rejected";

const INTERVIEW_STAGES = ["interview_1", "interview_2", "interview_3", "interview_4", "interview_5"] as const;

export default function AppliedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

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
          (j: Job) => j.status === "applied" || j.status === "interview" || j.status === "rejected" || j.status === "offer"
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
      fetchJobs();
    } catch (err) {
      console.error("Failed to update job:", err);
    }
  };

  const getInterviewStatus = (job: Job, stage: typeof INTERVIEW_STAGES[number]): InterviewStatus => {
    const value = job[stage];
    if (!value) return "pending";
    if (value === "rejected") return "rejected";
    if (value === "scheduled") return "scheduled";
    return "completed";
  };

  const getStatusColor = (interviewStatus: InterviewStatus): string => {
    switch (interviewStatus) {
      case "completed":
        return "bg-green-500";
      case "scheduled":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-200";
    }
  };

  const getRowBackground = (job: Job): string => {
    if (job.status === "rejected") return "bg-red-50";
    if (job.status === "offer") return "bg-green-50";
    return "bg-white";
  };

  const cycleInterviewStatus = (job: Job, stage: typeof INTERVIEW_STAGES[number]) => {
    const current = getInterviewStatus(job, stage);
    let next: string | null;

    switch (current) {
      case "pending":
        next = "scheduled";
        break;
      case "scheduled":
        next = "completed";
        break;
      case "completed":
        next = "rejected";
        break;
      case "rejected":
        next = null;
        break;
      default:
        next = null;
    }

    updateJob(job.id, { [stage]: next });
  };

  const setJobStatus = (job: Job, newStatus: string) => {
    updateJob(job.id, { status: newStatus });
    setEditingJob(null);
  };

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
          Applied Jobs ({jobs.length})
        </h1>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
            No applied jobs yet. Review and submit applications from the Review tab.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date Applied</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900" colSpan={5}>
                      Interview Progress
                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b">
                    <th colSpan={4}></th>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <th key={num} className="px-2 py-1 text-center text-xs text-gray-500 font-normal">
                        {num}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className={`${getRowBackground(job)} hover:bg-gray-50 transition-colors`}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{job.company_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700">{job.job_title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-500 text-sm">
                          {job.date_applied
                            ? new Date(job.date_applied).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <button
                          onClick={() => setEditingJob(editingJob === job.id ? null : job.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            job.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : job.status === "offer"
                              ? "bg-green-100 text-green-700"
                              : job.status === "interview"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </button>
                        {editingJob === job.id && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border p-2 z-10 min-w-[120px]">
                            {["applied", "interview", "rejected", "offer"].map((s) => (
                              <button
                                key={s}
                                onClick={() => setJobStatus(job, s)}
                                className={`block w-full text-left px-3 py-1 text-sm rounded hover:bg-gray-100 ${
                                  job.status === s ? "font-medium" : ""
                                }`}
                              >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      {INTERVIEW_STAGES.map((stage, idx) => {
                        const interviewStatus = getInterviewStatus(job, stage);
                        return (
                          <td key={stage} className="px-2 py-3 text-center">
                            <button
                              onClick={() => cycleInterviewStatus(job, stage)}
                              className={`w-6 h-6 rounded-full ${getStatusColor(interviewStatus)} transition-colors hover:opacity-80`}
                              title={`Interview ${idx + 1}: ${interviewStatus}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center gap-6 text-sm">
              <span className="text-gray-500">Legend:</span>
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
        )}
      </div>
    </div>
  );
}
