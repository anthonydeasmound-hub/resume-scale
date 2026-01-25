"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";

interface Certification {
  name: string;
  issuer: string;
  date: string;
}

interface Honor {
  title: string;
  issuer: string;
  date: string;
}

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
  certifications: Certification[];
  languages: string[];
  honors: Honor[];
  profile_picture_url?: string;
}

type Step = "connect" | "import" | "work-experience" | "achievements" | "skills" | "certifications" | "languages" | "honors" | "saving";

// Helper to parse date string like "Apr 2023" into sortable value
function parseDateToNumber(dateStr: string): number {
  if (!dateStr) return 0;
  const lower = dateStr.toLowerCase();
  if (lower === "present" || lower === "current") return Date.now();

  const months: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11
  };

  const parts = dateStr.trim().split(/[\s,]+/);
  let month = 0;
  let year = new Date().getFullYear();

  for (const part of parts) {
    const monthNum = months[part.toLowerCase()];
    if (monthNum !== undefined) {
      month = monthNum;
    } else if (/^\d{4}$/.test(part)) {
      year = parseInt(part);
    }
  }

  return new Date(year, month, 1).getTime();
}

/**
 * Check if a string looks like a LinkedIn skills badge
 * e.g., "Quota Achievement, Sales and +5 skills"
 */
function isLinkedInSkillsBadge(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (!trimmed) return true;

  // Contains "+X skills" pattern
  if (/\+\d+\s*skills?/i.test(trimmed)) return true;

  // Ends with "skills"
  if (/skills?$/i.test(trimmed)) return true;

  // Short comma-separated text without periods (likely just skill names)
  if (trimmed.length < 100 && trimmed.split(',').length >= 2 && !trimmed.includes('.')) return true;

  return false;
}

