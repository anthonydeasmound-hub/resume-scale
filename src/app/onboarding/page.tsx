"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

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

type Step = "entry" | "upload" | "connect" | "import" | "template" | "contact" | "work-experience" | "achievements" | "skills" | "education" | "certifications" | "languages" | "honors" | "summary" | "saving";

type EntryPath = "upload" | "linkedin" | "fresh" | null;

// Template definitions
interface Template {
  id: string;
  name: string;
  category: "professional" | "modern" | "creative" | "technical" | "executive";
  description: string;
  layout: "single" | "two-column-left" | "two-column-right";
}

const TEMPLATES: Template[] = [
  { id: "executive", name: "Executive", category: "professional", description: "Traditional corporate style", layout: "single" },
  { id: "horizon", name: "Horizon", category: "modern", description: "Clean, contemporary design", layout: "two-column-left" },
  { id: "canvas", name: "Canvas", category: "creative", description: "Bold and artistic", layout: "two-column-right" },
  { id: "terminal", name: "Terminal", category: "technical", description: "Developer-focused minimal", layout: "single" },
  { id: "summit", name: "Summit", category: "executive", description: "C-suite elegance", layout: "single" },
  { id: "cornerstone", name: "Cornerstone", category: "professional", description: "Balanced two-column", layout: "two-column-left" },
];

