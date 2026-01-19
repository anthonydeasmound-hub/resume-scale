"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ParsedResume } from "@/lib/gemini";

type Step = "upload" | "manual" | "review" | "saving";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [resumeText, setResumeText] = useState("");
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setLoading(true);
    setError("");
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload PDF");
      }

      const { text } = await uploadResponse.json();

      // Defensive check - ensure text is a string
      if (!text || typeof text !== "string" || text.trim().length < 50) {
        // PDF extraction failed or returned minimal text
        setResumeText("");
        setError("Could not extract text from PDF. Please paste your resume text manually.");
        setStep("manual");
        setLoading(false);
        return;
      }

      setResumeText(text);

      // Auto-parse the extracted text
      const parseResponse = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });

      if (!parseResponse.ok) {
        // Check if it's a rate limit error
        const errorData = await parseResponse.json().catch(() => ({}));
        if (parseResponse.status === 429 || errorData.error === "rate_limit") {
          setError("AI service is temporarily busy. Please wait about 30 seconds and click 'Parse Resume' to try again.");
        } else {
          setError("Could not parse resume automatically. Please review the text below.");
        }
        setStep("manual");
        setLoading(false);
        return;
      }

      const data = await parseResponse.json();
      setParsedData(data);
      setStep("review");
    } catch (err) {
      console.error(err);
      setError("Failed to process PDF. Please paste your resume text manually.");
      setStep("manual");
    } finally {
      setLoading(false);
    }
  };

  const handleManualParse = async () => {
    if (!resumeText.trim()) {
      setError("Please paste your resume text");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const parseResponse = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json().catch(() => ({}));
        if (parseResponse.status === 429 || errorData.error === "rate_limit") {
          setError("AI service is temporarily busy. Please wait about 30 seconds and try again.");
        } else {
          setError("Failed to parse resume. Please try again.");
        }
        return;
      }

      const data = await parseResponse.json();
      setParsedData(data);
      setStep("review");
    } catch (err) {
      console.error(err);
      setError("Failed to parse resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  const handleSave = async () => {
    if (!parsedData) return;

    setStep("saving");
    setError("");

    try {
      const response = await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsedData,
          raw_text: resumeText,
        }),
      });

      if (!response.ok) throw new Error("Failed to save resume");

      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save resume. Please try again.");
      setStep("review");
      console.error(err);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to ResumeScale</h1>
          <p className="text-gray-600 mt-2">
            Let&apos;s get started by importing your resume
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === "upload" || step === "manual" ? "bg-blue-600 text-white" : "bg-green-500 text-white"}`}>
            {step === "upload" || step === "manual" ? "1" : "✓"}
          </div>
          <div className={`flex-1 h-1 mx-2 ${step === "review" || step === "saving" ? "bg-green-500" : "bg-gray-200"}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step === "review" ? "bg-blue-600 text-white" : step === "saving" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
            {step === "saving" ? "✓" : "2"}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Your Resume
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Upload a PDF of your resume. Our AI will extract your experience, skills, and education.
            </p>

            {/* File Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3" />
                  <p className="text-gray-600">Processing {fileName}...</p>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-700 font-medium">Click to upload PDF</p>
                  <p className="text-gray-500 text-sm mt-1">or drag and drop</p>
                </>
              )}
            </div>

            {/* Manual entry option */}
            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => setStep("manual")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Or paste your resume text manually
              </button>
              <br />
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === "manual" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Paste Your Resume
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Copy and paste the text from your resume below. Our AI will extract your information.
            </p>
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => {
                  setStep("upload");
                  setError("");
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleManualParse}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Parsing..." : "Parse Resume"}
              </button>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === "review" && parsedData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Review Extracted Data
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Please review the information we extracted from your resume.
            </p>

            {/* Contact Info */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Contact Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                <p><span className="text-gray-500">Name:</span> <span className="text-gray-900">{parsedData.contact_info.name}</span></p>
                <p><span className="text-gray-500">Email:</span> <span className="text-gray-900">{parsedData.contact_info.email}</span></p>
                <p><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{parsedData.contact_info.phone}</span></p>
                <p><span className="text-gray-500">Location:</span> <span className="text-gray-900">{parsedData.contact_info.location}</span></p>
              </div>
            </div>

            {/* Work Experience */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Work Experience</h3>
              <div className="space-y-3">
                {parsedData.work_experience.map((job, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-gray-600">{job.company}</p>
                    <p className="text-sm text-gray-500">{job.start_date} - {job.end_date}</p>
                    <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                      {job.description.slice(0, 3).map((desc, i) => (
                        <li key={i}>{desc}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Education</h3>
              <div className="space-y-2">
                {parsedData.education.map((edu, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{edu.degree} in {edu.field}</p>
                    <p className="text-gray-600">{edu.institution}</p>
                    <p className="text-sm text-gray-500">{edu.graduation_date}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("manual")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Confirm & Continue
              </button>
            </div>
          </div>
        )}

        {step === "saving" && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Saving your profile...</p>
          </div>
        )}
      </div>
    </div>
  );
}
