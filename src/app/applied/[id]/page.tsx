"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import TabsNav from "@/components/TabsNav";
import { JobDetailSkeleton } from "@/components/Skeleton";

interface InterviewStage {
  id: number;
  job_id: number;
  stage_number: number;
  stage_type: string;
  stage_name: string | null;
  status: string;
  scheduled_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface EmailAction {
  id: number;
  job_id: number;
  email_type: string;
  direction: string;
  subject: string | null;
  status: string;
  sent_at: string | null;
  detected_at: string | null;
  created_at: string;
}

interface JobNote {
  id: number;
  job_id: number;
  content: string;
  created_at: string;
}

interface JobDetails {
  salary_range: string | null;
  location: string | null;
  work_type: string | null;
}

interface Job {
  id: number;
  company_name: string;
  job_title: string;
  job_description: string | null;
  status: string;
  date_applied: string | null;
  pinned: number;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_title: string | null;
  job_details_parsed: string | null;
  created_at: string;
}

export default function JobDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [stages, setStages] = useState<InterviewStage[]>([]);
  const [emails, setEmails] = useState<EmailAction[]>([]);
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    document.title = "ResumeGenie - Job Details";
  }, []);

  useEffect(() => {
    if (session && jobId) {
      fetchJobData();
    }
  }, [session, jobId]);

  const fetchJobData = async () => {
    try {
      const [jobRes, stagesRes, emailsRes, notesRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/jobs/${jobId}/stages`),
        fetch(`/api/jobs/${jobId}/emails`),
        fetch(`/api/jobs/${jobId}/notes`),
      ]);

      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJob(jobData);
      }
      if (stagesRes.ok) {
        const stagesData = await stagesRes.json();
        setStages(stagesData);
      }
      if (emailsRes.ok) {
        const emailsData = await emailsRes.json();
        setEmails(emailsData);
      }
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }
    } catch (err) {
      console.error("Failed to fetch job data:", err);
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async () => {
    if (!job) return;
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: job.pinned ? 0 : 1 }),
      });
      setJob((prev) => (prev ? { ...prev, pinned: prev.pinned ? 0 : 1 } : null));
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [note, ...prev]);
        setNewNote("");
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setAddingNote(false);
    }
  };

  const updateStageStatus = async (stageId: number, newStatus: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/stages/${stageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      console.error("Failed to update stage:", err);
    }
  };

  const getStageColor = (stage: InterviewStage) => {
    switch (stage.status) {
      case "completed":
        return "bg-green-500 border-green-500";
      case "scheduled":
        return "bg-yellow-500 border-yellow-500";
      case "rejected":
        return "bg-red-500 border-red-500";
      default:
        return "bg-gray-200 border-gray-300";
    }
  };

  const getStageLabel = (type: string) => {
    const labels: Record<string, string> = {
      phone_screen: "Phone Screen",
      technical: "Technical",
      behavioral: "Behavioral",
      hiring_manager: "Hiring Manager",
      final: "Final Round",
      onsite: "Onsite",
      panel: "Panel",
      take_home: "Take Home",
      other: "Other",
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getJobDetails = (): JobDetails | null => {
    if (!job?.job_details_parsed) return null;
    try {
      return JSON.parse(job.job_details_parsed);
    } catch {
      return null;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-brand-gray">
        <TabsNav />
        <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
          <JobDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="text-lg text-gray-600">Job not found</div>
      </div>
    );
  }

  const jobDetails = getJobDetails();

  // Create default stages if none exist
  const displayStages =
    stages.length > 0
      ? stages
      : [
          { id: 0, job_id: parseInt(jobId), stage_number: 1, stage_type: "applied", stage_name: "Applied", status: job.status === "applied" ? "completed" : "pending", scheduled_at: null, completed_at: job.date_applied, notes: null },
          { id: 0, job_id: parseInt(jobId), stage_number: 2, stage_type: "phone_screen", stage_name: "Phone Screen", status: "pending", scheduled_at: null, completed_at: null, notes: null },
          { id: 0, job_id: parseInt(jobId), stage_number: 3, stage_type: "technical", stage_name: "Technical", status: "pending", scheduled_at: null, completed_at: null, notes: null },
          { id: 0, job_id: parseInt(jobId), stage_number: 4, stage_type: "hiring_manager", stage_name: "Hiring Manager", status: "pending", scheduled_at: null, completed_at: null, notes: null },
          { id: 0, job_id: parseInt(jobId), stage_number: 5, stage_type: "final", stage_name: "Final Round", status: "pending", scheduled_at: null, completed_at: null, notes: null },
        ];

  return (
    <div className="min-h-screen bg-brand-gray">
      <TabsNav reviewCount={0} />

      <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/applied")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Applications
          </button>

          <button
            onClick={togglePin}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              job.pinned
                ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={job.pinned ? "currentColor" : "none"}
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
            {job.pinned ? "Pinned" : "Pin"}
          </button>
        </div>

        {/* Company Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-white">
                {job.company_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{job.company_name}</h1>
              <p className="text-lg text-gray-600 mb-3">{job.job_title}</p>
              <div className="flex flex-wrap gap-2">
                {jobDetails?.location && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {jobDetails.location}
                  </span>
                )}
                {jobDetails?.salary_range && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {jobDetails.salary_range}
                  </span>
                )}
                {jobDetails?.work_type && (
                  <span className="px-3 py-1 bg-blue-100 text-brand-blue rounded-full text-sm">
                    {jobDetails.work_type}
                  </span>
                )}
                {job.date_applied && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    Applied {formatDate(job.date_applied)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interview Roadmap */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Interview Roadmap</h2>

          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-0" />
            <div
              className="absolute top-6 left-0 h-1 bg-indigo-500 transition-all -z-0"
              style={{
                width: `${
                  (displayStages.filter((s) => s.status === "completed").length /
                    displayStages.length) *
                  100
                }%`,
              }}
            />

            {/* Stage Nodes */}
            <div className="relative flex justify-between">
              {displayStages.map((stage, idx) => (
                <div key={stage.id || idx} className="flex flex-col items-center" style={{ width: `${100 / displayStages.length}%` }}>
                  <button
                    onClick={() => {
                      if (stage.id) {
                        const nextStatus =
                          stage.status === "pending"
                            ? "scheduled"
                            : stage.status === "scheduled"
                            ? "completed"
                            : stage.status === "completed"
                            ? "pending"
                            : "pending";
                        updateStageStatus(stage.id, nextStatus);
                      }
                    }}
                    className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all ${getStageColor(
                      stage
                    )} ${stage.id ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
                  >
                    {stage.status === "completed" ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : stage.status === "scheduled" ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : stage.status === "rejected" ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <span className="text-gray-400 font-medium">{idx + 1}</span>
                    )}
                  </button>

                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {stage.stage_name || getStageLabel(stage.stage_type)}
                    </p>
                    {stage.scheduled_at && (
                      <p className="text-xs text-indigo-600 mt-1">
                        {formatDateTime(stage.scheduled_at)}
                      </p>
                    )}
                    {stage.completed_at && stage.status === "completed" && (
                      <p className="text-xs text-green-600 mt-1">
                        {formatDate(stage.completed_at)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Completed</span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recruiter Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recruiter</h2>
            {job.recruiter_name || job.recruiter_email ? (
              <div className="space-y-3">
                {job.recruiter_name && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {job.recruiter_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{job.recruiter_name}</p>
                      {job.recruiter_title && (
                        <p className="text-sm text-gray-500">{job.recruiter_title}</p>
                      )}
                    </div>
                  </div>
                )}
                {job.recruiter_email && (
                  <a
                    href={`mailto:${job.recruiter_email}`}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {job.recruiter_email}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No recruiter information available</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/review?job=${jobId}`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Resume & Cover Letter
              </button>
              <button
                onClick={() => {
                  // TODO: Generate thank you email
                  alert("Generate Thank You Email - Coming soon");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Generate Thank You Email
              </button>
              <button
                onClick={() => {
                  // TODO: View interview guide
                  alert("View Interview Guide - Coming soon");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                View Interview Guide
              </button>
            </div>
          </div>
        </div>

        {/* Email Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Activity</h2>
          {emails.length > 0 ? (
            <div className="space-y-3">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      email.direction === "inbound"
                        ? "bg-blue-100 text-brand-blue"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          email.direction === "inbound"
                            ? "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            : "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        }
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {email.subject || email.email_type.replace("_", " ")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {email.direction === "inbound" ? "Received" : "Sent"}{" "}
                      {formatDateTime(email.detected_at || email.sent_at || email.created_at)}
                    </p>
                  </div>
                  {email.status === "detected" && (
                    <span className="px-2 py-1 bg-blue-100 text-brand-blue text-xs rounded-full">
                      New
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No email activity yet</p>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>

          {/* Add Note */}
          <div className="mb-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addNote();
                  }
                }}
              />
              <button
                onClick={addNote}
                disabled={addingNote || !newNote.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addingNote ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

          {/* Notes List */}
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="text-gray-800">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDateTime(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No notes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