// Sort work experience by start date (most recent first) and remove duplicates
function processWorkExperience(experiences: LinkedInData["work_experience"]): LinkedInData["work_experience"] {
  // Remove duplicates based on company + title + dates
  const seen = new Set<string>();
  const deduped = experiences.filter(exp => {
    // Skip entries with empty title
    if (!exp.title || exp.title.trim() === "") return false;

    const key = `${exp.company}|${exp.title}|${exp.start_date}|${exp.end_date}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by start date descending (most recent first)
  const sorted = deduped.sort((a, b) => {
    const dateA = parseDateToNumber(a.start_date);
    const dateB = parseDateToNumber(b.start_date);
    return dateB - dateA; // Descending order
  });

  // Filter out LinkedIn skills badges from descriptions
  return sorted.map(exp => ({
    ...exp,
    description: exp.description.filter(d => !isLinkedInSkillsBadge(d)),
  }));
}

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
  const [aiRecommendations, setAiRecommendations] = useState<Record<number, string[]>>({});
  const [loadingRecommendations, setLoadingRecommendations] = useState<Record<number, boolean>>({});
  const [expandedSuggestions, setExpandedSuggestions] = useState<Record<number, boolean>>({});
  const [regeneratingBullets, setRegeneratingBullets] = useState<Record<string, boolean>>({}); // key: "jobIdx-recIdx"
  const fetchedJobsRef = useRef<Set<number>>(new Set());

  // Skill suggestions state
  interface SkillSuggestions {
    hardSkills: string[];
    softSkills: string[];
    tools: string[];
  }
  const [skillSuggestions, setSkillSuggestions] = useState<SkillSuggestions | null>(null);
  const [loadingSkillSuggestions, setLoadingSkillSuggestions] = useState(false);
  const [expandedSkillCategory, setExpandedSkillCategory] = useState<Record<string, boolean>>({});
  const skillSuggestionsFetchedRef = useRef(false);

  // Constants for limits
  const MAX_BULLETS_PER_ROLE = 4;
  const INITIAL_SUGGESTIONS_SHOWN = 4;
  const INITIAL_SKILLS_SHOWN = 4;

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

  // Fetch AI recommendations when entering achievements step
  useEffect(() => {
    if (step === "achievements" && editableData) {
      editableData.work_experience.forEach((exp, jobIdx) => {
        // Only fetch if we haven't already fetched for this job (using ref to avoid stale closure)
        if (!fetchedJobsRef.current.has(jobIdx)) {
          fetchedJobsRef.current.add(jobIdx);
          fetchRecommendationsForJob(jobIdx, exp);
        }
      });
    }
  }, [step, editableData]);

  // Fetch skill suggestions when entering skills step
  useEffect(() => {
    if (step === "skills" && editableData && !skillSuggestionsFetchedRef.current) {
      skillSuggestionsFetchedRef.current = true;
      fetchSkillSuggestions();
    }
  }, [step, editableData]);

  const fetchSkillSuggestions = async () => {
    if (!editableData) return;
    setLoadingSkillSuggestions(true);

    const roles = editableData.work_experience.map((exp) => ({
      title: exp.title,
      company: exp.company,
    }));

    try {
      const response = await fetch("/api/ai/generate-onboarding-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roles,
          existingSkills: editableData.skills,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSkillSuggestions(data);
      } else {
        console.error("Failed to fetch skill suggestions:", await response.text());
      }
    } catch (err) {
      console.error("Error fetching skill suggestions:", err);
    } finally {
      setLoadingSkillSuggestions(false);
    }
  };

  const fetchRecommendationsForJob = async (
    jobIdx: number,
    exp: { company: string; title: string; description: string[] }
  ) => {
    setLoadingRecommendations((prev) => ({ ...prev, [jobIdx]: true }));

    const requestBody = {
      role: { company: exp.company, title: exp.title },
      existingBullets: exp.description.filter((b) => b.trim() !== ""),
    };
    console.log("Fetching AI recommendations for:", requestBody);

    try {
      const response = await fetch("/api/ai/generate-onboarding-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setAiRecommendations((prev) => ({ ...prev, [jobIdx]: data.bullets }));
      } else {
        // Mark as null to show "unavailable" message instead of loading forever
        setAiRecommendations((prev) => ({ ...prev, [jobIdx]: null as unknown as string[] }));
        const errorData = await response.json().catch(() => ({}));
        console.error("API error:", response.status, errorData);
      }
    } catch (err) {
      console.error("Failed to fetch AI recommendations:", err);
    } finally {
      setLoadingRecommendations((prev) => ({ ...prev, [jobIdx]: false }));
    }
  };

  const handleBulletFeedback = async (
    jobIdx: number,
    recIdx: number,
    bullet: string,
    feedback: 'up' | 'down',
    exp: { company: string; title: string; description: string[] }
  ) => {
    const key = `${jobIdx}-${recIdx}`;

    if (feedback === 'up') {
      // Add bullet to work experience
      if (editableData) {
        const currentBulletCount = exp.description.filter(b => b.trim() !== "").length;
        if (currentBulletCount < MAX_BULLETS_PER_ROLE) {
          const updated = { ...editableData };
          const emptyIdx = updated.work_experience[jobIdx].description.findIndex(
            (b) => b.trim() === ""
          );
          if (emptyIdx !== -1) {
            updated.work_experience[jobIdx].description[emptyIdx] = bullet;
          } else {
            updated.work_experience[jobIdx].description.push(bullet);
          }
          setEditableData(updated);
        }
      }

      // Remove from suggestions
      setAiRecommendations((prev) => ({
        ...prev,
        [jobIdx]: prev[jobIdx].filter((_, i) => i !== recIdx),
      }));

      // Record positive feedback (fire and forget)
      fetch("/api/ai/regenerate-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: { company: exp.company, title: exp.title },
          rejectedBullet: bullet,
          existingBullets: exp.description.filter(b => b.trim() !== ""),
          feedback: 'up',
        }),
      }).catch(console.error);
    } else {
      // Thumbs down - regenerate
      setRegeneratingBullets((prev) => ({ ...prev, [key]: true }));

      try {
        const response = await fetch("/api/ai/regenerate-bullet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: { company: exp.company, title: exp.title },
            rejectedBullet: bullet,
            existingBullets: exp.description.filter(b => b.trim() !== ""),
            feedback: 'down',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.bullet) {
            // Replace the rejected bullet with the new one
            setAiRecommendations((prev) => ({
              ...prev,
              [jobIdx]: prev[jobIdx].map((b, i) => (i === recIdx ? data.bullet : b)),
            }));
          }
        }
      } catch (err) {
        console.error("Failed to regenerate bullet:", err);
      } finally {
        setRegeneratingBullets((prev) => ({ ...prev, [key]: false }));
      }
    }
  };

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
        // Deep copy and process work experience (sort by date, remove duplicates)
        const processedData = JSON.parse(JSON.stringify(result.data)) as LinkedInData;
        processedData.work_experience = processWorkExperience(processedData.work_experience);
        // Initialize new fields if not present
        processedData.certifications = processedData.certifications || [];
        processedData.languages = processedData.languages || [];
        processedData.honors = processedData.honors || [];
        setEditableData(processedData);
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
    // Open LinkedIn profile with auto-import parameter
    // The Chrome extension will detect this and capture the page
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
        body: JSON.stringify({
          contact_info: editableData.contact_info,
          work_experience: editableData.work_experience,
          skills: editableData.skills,
          education: editableData.education,
          certifications: editableData.certifications,
          languages: editableData.languages,
          honors: editableData.honors,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      setStep("honors");
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
      case "certifications": return 5;
      case "languages": return 6;
      case "honors": return 7;
      case "saving": return 8;
      default: return 1;
    }
  };

  const stepLabels = ["Import", "Experience", "Achievements", "Skills", "Certs", "Languages", "Honors", "Complete"];

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
        <div className="flex items-center mb-8 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num, idx) => (
            <div key={num} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                    getStepNumber() > num
                      ? "bg-green-500 text-white"
                      : getStepNumber() === num
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {getStepNumber() > num ? "✓" : num}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">{stepLabels[idx]}</span>
              </div>
              {idx < 7 && (
                <div
                  className={`flex-1 h-0.5 mx-1 mb-4 min-w-2 ${
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

        {/* Step 1: Import from LinkedIn */}
        {(step === "connect" || step === "import") && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Import from LinkedIn
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Click below to import your work experience, education, and skills from LinkedIn.
            </p>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Import from LinkedIn</h3>
                  <p className="text-sm text-gray-600">Opens your LinkedIn profile in a new tab</p>
                </div>
              </div>

              <button
                onClick={handleImportLinkedIn}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Import from LinkedIn
              </button>
            </div>

            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 text-sm mb-2">Before you click:</h4>
              <ol className="text-sm text-amber-700 list-decimal list-inside space-y-1">
                <li>Make sure you&apos;re logged into LinkedIn</li>
                <li>Make sure the ResumeScale Chrome extension is installed and connected</li>
                <li>The extension will capture your profile and redirect you back here</li>
              </ol>
            </div>

            <p className="text-sm text-gray-500 mb-6 text-center">
              We&apos;ll automatically extract your work experience, education, and skills using AI.
            </p>

            <div className="flex gap-4">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            <div className="space-y-6 mb-6 max-h-[32rem] overflow-y-auto">
              {editableData.work_experience.map((exp, jobIdx) => (
                <div key={jobIdx} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3">
                    {exp.title} at {exp.company}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        Bullets: {exp.description.filter(b => b.trim() !== "").length}/{MAX_BULLETS_PER_ROLE}
                      </span>
                      {exp.description.filter(b => b.trim() !== "").length >= MAX_BULLETS_PER_ROLE && (
                        <span className="text-xs text-amber-600">Maximum reached</span>
                      )}
                    </div>
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
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    {exp.description.filter(b => b.trim() !== "").length < MAX_BULLETS_PER_ROLE && (
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
                    )}
                  </div>

                  {/* AI Recommendations */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-xs font-medium text-purple-600">AI Suggestions</span>
                    </div>
                    {loadingRecommendations[jobIdx] ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                        Generating suggestions...
                      </div>
                    ) : aiRecommendations[jobIdx] === null ? (
                      <p className="text-xs text-gray-400">AI suggestions unavailable - check API keys</p>
                    ) : aiRecommendations[jobIdx]?.length > 0 ? (
                      <div className="space-y-2">
                        {(() => {
                          const currentBulletCount = exp.description.filter(b => b.trim() !== "").length;
                          const isAtLimit = currentBulletCount >= MAX_BULLETS_PER_ROLE;
                          const isExpanded = expandedSuggestions[jobIdx];
                          const suggestionsToShow = isExpanded
                            ? aiRecommendations[jobIdx]
                            : aiRecommendations[jobIdx].slice(0, INITIAL_SUGGESTIONS_SHOWN);
                          const hasMoreSuggestions = aiRecommendations[jobIdx].length > INITIAL_SUGGESTIONS_SHOWN;

                          return (
                            <>
                              {isAtLimit && (
                                <p className="text-xs text-amber-600 mb-2">
                                  Remove a bullet to add more suggestions
                                </p>
                              )}
                              {suggestionsToShow.map((rec, recIdx) => {
                                const isRegenerating = regeneratingBullets[`${jobIdx}-${recIdx}`];
                                return (
                                  <div
                                    key={recIdx}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors ${
                                      isAtLimit
                                        ? "bg-gray-100 border-gray-200 text-gray-400"
                                        : "bg-purple-50 border-purple-200 text-gray-700"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="flex-1">
                                        {isRegenerating ? (
                                          <span className="flex items-center gap-2 text-gray-500">
                                            <span className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                                            Generating new suggestion...
                                          </span>
                                        ) : (
                                          rec
                                        )}
                                      </span>
                                      {!isRegenerating && (
                                        <div className="flex items-center gap-1 shrink-0">
                                          {/* Thumbs up - accept */}
                                          <button
                                            disabled={isAtLimit}
                                            onClick={() => handleBulletFeedback(jobIdx, recIdx, rec, 'up', exp)}
                                            className={`p-1.5 rounded-full transition-colors ${
                                              isAtLimit
                                                ? "text-gray-300 cursor-not-allowed"
                                                : "text-green-500 hover:bg-green-100 hover:text-green-600"
                                            }`}
                                            title={isAtLimit ? "Remove a bullet first" : "Add this bullet"}
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                            </svg>
                                          </button>
                                          {/* Thumbs down - regenerate */}
                                          <button
                                            onClick={() => handleBulletFeedback(jobIdx, recIdx, rec, 'down', exp)}
                                            className="p-1.5 rounded-full text-red-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                                            title="Generate a different suggestion"
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                            </svg>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {hasMoreSuggestions && !isExpanded && (
                                <button
                                  onClick={() => setExpandedSuggestions(prev => ({ ...prev, [jobIdx]: true }))}
                                  className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 flex items-center justify-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  Load more suggestions ({aiRecommendations[jobIdx].length - INITIAL_SUGGESTIONS_SHOWN} more)
                                </button>
                              )}
                              {isExpanded && hasMoreSuggestions && (
                                <button
                                  onClick={() => setExpandedSuggestions(prev => ({ ...prev, [jobIdx]: false }))}
                                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-600 flex items-center justify-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Show less
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No suggestions available</p>
                    )}
                  </div>
                </div>
              ))}
              {editableData.work_experience.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No work experience to show achievements</p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  // Reset recommendations so they can be refetched after editing work experience
                  setAiRecommendations({});
                  fetchedJobsRef.current.clear();
                  setStep("work-experience");
                }}
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* AI Skill Suggestions */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium text-purple-600">AI Suggestions</span>
              </div>

              {loadingSkillSuggestions ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                  <span className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                  Analyzing your roles for skill recommendations...
                </div>
              ) : skillSuggestions ? (
                <div className="space-y-4">
                  {/* Hard Skills */}
                  {skillSuggestions.hardSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Technical Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const isExpanded = expandedSkillCategory["hardSkills"];
                          const skillsToShow = isExpanded
                            ? skillSuggestions.hardSkills
                            : skillSuggestions.hardSkills.slice(0, INITIAL_SKILLS_SHOWN);
                          const hasMore = skillSuggestions.hardSkills.length > INITIAL_SKILLS_SHOWN;

                          return (
                            <>
                              {skillsToShow.map((skill) => (
                                <button
                                  key={skill}
                                  onClick={() => {
                                    const updated = { ...editableData };
                                    if (!updated.skills.includes(skill)) {
                                      updated.skills = [...updated.skills, skill];
                                      setEditableData(updated);
                                      // Remove from suggestions
                                      setSkillSuggestions(prev => prev ? {
                                        ...prev,
                                        hardSkills: prev.hardSkills.filter(s => s !== skill)
                                      } : null);
                                    }
                                  }}
                                  className="px-3 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full text-sm text-gray-700 transition-colors"
                                >
                                  + {skill}
                                </button>
                              ))}
                              {hasMore && !isExpanded && (
                                <button
                                  onClick={() => setExpandedSkillCategory(prev => ({ ...prev, hardSkills: true }))}
                                  className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700"
                                >
                                  +{skillSuggestions.hardSkills.length - INITIAL_SKILLS_SHOWN} more
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Soft Skills */}
                  {skillSuggestions.softSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Soft Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {skillSuggestions.softSkills.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => {
                              const updated = { ...editableData };
                              if (!updated.skills.includes(skill)) {
                                updated.skills = [...updated.skills, skill];
                                setEditableData(updated);
                                setSkillSuggestions(prev => prev ? {
                                  ...prev,
                                  softSkills: prev.softSkills.filter(s => s !== skill)
                                } : null);
                              }
                            }}
                            className="px-3 py-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded-full text-sm text-gray-700 transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tools */}
                  {skillSuggestions.tools.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Tools & Technologies</p>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const isExpanded = expandedSkillCategory["tools"];
                          const skillsToShow = isExpanded
                            ? skillSuggestions.tools
                            : skillSuggestions.tools.slice(0, INITIAL_SKILLS_SHOWN);
                          const hasMore = skillSuggestions.tools.length > INITIAL_SKILLS_SHOWN;

                          return (
                            <>
                              {skillsToShow.map((skill) => (
                                <button
                                  key={skill}
                                  onClick={() => {
                                    const updated = { ...editableData };
                                    if (!updated.skills.includes(skill)) {
                                      updated.skills = [...updated.skills, skill];
                                      setEditableData(updated);
                                      setSkillSuggestions(prev => prev ? {
                                        ...prev,
                                        tools: prev.tools.filter(s => s !== skill)
                                      } : null);
                                    }
                                  }}
                                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full text-sm text-gray-700 transition-colors"
                                >
                                  + {skill}
                                </button>
                              ))}
                              {hasMore && !isExpanded && (
                                <button
                                  onClick={() => setExpandedSkillCategory(prev => ({ ...prev, tools: true }))}
                                  className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700"
                                >
                                  +{skillSuggestions.tools.length - INITIAL_SKILLS_SHOWN} more
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {skillSuggestions.hardSkills.length === 0 &&
                   skillSuggestions.softSkills.length === 0 &&
                   skillSuggestions.tools.length === 0 && (
                    <p className="text-xs text-gray-400">All suggestions have been added</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No suggestions available</p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("achievements")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("certifications")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Certifications */}
        {step === "certifications" && editableData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Certifications</h2>
                <p className="text-gray-600 text-sm">Add your professional certifications</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {editableData.certifications.map((cert, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg relative">
                  <button
                    onClick={() => {
                      const updated = { ...editableData };
                      updated.certifications = updated.certifications.filter((_, i) => i !== idx);
                      setEditableData(updated);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3 sm:col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Certification Name</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.certifications[idx].name = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Issuer</label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.certifications[idx].issuer = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                        placeholder="e.g., AWS, Google"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                      <input
                        type="text"
                        value={cert.date}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.certifications[idx].date = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                        placeholder="e.g., 2023"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {editableData.certifications.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No certifications added yet</p>
              )}
            </div>

            <button
              onClick={() => {
                const updated = { ...editableData };
                updated.certifications = [...updated.certifications, { name: "", issuer: "", date: "" }];
                setEditableData(updated);
              }}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors mb-6"
            >
              + Add Certification
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("skills")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("languages")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Languages */}
        {step === "languages" && editableData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Languages</h2>
                <p className="text-gray-600 text-sm">Add languages you speak</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {editableData.languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {lang}
                    <button
                      onClick={() => {
                        const updated = { ...editableData };
                        updated.languages = updated.languages.filter((_, i) => i !== idx);
                        setEditableData(updated);
                      }}
                      className="text-indigo-500 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                {editableData.languages.length === 0 && (
                  <p className="text-sm text-gray-400">No languages added yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-language"
                  placeholder="Add a language..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        const updated = { ...editableData };
                        updated.languages = [...updated.languages, input.value.trim()];
                        setEditableData(updated);
                        input.value = "";
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById("new-language") as HTMLInputElement;
                    if (input.value.trim()) {
                      const updated = { ...editableData };
                      updated.languages = [...updated.languages, input.value.trim()];
                      setEditableData(updated);
                      input.value = "";
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("certifications")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("honors")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Honors & Awards */}
        {step === "honors" && editableData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Honors & Awards</h2>
                <p className="text-gray-600 text-sm">Add your achievements and recognition</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {editableData.honors.map((honor, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg relative">
                  <button
                    onClick={() => {
                      const updated = { ...editableData };
                      updated.honors = updated.honors.filter((_, i) => i !== idx);
                      setEditableData(updated);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3 sm:col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Award/Honor</label>
                      <input
                        type="text"
                        value={honor.title}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.honors[idx].title = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Issuer/Organization</label>
                      <input
                        type="text"
                        value={honor.issuer}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.honors[idx].issuer = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                      <input
                        type="text"
                        value={honor.date}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.honors[idx].date = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
                        placeholder="e.g., 2023"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {editableData.honors.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No honors or awards added yet</p>
              )}
            </div>

            <button
              onClick={() => {
                const updated = { ...editableData };
                updated.honors = [...updated.honors, { title: "", issuer: "", date: "" }];
                setEditableData(updated);
              }}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors mb-6"
            >
              + Add Honor/Award
            </button>

            <p className="text-sm text-gray-500 mb-4 text-center">
              You can edit this information anytime in the Master Resume tab.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("languages")}
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
