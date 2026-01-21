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

type Step = "connect" | "import" | "review" | "saving";

function OnboardingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("connect");
  const [token, setToken] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [linkedinData, setLinkedinData] = useState<LinkedInData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setStep("review");
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
    if (!linkedinData) return;

    setStep("saving");
    setError("");

    try {
      const response = await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkedinData),
      });

      if (!response.ok) throw new Error("Failed to save");

      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      setStep("review");
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
      case "import": return 2;
      case "review": return 3;
      case "saving": return 4;
      default: return 1;
    }
  };

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
          {[1, 2, 3].map((num, idx) => (
            <div key={num} className="flex items-center flex-1">
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
              {idx < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
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

        {/* Step 3: Review Imported Data */}
        {step === "review" && linkedinData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Review Your Information</h2>
                <p className="text-gray-600 text-sm">Verify the data imported from LinkedIn</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Contact Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="text-gray-500">Name:</span> {linkedinData.contact_info.name || "—"}</p>
                <p><span className="text-gray-500">Email:</span> {linkedinData.contact_info.email || "—"}</p>
                <p><span className="text-gray-500">Location:</span> {linkedinData.contact_info.location || "—"}</p>
                <p><span className="text-gray-500">LinkedIn:</span> {linkedinData.contact_info.linkedin || "—"}</p>
              </div>
            </div>

            {/* Work Experience */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">
                Work Experience
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({linkedinData.work_experience.length} positions)
                </span>
              </h3>
              {linkedinData.work_experience.length > 0 ? (
                <div className="text-sm text-gray-600 space-y-2">
                  {linkedinData.work_experience.slice(0, 3).map((exp, idx) => (
                    <div key={idx} className="pb-2 border-b border-gray-200 last:border-0">
                      <p className="font-medium text-gray-700">{exp.title}</p>
                      <p>{exp.company}</p>
                      <p className="text-gray-500">{exp.start_date} - {exp.end_date}</p>
                    </div>
                  ))}
                  {linkedinData.work_experience.length > 3 && (
                    <p className="text-gray-400">+{linkedinData.work_experience.length - 3} more</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No work experience found</p>
              )}
            </div>

            {/* Education */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">
                Education
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({linkedinData.education.length} entries)
                </span>
              </h3>
              {linkedinData.education.length > 0 ? (
                <div className="text-sm text-gray-600 space-y-1">
                  {linkedinData.education.slice(0, 2).map((edu, idx) => (
                    <p key={idx}>{edu.degree} {edu.field && `in ${edu.field}`} - {edu.institution}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No education found</p>
              )}
            </div>

            {/* Skills */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">
                Skills
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({linkedinData.skills.length} skills)
                </span>
              </h3>
              {linkedinData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {linkedinData.skills.slice(0, 10).map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {linkedinData.skills.length > 10 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                      +{linkedinData.skills.length - 10} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No skills found</p>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-4 text-center">
              You can edit this information anytime in the Master Resume tab.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("import")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Re-import
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Save & Continue
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
