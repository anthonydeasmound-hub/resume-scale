"use client";

import { LinkedInData, Step, EntryPath } from "./types";

interface EntryStepProps {
  setEntryPath: (path: EntryPath) => void;
  setStep: (step: Step) => void;
  setEditableData: (data: LinkedInData) => void;
  sessionUserName?: string | null;
  sessionUserEmail?: string | null;
}

export default function EntryStep({
  setEntryPath,
  setStep,
  setEditableData,
  sessionUserName,
  sessionUserEmail,
}: EntryStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center">
        How would you like to get started?
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Choose the option that works best for you
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Resume Option */}
        <button
          onClick={() => {
            setEntryPath("upload");
            setStep("upload");
          }}
          className="group p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
        >
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-blue-light0 group-hover:text-white transition-colors">
            <svg className="w-7 h-7 text-brand-blue group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Resume</h3>
          <p className="text-sm text-gray-500">
            Upload your existing resume (PDF, DOCX) or paste the text. Our AI will extract your information.
          </p>
        </button>

        {/* Import LinkedIn Option */}
        <button
          onClick={() => {
            setEntryPath("linkedin");
            setStep("connect");
          }}
          className="group p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
        >
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-gold group-hover:text-white transition-colors">
            <svg className="w-7 h-7 text-brand-blue group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Import from LinkedIn</h3>
          <p className="text-sm text-gray-500">
            Automatically import your work history, education, and skills from your LinkedIn profile.
          </p>
        </button>

        {/* Start Fresh Option */}
        <button
          onClick={() => {
            setEntryPath("fresh");
            setEditableData({
              contact_info: {
                name: sessionUserName || "",
                email: sessionUserEmail || "",
                phone: "",
                location: "",
                linkedin: "",
              },
              work_experience: [],
              education: [],
              skills: [],
              certifications: [],
              languages: [],
              honors: [],
            });
            setStep("template");
          }}
          className="group p-6 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all duration-200 text-left"
        >
          <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500 group-hover:text-white transition-colors">
            <svg className="w-7 h-7 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Fresh</h3>
          <p className="text-sm text-gray-500">
            Build your resume from scratch with AI-powered suggestions to help you along the way.
          </p>
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Don&apos;t worry, you can always edit your information later
      </p>
    </div>
  );
}
