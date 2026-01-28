"use client";

import { useState } from "react";

interface RecruiterInfoProps {
  recruiterName: string | null;
  recruiterEmail: string | null;
  recruiterTitle: string | null;
  recruiterSource: 'email' | 'job_description' | 'manual' | null;
  onSave: (data: {
    recruiter_name: string;
    recruiter_email: string;
    recruiter_title: string;
    recruiter_source: 'manual';
  }) => Promise<void>;
}

export default function RecruiterInfo({
  recruiterName,
  recruiterEmail,
  recruiterTitle,
  recruiterSource,
  onSave,
}: RecruiterInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(recruiterName || "");
  const [email, setEmail] = useState(recruiterEmail || "");
  const [title, setTitle] = useState(recruiterTitle || "");

  const hasRecruiter = recruiterName || recruiterEmail;

  const getSourceBadge = () => {
    if (!recruiterSource) return null;
    const labels = { email: "From Email", job_description: "From Job Description", manual: "Manually Added" };
    const colors = { email: "bg-blue-100 text-brand-blue", job_description: "bg-purple-100 text-purple-700", manual: "bg-gray-100 text-gray-700" };
    return <span className={`text-xs px-2 py-0.5 rounded ${colors[recruiterSource]}`}>{labels[recruiterSource]}</span>;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ recruiter_name: name, recruiter_email: email, recruiter_title: title, recruiter_source: 'manual' });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save recruiter info:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Recruiter / Hiring Manager</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Smith" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., john.smith@company.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Senior Recruiter" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-brand-gold text-gray-900 rounded-lg hover:bg-brand-gold-dark disabled:opacity-50">{isSaving ? "Saving..." : "Save"}</button>
          <button onClick={() => { setName(recruiterName || ""); setEmail(recruiterEmail || ""); setTitle(recruiterTitle || ""); setIsEditing(false); }} disabled={isSaving} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    );
  }

  if (!hasRecruiter) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h3 className="font-medium text-gray-900 mb-2">No Recruiter Info</h3>
        <p className="text-sm text-gray-500 mb-4">Add recruiter or hiring manager contact information</p>
        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-brand-gold text-gray-900 rounded-lg hover:bg-brand-gold-dark">Add Recruiter</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Recruiter / Hiring Manager</h3>
        {getSourceBadge()}
      </div>
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {recruiterName && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-brand-blue font-semibold">{recruiterName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{recruiterName}</div>
              {recruiterTitle && <div className="text-sm text-gray-500">{recruiterTitle}</div>}
            </div>
          </div>
        )}
        {recruiterEmail && (
          <a href={`mailto:${recruiterEmail}`} className="flex items-center gap-2 text-brand-blue hover:text-blue-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {recruiterEmail}
          </a>
        )}
      </div>
      <button onClick={() => setIsEditing(true)} className="text-sm text-brand-blue hover:text-blue-800">Edit Contact Info</button>
    </div>
  );
}
