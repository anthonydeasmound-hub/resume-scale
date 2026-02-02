"use client";

import React, { useState, useEffect } from "react";
import { showToast } from "@/components/Toast";

interface InterviewPrepTabProps {
  jobId: number;
  companyName: string;
  jobTitle: string;
  jobDescription: string | null;
  existingGuide?: string | null;
}

interface InterviewGuide {
  company_overview?: string;
  role_summary?: string;
  key_requirements?: string[];
  technical_questions?: { question: string; tips: string }[];
  behavioral_questions?: { question: string; tips: string }[];
  questions_to_ask?: string[];
  preparation_tips?: string[];
}

export default function InterviewPrepTab({
  jobId,
  companyName,
  jobTitle,
  jobDescription,
  existingGuide,
}: InterviewPrepTabProps) {
  const [guide, setGuide] = useState<InterviewGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["overview", "questions"]));

  useEffect(() => {
    if (existingGuide) {
      try {
        setGuide(JSON.parse(existingGuide));
      } catch (e) {
        console.error("Failed to parse existing guide:", e);
      }
    }
  }, [existingGuide]);

  const generateGuide = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/interview-guide`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setGuide(data.guide);
        showToast("success", "Interview guide generated");
      } else {
        showToast("error", "Failed to generate guide");
      }
    } catch (error) {
      console.error("Failed to generate guide:", error);
      showToast("error", "Failed to generate guide");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!guide && !loading) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview Prep Packet</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Get a personalized interview preparation guide with company research, common questions, and tips tailored to this role.
        </p>
        <button
          onClick={generateGuide}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Generate Interview Guide
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Generating your personalized interview guide...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Company Overview */}
      {guide?.company_overview && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <button
            onClick={() => toggleSection("overview")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Company Overview</h3>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has("overview") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("overview") && (
            <div className="px-4 pb-4">
              <p className="text-gray-600 leading-relaxed">{guide.company_overview}</p>
            </div>
          )}
        </div>
      )}

      {/* Role Summary */}
      {guide?.role_summary && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <button
            onClick={() => toggleSection("role")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Role Summary</h3>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has("role") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("role") && (
            <div className="px-4 pb-4">
              <p className="text-gray-600 leading-relaxed">{guide.role_summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Key Requirements */}
      {guide?.key_requirements && guide.key_requirements.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <button
            onClick={() => toggleSection("requirements")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Key Requirements</h3>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has("requirements") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("requirements") && (
            <div className="px-4 pb-4">
              <ul className="space-y-2">
                {guide.key_requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Technical Questions */}
      {guide?.technical_questions && guide.technical_questions.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <button
            onClick={() => toggleSection("technical")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Technical Questions</h3>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has("technical") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("technical") && (
            <div className="px-4 pb-4 space-y-4">
              {guide.technical_questions.map((q, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">{q.question}</p>
                  <p className="text-sm text-gray-600">
                    <span className="text-purple-600 font-medium">Tip:</span> {q.tips}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Behavioral Questions */}
      {guide?.behavioral_questions && guide.behavioral_questions.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <button
            onClick={() => toggleSection("behavioral")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Behavioral Questions</h3>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has("behavioral") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("behavioral") && (
            <div className="px-4 pb-4 space-y-4">
              {guide.behavioral_questions.map((q, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">{q.question}</p>
                  <p className="text-sm text-gray-600">
                    <span className="text-orange-600 font-medium">Tip:</span> {q.tips}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Questions to Ask */}
      {guide?.questions_to_ask && guide.questions_to_ask.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <button
            onClick={() => toggleSection("questions")}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Questions to Ask</h3>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has("questions") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.has("questions") && (
            <div className="px-4 pb-4">
              <ul className="space-y-2">
                {guide.questions_to_ask.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-600">
                    <span className="text-indigo-500 font-medium">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Regenerate button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={generateGuide}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Regenerate Guide
        </button>
      </div>
    </div>
  );
}
