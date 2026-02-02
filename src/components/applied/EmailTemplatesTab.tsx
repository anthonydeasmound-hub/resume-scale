"use client";

import React, { useState } from "react";
import { showToast } from "@/components/Toast";

interface EmailTemplatesTabProps {
  jobId: number;
  companyName: string;
  jobTitle: string;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  interviewStage?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: "thank_you" | "follow_up" | "networking" | "status_inquiry";
  icon: React.ReactNode;
  description: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "thank_you",
    name: "Thank You Email",
    type: "thank_you",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    description: "Send after an interview to express gratitude",
  },
  {
    id: "follow_up",
    name: "Follow-Up Email",
    type: "follow_up",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    description: "Check in on your application status",
  },
  {
    id: "networking",
    name: "Networking Outreach",
    type: "networking",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    description: "Reach out to someone at the company",
  },
  {
    id: "status_inquiry",
    name: "Status Inquiry",
    type: "status_inquiry",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: "Politely ask about the hiring timeline",
  },
];

export default function EmailTemplatesTab({
  jobId,
  companyName,
  jobTitle,
  recruiterName,
  recruiterEmail,
  interviewStage,
}: EmailTemplatesTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateEmail = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setGenerating(true);
    setGeneratedEmail("");

    try {
      const res = await fetch(`/api/jobs/${jobId}/emails/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: template.type,
          recruiterName: recruiterName || undefined,
          interviewStage: interviewStage || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedEmail(data.email || data.body || "");
      } else {
        showToast("error", "Failed to generate email");
      }
    } catch (error) {
      console.error("Failed to generate email:", error);
      showToast("error", "Failed to generate email");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedEmail);
      setCopied(true);
      showToast("success", "Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const openInGmail = () => {
    const subject = selectedTemplate?.type === "thank_you"
      ? `Thank you - ${jobTitle} Interview`
      : selectedTemplate?.type === "follow_up"
      ? `Following up - ${jobTitle} Application`
      : `Regarding ${jobTitle} Position at ${companyName}`;

    const mailtoUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recruiterEmail || ""}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(generatedEmail)}`;
    window.open(mailtoUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Templates</h3>
        <div className="grid grid-cols-2 gap-3">
          {EMAIL_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => generateEmail(template)}
              disabled={generating}
              className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                selectedTemplate?.id === template.id
                  ? "border-brand-blue bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              <div
                className={`p-2 rounded-lg ${
                  selectedTemplate?.id === template.id
                    ? "bg-brand-blue text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {template.icon}
              </div>
              <div>
                <p className="font-medium text-gray-900">{template.name}</p>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generated Email */}
      {(generating || generatedEmail) && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedTemplate?.name}
            </h3>
            {generatedEmail && (
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={openInGmail}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                  Open in Gmail
                </button>
              </div>
            )}
          </div>

          {generating ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-500">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating personalized email...
              </div>
            </div>
          ) : (
            <textarea
              value={generatedEmail}
              onChange={(e) => setGeneratedEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-4 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
              rows={12}
              placeholder="Generated email will appear here..."
            />
          )}

          {recruiterEmail && generatedEmail && (
            <p className="text-sm text-gray-500 mt-3">
              Will be sent to: <span className="font-medium">{recruiterEmail}</span>
            </p>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
        <h4 className="font-medium text-gray-900 mb-2">Tips for effective emails</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Personalize the template with specific details from your interview</li>
          <li>• Keep it concise - recruiters receive many emails</li>
          <li>• Send thank you emails within 24 hours of your interview</li>
          <li>• Wait 1-2 weeks before sending a follow-up if you haven&apos;t heard back</li>
        </ul>
      </div>
    </div>
  );
}
