"use client";

import React, { useState, useEffect } from "react";
import InterviewRoadmap from "./InterviewRoadmap";
import InterviewGuideDisplay from "./InterviewGuideDisplay";
import RecruiterInfo from "./RecruiterInfo";
import { InterviewGuide } from "@/lib/db";

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
}

interface ExpandedJobCardProps {
  job: Job;
  onClose: () => void;
  onUpdate: (jobId: number, updates: Partial<Job>) => Promise<void>;
}

type TabType = "roadmap" | "guide" | "recruiter";

export default function ExpandedJobCard({ job, onClose, onUpdate }: ExpandedJobCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("roadmap");
  const [interviewGuide, setInterviewGuide] = useState<InterviewGuide | null>(null);
  const [guideGeneratedAt, setGuideGeneratedAt] = useState<string | null>(null);
  const [isLoadingGuide, setIsLoadingGuide] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await fetch(`/api/jobs/${job.id}/interview-guide`);
        if (response.ok) {
          const data = await response.json();
          setInterviewGuide(data.guide);
          setGuideGeneratedAt(data.generated_at);
        }
      } catch (error) {
        console.error("Failed to fetch interview guide:", error);
      } finally {
        setIsLoadingGuide(false);
      }
    };
    fetchGuide();
  }, [job.id]);

  const handleGenerateGuide = async () => {
    const response = await fetch(`/api/jobs/${job.id}/interview-guide`, { method: "POST" });
    if (response.ok) {
      const data = await response.json();
      setInterviewGuide(data.guide);
      setGuideGeneratedAt(data.generated_at);
    }
  };

  const handleSaveRecruiter = async (data: { recruiter_name: string; recruiter_email: string; recruiter_title: string; recruiter_source: 'manual'; }) => {
    await onUpdate(job.id, data);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "roadmap", label: "Roadmap", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
    { id: "guide", label: "Prep Guide", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: "recruiter", label: "Recruiter", icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{job.company_name}</h2>
                <p className="text-sm text-gray-600">{job.job_title}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${job.status === "rejected" ? "bg-red-100 text-red-700" : job.status === "offer" ? "bg-green-100 text-green-700" : job.status === "interview" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-brand-blue"}`}>{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</span>
              {job.date_applied && <span className="text-xs text-gray-500">Applied {new Date(job.date_applied).toLocaleDateString()}</span>}
            </div>
          </div>

          <div className="border-b">
            <div className="flex">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-blue-600 text-brand-blue" : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"}`}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === "roadmap" && <InterviewRoadmap jobId={job.id} />}
            {activeTab === "guide" && (isLoadingGuide ? <div className="flex items-center justify-center py-12"><svg className="animate-spin w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg></div> : <InterviewGuideDisplay jobId={job.id} guide={interviewGuide} generatedAt={guideGeneratedAt} onGenerate={handleGenerateGuide} />)}
            {activeTab === "recruiter" && <RecruiterInfo recruiterName={job.recruiter_name} recruiterEmail={job.recruiter_email} recruiterTitle={job.recruiter_title} recruiterSource={job.recruiter_source} onSave={handleSaveRecruiter} />}
          </div>
        </div>
      </div>
    </div>
  );
}