const COLORS = [
  { id: "blue", hex: "#2563eb", name: "Blue" },
  { id: "emerald", hex: "#059669", name: "Emerald" },
  { id: "violet", hex: "#7c3aed", name: "Violet" },
  { id: "rose", hex: "#e11d48", name: "Rose" },
  { id: "slate", hex: "#475569", name: "Slate" },
];

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
  const [step, setStep] = useState<Step>("entry");
  const [entryPath, setEntryPath] = useState<EntryPath>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
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

  // Summary and template state
  const [summaryOptions, setSummaryOptions] = useState<string[]>([]);
  const [selectedSummary, setSelectedSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("executive");
  const [selectedColor, setSelectedColor] = useState("#2563eb");
  const [templateCategory, setTemplateCategory] = useState<string>("all");
  const [templateOptions, setTemplateOptions] = useState({
    showPhoto: false,
    showSkillBars: true,
    showIcons: true,
  });
  const [previewHtml, setPreviewHtml] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.52);
  const summaryFetchedRef = useRef(false);
  const previewDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fresh builder AI suggestions state
  const [freshBulletSuggestions, setFreshBulletSuggestions] = useState<Record<number, string[]>>({});
  const [loadingFreshSuggestions, setLoadingFreshSuggestions] = useState<Record<number, boolean>>({});
  const bulletSuggestionDebounceRef = useRef<Record<number, NodeJS.Timeout>>({});

  // Constants for limits
  const MAX_BULLETS_PER_ROLE = 4;
  const INITIAL_SUGGESTIONS_SHOWN = 4;
  const INITIAL_SKILLS_SHOWN = 4;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);


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

  // Fetch summary suggestions when entering summary step
  useEffect(() => {
    if (step === "summary" && editableData && !summaryFetchedRef.current) {
      summaryFetchedRef.current = true;
      fetchSummaryOptions();
    }
  }, [step, editableData]);

  // Update preview when data changes (debounced)
  useEffect(() => {
    const contentSteps = ["template", "contact", "work-experience", "achievements", "skills", "education", "certifications", "languages", "honors", "summary"];
    if (contentSteps.includes(step) && editableData) {
      // Clear existing timeout
      if (previewDebounceRef.current) {
        clearTimeout(previewDebounceRef.current);
      }
      // Set new timeout for debounced update
      previewDebounceRef.current = setTimeout(() => {
        fetchPreviewHtml();
      }, 300);
    }
    return () => {
      if (previewDebounceRef.current) {
        clearTimeout(previewDebounceRef.current);
      }
    };
  }, [editableData, selectedSummary, selectedTemplate, selectedColor, step]);

  // Fetch preview immediately when entering a content step
  useEffect(() => {
    const contentSteps = ["template", "contact", "work-experience", "achievements", "skills", "education", "certifications", "languages", "honors", "summary"];
    if (contentSteps.includes(step) && editableData) {
      fetchPreviewHtml();
    }
  }, [step]);

  const fetchSummaryOptions = async () => {
    if (!editableData) return;
    setLoadingSummary(true);

    try {
      const response = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: {
            work_experience: editableData.work_experience,
            skills: editableData.skills,
            education: editableData.education,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummaryOptions(data.summaries);
        if (data.summaries.length > 0) {
          setSelectedSummary(data.summaries[0]);
        }
      } else {
        console.error("Failed to fetch summary options:", await response.text());
      }
    } catch (err) {
      console.error("Error fetching summary options:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchPreviewHtml = async () => {
    if (!editableData) return;
    setLoadingPreview(true);

    try {
      // Transform data to match ResumeData type expected by the template
      const transformedData = {
        contactInfo: {
          name: editableData.contact_info.name || "",
          email: editableData.contact_info.email || "",
          phone: editableData.contact_info.phone || "",
          location: editableData.contact_info.location || "",
          linkedin: editableData.contact_info.linkedin || "",
        },
        jobTitle: editableData.work_experience[0]?.title || "",
        summary: selectedSummary,
        experience: editableData.work_experience.map(exp => ({
          title: exp.title,
          company: exp.company,
          dates: `${exp.start_date} - ${exp.end_date}`,
          description: exp.description.filter(d => d.trim() !== ""),
        })),
        education: editableData.education.map(edu => ({
          school: edu.institution,
          degree: edu.degree,
          dates: edu.graduation_date,
          specialty: edu.field,
        })),
        skills: editableData.skills,
      };

      const response = await fetch("/api/resume/preview-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: transformedData,
          templateId: selectedTemplate,
          accentColor: selectedColor,
        }),
      });

      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
      }
    } catch (err) {
      console.error("Error fetching preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Fetch AI bullet suggestions for a specific job (fresh builder)
  const fetchFreshBulletSuggestions = async (jobIdx: number, jobTitle: string, company: string) => {
    if (!jobTitle || jobTitle.length < 3) return;

    setLoadingFreshSuggestions(prev => ({ ...prev, [jobIdx]: true }));

    try {
      const response = await fetch("/api/ai/suggest-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company }),
      });

      if (response.ok) {
        const data = await response.json();
        setFreshBulletSuggestions(prev => ({ ...prev, [jobIdx]: data.bullets || [] }));
      }
    } catch (err) {
      console.error("Error fetching bullet suggestions:", err);
    } finally {
      setLoadingFreshSuggestions(prev => ({ ...prev, [jobIdx]: false }));
    }
  };

  // Debounced trigger for bullet suggestions
  const triggerBulletSuggestions = (jobIdx: number, jobTitle: string, company: string) => {
    // Clear existing timeout for this job
    if (bulletSuggestionDebounceRef.current[jobIdx]) {
      clearTimeout(bulletSuggestionDebounceRef.current[jobIdx]);
    }

    // Set new timeout
    bulletSuggestionDebounceRef.current[jobIdx] = setTimeout(() => {
      fetchFreshBulletSuggestions(jobIdx, jobTitle, company);
    }, 500);
  };

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
    // Skip if company or title is empty
    if (!exp.company?.trim() || !exp.title?.trim()) {
      console.log("Skipping AI recommendations - missing company or title for job", jobIdx);
      return;
    }

    setLoadingRecommendations((prev) => ({ ...prev, [jobIdx]: true }));

    const requestBody = {
      role: { company: exp.company.trim(), title: exp.title.trim() },
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
        setStep("template");
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

  const handleLinkedInUrlImport = async () => {
    if (!linkedinUrl.includes("linkedin.com/in/")) {
      setError("Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/your-name)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/linkedin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin_url: linkedinUrl }),
      });

      if (response.ok) {
        const result = await response.json();
        setLinkedinData(result.data);
        const processedData = JSON.parse(JSON.stringify(result.data)) as LinkedInData;
        processedData.work_experience = processWorkExperience(processedData.work_experience);
        processedData.certifications = processedData.certifications || [];
        processedData.languages = processedData.languages || [];
        processedData.honors = processedData.honors || [];
        setEditableData(processedData);
        setStep("template");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to import LinkedIn profile. Please check the URL and try again.");
      }
    } catch (err) {
      console.error("Failed to scrape LinkedIn:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
          summary: selectedSummary,
          resume_style: selectedTemplate,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      setStep("summary");
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
      case "entry": return 0;
      case "upload": return 0;
      case "connect": return 0;
      case "import": return 0;
      case "template": return 1;
      case "contact": return 2;
      case "work-experience": return 3;
      case "achievements": return 4;
      case "skills": return 5;
      case "education": return 6;
      case "certifications": return 7;
      case "languages": return 8;
      case "honors": return 9;
      case "summary": return 10;
      case "saving": return 11;
      default: return 0;
    }
  };

  // Steps shown in progress bar (after entry/import)
  const getVisibleSteps = () => {
    if (entryPath === "fresh") {
      return ["Template", "Contact", "Experience", "Achievements", "Skills", "Education", "Certs", "Languages", "Honors", "Summary"];
    }
    // For upload/linkedin, contact is pre-filled so we skip it
    return ["Template", "Experience", "Achievements", "Skills", "Education", "Certs", "Languages", "Honors", "Summary"];
  };

  const stepLabels = getVisibleSteps();

  // Determine if we should show side-by-side layout with preview
  const showPreviewLayout = ["template", "contact", "work-experience", "achievements", "skills", "education", "certifications", "languages", "honors", "summary"].includes(step);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className={`mx-auto px-4 ${showPreviewLayout ? "max-w-7xl" : "max-w-2xl"}`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to ResumeGenie</h1>
          <p className="text-gray-600 mt-2">
            {step === "entry" ? "Let's build your professional resume" : "Complete your profile"}
          </p>
        </div>

        {/* Progress indicator - only show after entry/import steps */}
        {!["entry", "upload", "connect", "import", "saving"].includes(step) && (
        <div className="flex items-center mb-6 overflow-x-auto pb-2">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const currentNum = getStepNumber();
            const isComplete = currentNum > stepNum;
            const isCurrent = currentNum === stepNum;

            return (
              <div key={label} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                      isComplete
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : stepNum}
                  </div>
                  <span className={`text-xs mt-1.5 whitespace-nowrap ${isCurrent ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                    {label}
                  </span>
                </div>
                {idx < stepLabels.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-5 min-w-4 transition-colors duration-300 ${
                      isComplete ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        )}

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

        {/* Side-by-side layout wrapper for content steps */}
        <div className={showPreviewLayout ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
          {/* Left column: Form content */}
          <div>

        {/* Entry Step: Choose how to get started */}
        {step === "entry" && (
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
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <svg className="w-7 h-7 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg className="w-7 h-7 text-blue-700 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
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
                  // For now, go to work-experience with empty data
                  // Phase 3 will implement the full fresh builder
                  setEditableData({
                    contact_info: {
                      name: session?.user?.name || "",
                      email: session?.user?.email || "",
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
        )}

        {/* Upload Resume Step */}
        {step === "upload" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Your Resume
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Upload a PDF or DOCX file, or paste your resume text below.
            </p>

            {/* File upload area */}
            <div className="mb-6">
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600 mb-2">Drop your resume here or click to browse</p>
                <p className="text-xs text-gray-400">Supports PDF, DOCX, and TXT files</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  onChange={(e) => {
                    // TODO: Implement file upload in Phase 2
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log("File selected:", file.name);
                      // For now, show a message that this is coming soon
                      setError("File upload coming soon! Please paste your resume text below for now.");
                    }
                  }}
                />
              </label>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or paste your resume</span>
              </div>
            </div>

            {/* Text paste area */}
            <div className="mb-6">
              <textarea
                placeholder="Paste your resume text here..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                onChange={(e) => {
                  // Store the pasted text for processing
                  // TODO: Implement text parsing in Phase 2
                }}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("entry")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  // TODO: Process the uploaded/pasted resume
                  // For now, show message that this is in progress
                  setError("Resume parsing coming soon! Try LinkedIn import or Start Fresh for now.");
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Import from LinkedIn */}
        {(step === "connect" || step === "import") && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Import from LinkedIn
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Paste your LinkedIn profile URL below and we&apos;ll import your work experience, education, and skills.
            </p>

            <div className="mb-6">
              <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile URL
              </label>
              <input
                id="linkedin-url"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/your-name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-400">
                URL must contain linkedin.com/in/ (e.g. https://www.linkedin.com/in/john-doe)
              </p>
            </div>

            <p className="text-xs text-gray-500 mb-6 text-center">
              Your profile is fetched securely — we never store your LinkedIn password.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("entry")}
                disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleLinkedInUrlImport}
                disabled={loading || !linkedinUrl.trim()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Importing...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Template Selection Step */}
        {step === "template" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Choose Your Template</h2>
                <p className="text-gray-600 text-sm">Pick a design that fits your style</p>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {["all", "professional", "modern", "creative", "technical", "executive"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTemplateCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    templateCategory === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {TEMPLATES.filter(t => templateCategory === "all" || t.category === templateCategory).map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedTemplate === template.id
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  {/* Template Preview Thumbnail */}
                  <div className="aspect-[8.5/11] bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
                    <div className="absolute inset-2 bg-white rounded shadow-sm">
                      {/* Simplified template preview based on layout */}
                      {template.layout === "single" ? (
                        <div className="p-2">
                          <div className="h-3 bg-gray-300 rounded w-1/2 mb-2" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : undefined }} />
                          <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-1" />
                          <div className="h-1.5 bg-gray-200 rounded w-2/3 mb-3" />
                          <div className="space-y-2">
                            <div className="h-1 bg-gray-200 rounded" />
                            <div className="h-1 bg-gray-200 rounded w-5/6" />
                            <div className="h-1 bg-gray-200 rounded w-4/5" />
                          </div>
                        </div>
                      ) : template.layout === "two-column-left" ? (
                        <div className="flex h-full">
                          <div className="w-1/3 p-1.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}20` : "#f3f4f6" }}>
                            <div className="h-2 bg-gray-300 rounded w-full mb-2" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : undefined }} />
                            <div className="space-y-1">
                              <div className="h-1 bg-gray-200 rounded" />
                              <div className="h-1 bg-gray-200 rounded w-4/5" />
                            </div>
                          </div>
                          <div className="flex-1 p-1.5">
                            <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="space-y-1">
                              <div className="h-1 bg-gray-200 rounded" />
                              <div className="h-1 bg-gray-200 rounded w-5/6" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full">
                          <div className="flex-1 p-1.5">
                            <div className="h-2 bg-gray-300 rounded w-1/2 mb-2" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : undefined }} />
                            <div className="space-y-1">
                              <div className="h-1 bg-gray-200 rounded" />
                              <div className="h-1 bg-gray-200 rounded w-5/6" />
                            </div>
                          </div>
                          <div className="w-1/3 p-1.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}20` : "#f3f4f6" }}>
                            <div className="space-y-1">
                              <div className="h-1 bg-gray-200 rounded" />
                              <div className="h-1 bg-gray-200 rounded w-4/5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm">{template.name}</h3>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </button>
              ))}
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Accent Color</label>
              <div className="flex gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.hex)}
                    className={`w-10 h-10 rounded-full transition-all duration-200 ${
                      selectedColor === color.hex
                        ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Template Options */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">Options</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateOptions.showPhoto}
                    onChange={(e) => setTemplateOptions({ ...templateOptions, showPhoto: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Include photo placeholder</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateOptions.showSkillBars}
                    onChange={(e) => setTemplateOptions({ ...templateOptions, showSkillBars: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Show skill proficiency bars</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateOptions.showIcons}
                    onChange={(e) => setTemplateOptions({ ...templateOptions, showIcons: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Use section icons</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("entry")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(entryPath === "fresh" ? "contact" : "work-experience")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Contact Info Step (for fresh path) */}
        {step === "contact" && editableData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
                <p className="text-gray-600 text-sm">How can employers reach you?</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editableData.contact_info.name}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.contact_info.name = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editableData.contact_info.email}
                    onChange={(e) => {
                      const updated = { ...editableData };
                      updated.contact_info.email = e.target.value;
                      setEditableData(updated);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editableData.contact_info.phone}
                    onChange={(e) => {
                      const updated = { ...editableData };
                      updated.contact_info.phone = e.target.value;
                      setEditableData(updated);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editableData.contact_info.location}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.contact_info.location = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn (optional)</label>
                <input
                  type="url"
                  value={editableData.contact_info.linkedin}
                  onChange={(e) => {
                    const updated = { ...editableData };
                    updated.contact_info.linkedin = e.target.value;
                    setEditableData(updated);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("template")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("work-experience")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
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
                          onBlur={() => {
                            // Trigger AI suggestions for fresh path when job title is entered
                            if (entryPath === "fresh" && exp.title && exp.title.length >= 3) {
                              triggerBulletSuggestions(idx, exp.title, exp.company);
                            }
                          }}
                          placeholder="e.g., Software Engineer"
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
                          onBlur={() => {
                            // Re-trigger suggestions with company context
                            if (entryPath === "fresh" && exp.title && exp.title.length >= 3) {
                              triggerBulletSuggestions(idx, exp.title, exp.company);
                            }
                          }}
                          placeholder="e.g., Google"
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

                    {/* AI Bullet Suggestions for Fresh Path */}
                    {entryPath === "fresh" && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">AI Suggestions</span>
                          </div>
                          {exp.title && exp.title.length >= 3 && (
                            <button
                              onClick={() => fetchFreshBulletSuggestions(idx, exp.title, exp.company)}
                              disabled={loadingFreshSuggestions[idx]}
                              className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                            >
                              {loadingFreshSuggestions[idx] ? "Generating..." : "Regenerate"}
                            </button>
                          )}
                        </div>

                        {loadingFreshSuggestions[idx] ? (
                          <div className="flex items-center justify-center py-6">
                            <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                            <span className="ml-2 text-sm text-gray-500">Generating suggestions...</span>
                          </div>
                        ) : freshBulletSuggestions[idx]?.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 mb-2">Click to add to your resume:</p>
                            {freshBulletSuggestions[idx].map((bullet, bulletIdx) => (
                              <button
                                key={bulletIdx}
                                onClick={() => {
                                  const updated = { ...editableData };
                                  if (!updated.work_experience[idx].description.includes(bullet)) {
                                    updated.work_experience[idx].description = [
                                      ...updated.work_experience[idx].description,
                                      bullet
                                    ];
                                    setEditableData(updated);
                                    // Remove the suggestion after adding
                                    setFreshBulletSuggestions(prev => ({
                                      ...prev,
                                      [idx]: prev[idx].filter((_, i) => i !== bulletIdx)
                                    }));
                                  }
                                }}
                                className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-sm text-gray-700 transition-colors group"
                              >
                                <div className="flex items-start gap-2">
                                  <svg className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  <span>{bullet}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : exp.title && exp.title.length >= 3 ? (
                          <div className="text-center py-4">
                            <p className="text-xs text-gray-400 mb-2">No suggestions yet</p>
                            <button
                              onClick={() => fetchFreshBulletSuggestions(idx, exp.title, exp.company)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Generate suggestions
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-4">
                            Enter a job title to get AI-powered bullet suggestions
                          </p>
                        )}

                        {/* Show already added bullets */}
                        {exp.description.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-medium text-gray-600 mb-2">Added bullets ({exp.description.length}):</p>
                            <div className="space-y-1">
                              {exp.description.map((bullet, bulletIdx) => (
                                <div key={bulletIdx} className="flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm text-gray-700 flex-1">{bullet}</span>
                                  <button
                                    onClick={() => {
                                      const updated = { ...editableData };
                                      updated.work_experience[idx].description = updated.work_experience[idx].description.filter((_, i) => i !== bulletIdx);
                                      setEditableData(updated);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Position button for fresh path */}
                {entryPath === "fresh" && (
                  <button
                    onClick={() => {
                      const updated = { ...editableData };
                      updated.work_experience = [...updated.work_experience, {
                        company: "",
                        title: "",
                        start_date: "",
                        end_date: "Present",
                        description: [],
                      }];
                      setEditableData(updated);
                    }}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Another Position
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-4">No work experience added yet</p>
                {entryPath === "fresh" && (
                  <button
                    onClick={() => {
                      const updated = { ...editableData };
                      updated.work_experience = [{
                        company: "",
                        title: "",
                        start_date: "",
                        end_date: "Present",
                        description: [],
                      }];
                      setEditableData(updated);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Your First Position
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(entryPath === "fresh" ? "contact" : "template")}
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
                onClick={() => setStep("education")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Education Step */}
        {step === "education" && editableData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Education</h2>
                <p className="text-gray-600 text-sm">Add your educational background</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {editableData.education.map((edu, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg relative">
                  <button
                    onClick={() => {
                      const updated = { ...editableData };
                      updated.education = updated.education.filter((_, i) => i !== idx);
                      setEditableData(updated);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove education"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">School/University</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.education[idx].institution = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Stanford University"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.education[idx].degree = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bachelor of Science"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.education[idx].field = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Graduation Date</label>
                      <input
                        type="text"
                        value={edu.graduation_date}
                        onChange={(e) => {
                          const updated = { ...editableData };
                          updated.education[idx].graduation_date = e.target.value;
                          setEditableData(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="May 2020"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {editableData.education.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No education added yet</p>
              )}
            </div>

            <button
              onClick={() => {
                const updated = { ...editableData };
                updated.education = [...updated.education, { institution: "", degree: "", field: "", graduation_date: "" }];
                setEditableData(updated);
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors mb-6 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Education
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("skills")}
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
                onClick={() => setStep("education")}
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

            <div className="flex gap-4">
              <button
                onClick={() => setStep("languages")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("summary")}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Summary & Template */}
        {step === "summary" && editableData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Finalize Your Resume</h2>
                <p className="text-gray-600 text-sm">Choose your summary and template</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column: Summary & Template selection */}
              <div className="space-y-6">
                {/* Summary Section */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">Professional Summary</h3>
                  {loadingSummary ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                      <span className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                      Generating summary options...
                    </div>
                  ) : summaryOptions.length > 0 ? (
                    <div className="space-y-3">
                      {summaryOptions.map((summary, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSummary(summary)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-colors text-sm ${
                            selectedSummary === summary
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${
                              selectedSummary === summary
                                ? "border-indigo-500 bg-indigo-500"
                                : "border-gray-300"
                            }`}>
                              {selectedSummary === summary && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className="text-gray-700">{summary}</span>
                          </div>
                        </button>
                      ))}
                      <div className="pt-2">
                        <label className="block text-xs text-gray-500 mb-1">Or edit your summary:</label>
                        <textarea
                          value={selectedSummary}
                          onChange={(e) => setSelectedSummary(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <p className="mb-2">No summary generated yet.</p>
                      <button
                        onClick={fetchSummaryOptions}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Generate summaries
                      </button>
                    </div>
                  )}
                </div>

                {/* Template Section */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">Resume Template</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedTemplate("basic")}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        selectedTemplate === "basic"
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-full h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                        <svg className="w-12 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Basic</p>
                      <p className="text-xs text-gray-500">Clean and professional</p>
                    </button>
                    {/* Placeholder for future templates */}
                    <div className="p-4 rounded-lg border-2 border-dashed border-gray-200 opacity-50">
                      <div className="w-full h-24 bg-gray-50 rounded mb-2 flex items-center justify-center">
                        <span className="text-xs text-gray-400">Coming soon</span>
                      </div>
                      <p className="text-sm font-medium text-gray-400">More templates</p>
                      <p className="text-xs text-gray-400">Stay tuned</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: Live Preview */}
              <div className="lg:sticky lg:top-4">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Live Preview</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewScale(Math.max(0.3, previewScale - 0.1))}
                        className="p-1 hover:bg-gray-200 rounded text-gray-600"
                        title="Zoom out"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-500 w-12 text-center">{Math.round(previewScale * 100)}%</span>
                      <button
                        onClick={() => setPreviewScale(Math.min(1, previewScale + 0.1))}
                        className="p-1 hover:bg-gray-200 rounded text-gray-600"
                        title="Zoom in"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto p-4 bg-gray-100" style={{ maxHeight: "550px" }}>
                    <div className="flex justify-center">
                      {loadingPreview && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                          <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
                        </div>
                      )}
                      {previewHtml ? (
                        <div
                          className="shadow-lg bg-white relative"
                          style={{
                            width: `${8.5 * previewScale}in`,
                            height: `${11 * previewScale}in`,
                            overflow: "hidden",
                          }}
                        >
                          <iframe
                            srcDoc={previewHtml}
                            title="Resume Preview"
                            style={{
                              width: "8.5in",
                              height: "11in",
                              transform: `scale(${previewScale})`,
                              transformOrigin: "top left",
                              border: "none",
                              background: "white",
                              position: "absolute",
                              top: 0,
                              left: 0,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                          <p>{selectedSummary ? "Loading preview..." : "Select a summary to see preview"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-6 mb-4 text-center">
              You can edit this information anytime in the Master Resume tab.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setStep("honors")}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedSummary}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {/* End of left column */}

          {/* Right column: Live Preview */}
          {showPreviewLayout && (
            <div className="hidden lg:block">
              <div className="sticky top-8">
                <div className="bg-white rounded-xl shadow-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewScale(Math.max(0.3, previewScale - 0.1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        title="Zoom out"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-500 w-12 text-center">{Math.round(previewScale * 100)}%</span>
                      <button
                        onClick={() => setPreviewScale(Math.min(1, previewScale + 0.1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        title="Zoom in"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div
                    className="bg-gray-100 rounded-lg overflow-hidden"
                    style={{
                      height: `${11 * 96 * previewScale + 32}px`,
                    }}
                  >
                    {loadingPreview && !previewHtml ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                    ) : previewHtml ? (
                      <div className="flex justify-center">
                        <div
                          className="bg-white shadow-lg"
                          style={{
                            width: `${8.5 * 96 * previewScale}px`,
                            height: `${11 * 96 * previewScale}px`,
                            overflow: 'hidden',
                          }}
                        >
                          <iframe
                            srcDoc={previewHtml}
                            title="Resume Preview"
                            style={{
                              width: `${8.5 * 96}px`,
                              height: `${11 * 96}px`,
                              transform: `scale(${previewScale})`,
                              transformOrigin: 'top left',
                              border: 'none',
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
                        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">Your resume preview will appear here</p>
                        <p className="text-xs mt-1">Add some content to see it</p>
                      </div>
                    )}
                  </div>

                  {/* Template info */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Template: {TEMPLATES.find(t => t.id === selectedTemplate)?.name || selectedTemplate}</span>
                      <div className="flex items-center gap-2">
                        <span>Color:</span>
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: selectedColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* End of grid wrapper */}

      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return <OnboardingContent />;
}
