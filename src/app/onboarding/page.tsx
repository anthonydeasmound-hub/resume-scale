"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

interface LinkedInData {
  contact_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  work_experience: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduation_date: string;
  }>;
  skills: string[];
}

type Step = "connect" | "import" | "work-experience" | "achievements" | "skills" | "saving";

function OnboardingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("connect");
  const [token, setToken] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [linkedinData, setLinkedinData] = useState<LinkedInData | null>(null);
  const [editableData, setEditableData] = useState<LinkedInData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch token on mount
  useEffect(() => {
    if (session) {
      fetchToken();
    }
  }, [session]);

  // Check for LinkedIn import result
  useEffect(() => {
    const importStatus = searchParams.get("linkedin_import");
    const errorMessage = searchParams.get("message");

    if (importStatus === "success") {
      fetchLinkedInData();
    } else if (importStatus === "error") {
      setError(errorMessage || "Failed to import LinkedIn data. Please try again.");
      setStep("import");
    }
  }, [searchParams]);

  const fetchToken = async () => {
    try {
      const response = await fetch("/api/extension/token");
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
      }
    } catch (err) {
      console.error("Failed to fetch token:", err);
    }
  };

  const fetchLinkedInData = async () => {
    setLoading(true);
    try {
      // Uses session auth, no token needed
      const response = await fetch("/api/linkedin/parse-profile");

      if (response.ok) {
        const result = await response.json();
        setLinkedinData(result.data);
        setEditableData(JSON.parse(JSON.stringify(result.data))); // Deep copy for editing
        setStep("work-experience");
      } else if (response.status === 404) {
        setError("No imported data found. Please try importing again.");
        setStep("import");
      } else {
        setError("Could not retrieve imported data. Please try again.");
        setStep("import");
      }
    } catch (err) {
      console.error("Failed to fetch LinkedIn data:", err);
      setError("Failed to retrieve imported data.");
      setStep("import");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleImportLinkedIn = () => {
    // Open LinkedIn profile page with auto-import parameter
    window.open("https://www.linkedin.com/in/me?resumescale_import=auto", "_blank");
  };

  const handleSave = async () => {
    if (!editableData) return;

    setStep("saving");
    setError("");

    try {
      const response = await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableData),
      });

      if (!response.ok) throw new Error("Failed to save");

      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      setStep("skills");
      console.error(err);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const getStepNumber = () => {
    switch (step) {
      case "connect": return 1;
      case "import": return 1;
      case "work-experience": return 2;
      case "achievements": return 3;
      case "skills": return 4;
      case "saving": return 5;
      default: return 1;
    }
  };

  const stepLabels = ["Import", "Experience", "Achievements", "Skills", "Complete"];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to ResumeScale</h1>
          <p className="text-gray-600 mt-2">
            Connect your LinkedIn to import your profile
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center mb-8">
          {[1, 2, 3, 4, 5].map((num, idx) => (
            <div key={num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    getStepNumber() > num
                      ? "bg-green-500 text-white"
                      : getStepNumber() === num
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {getStepNumber() > num ? "✓" : num}
                </div>
                <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{stepLabels[idx]}</span>
              </div>
              {idx < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 mb-5 ${
                    getStepNumber() > num ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={() => setError("")}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Step 1: Connect Extension */}
        {step === "connect" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Step 1: Connect the Chrome Extension
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Install the ResumeScale Chrome extension and connect it using your personal token.
            </p>

            {/* Extension Install Link */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Install Extension</h3>
              <p className="text-sm text-gray-600 mb-3">
                Load the extension from your local folder:
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1 mb-3">
                <li>Open Chrome and go to <code className="bg-gray-200 px-1 rounded">chrome://extensions</code></li>
                <li>Enable &quot;Developer mode&quot; (top right toggle)</li>
                <li>Click &quot;Load unpacked&quot;</li>
                <li>Select the extension folder</li>
              </ol>
              <div className="bg-white p-2 rounded border text-xs font-mono text-gray-700 break-all">
                ~/my-app/my-first-app/resumescale-extension
              </div>
            </div>

            {/* Token Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Your Connection Token</h3>
              <p className="text-sm text-gray-600 mb-3">
                Copy this token and paste it into the extension popup to connect.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={token}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
                />
                <button
                  onClick={copyToken}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    tokenCopied
                      ? "bg-green-500 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {tokenCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSkip}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={() => setStep("import")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Extension Connected
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Import from LinkedIn */}
        {step === "import" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Step 2: Import from LinkedIn
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Click the button below to open your LinkedIn profile. The extension will automatically import your work experience, education, and skills.
            </p>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">LinkedIn Profile Import</h3>
                  <p className="text-sm text-gray-600">Make sure you&apos;re logged into LinkedIn</p>
                </div>
              </div>

              <button
                onClick={handleImportLinkedIn}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Importing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import from LinkedIn
                  </>
                )}
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6 text-center">
              After clicking, wait for the import to complete. You&apos;ll be redirected back here automatically.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("connect")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Work Experience */}
        {step === "work-experience" && editableData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Work Experience</h2>
                <p className="text-gray-600 text-sm">Review and edit your job history</p>
              </div>
            </div>

            {editableData.work_experience.length > 0 ? (
              <div className="space-y-4 mb-6">
                {editableData.work_experience.map((exp, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg relative">
                    <button
                      onClick={() => {
                        const updated = { ...editableData };
                        updated.work_experience = updated.work_experience.filter((_, i) => i !== idx);
                        setEditableData(updated);
                      }}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove job"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const updated = { ...editableData };
                            updated.work_experience[idx].title = e.target.value;
                            setEditableData(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = { ...editableData };
                            updated.work_experience[idx].company = e.target.value;
                            setEditableData(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                          type="text"
                          value={exp.start_date}
                          onChange={(e) => {
                            const updated = { ...editableData };
                            updated.work_experience[idx].start_date = e.target.value;
                            setEditableData(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Jan 2020"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                        <input
                          type="text"
                          value={exp.end_date}
                          onChange={(e) => {
                            const updated = { ...editableData };
                            updated.work_experience[idx].end_date = e.target.value;
                            setEditableData(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Present"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-6 text-center py-8">No work experience found</p>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep("import")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("achievements")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Achievements */}
        {step === "achievements" && editableData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Achievements</h2>
                <p className="text-gray-600 text-sm">Edit bullet points from your work experience</p>
              </div>
            </div>

            <div className="space-y-6 mb-6 max-h-96 overflow-y-auto">
              {editableData.work_experience.map((exp, jobIdx) => (
                <div key={jobIdx} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">
                    {exp.title} at {exp.company}
                  </h3>
                  <div className="space-y-2">
                    {exp.description.map((bullet, bulletIdx) => (
                      <div key={bulletIdx} className="flex gap-2">
                        <span className="text-gray-400 mt-2">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const updated = { ...editableData };
                            updated.work_experience[jobIdx].description[bulletIdx] = e.target.value;
                            setEditableData(updated);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => {
                            const updated = { ...editableData };
                            updated.work_experience[jobIdx].description = updated.work_experience[jobIdx].description.filter((_, i) => i !== bulletIdx);
                            setEditableData(updated);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove bullet"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const updated = { ...editableData };
                        updated.work_experience[jobIdx].description.push("");
                        setEditableData(updated);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add bullet point
                    </button>
                  </div>
                </div>
              ))}
              {editableData.work_experience.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No work experience to show achievements</p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("work-experience")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("skills")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Skills */}
        {step === "skills" && editableData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Skills</h2>
                <p className="text-gray-600 text-sm">Review and edit your skills</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {editableData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => {
                        const updated = { ...editableData };
                        updated.skills = updated.skills.filter((_, i) => i !== idx);
                        setEditableData(updated);
                      }}
                      className="text-blue-500 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {editableData.skills.length === 0 && (
                  <p className="text-sm text-gray-400">No skills added yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSkill.trim()) {
                      const updated = { ...editableData };
                      updated.skills = [...updated.skills, newSkill.trim()];
                      setEditableData(updated);
                      setNewSkill("");
                    }
                  }}
                  placeholder="Add a skill..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    if (newSkill.trim()) {
                      const updated = { ...editableData };
                      updated.skills = [...updated.skills, newSkill.trim()];
                      setEditableData(updated);
                      setNewSkill("");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4 text-center">
              You can edit this information anytime in the Master Resume tab.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("achievements")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
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

        {/* Saving State */}
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

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
