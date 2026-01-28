"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";

import {
  ProgressIndicator,
  EntryStep,
  TemplateSelectionStep,
  ContactInfoStep,
  WorkExperienceStep,
  AchievementsStep,
  SkillsStep,
  EducationStep,
  CertificationsStep,
  LanguagesStep,
  HonorsStep,
  SummaryStep,
  CompletionStep,
  LivePreviewPanel,
} from "@/components/onboarding";

import type {
  LinkedInData,
  Step,
  EntryPath,
  SkillSuggestions,
} from "@/components/onboarding/types";

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
    // Skip entries with no title AND no company
    if ((!exp.title || exp.title.trim() === "") && (!exp.company || exp.company.trim() === "")) return false;

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
  const [step, setStep] = useState<Step>("entry");
  const [entryPath, setEntryPath] = useState<EntryPath>(null);
  const [linkedinData, setLinkedinData] = useState<LinkedInData | null>(null);
  const [editableData, setEditableData] = useState<LinkedInData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState<Record<number, string[]>>({});
  const [loadingRecommendations, setLoadingRecommendations] = useState<Record<number, boolean>>({});
  const [expandedSuggestions, setExpandedSuggestions] = useState<Record<number, boolean>>({});
  const [regeneratingBullets, setRegeneratingBullets] = useState<Record<string, boolean>>({}); // key: "jobIdx-recIdx"
  const fetchedJobsRef = useRef<Set<number>>(new Set());

  // Skill suggestions state
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
    showLanguages: false,
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
    document.title = "ResumeGenie - Onboarding";
  }, []);

  // Check for LinkedIn extension import result
  useEffect(() => {
    const importStatus = searchParams.get("linkedin_import");
    const errorMessage = searchParams.get("message");

    if (importStatus === "success") {
      setEntryPath("linkedin");
      fetchLinkedInData();
    } else if (importStatus === "error") {
      setError(errorMessage || "Failed to import LinkedIn data. Please try again.");
      setEntryPath("linkedin");
      setStep("connect");
    }
  }, [searchParams]);

  // Fetch extension token when entering connect step
  useEffect(() => {
    if (step === "connect" && !token) {
      fetchToken();
    }
  }, [step]);

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
    const contentSteps = ["template", "contact", "work-experience", "achievements", "skills", "education", "certifications", "languages", "honors", "summary", "complete"];
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
        certifications: editableData.certifications || [],
        languages: editableData.languages || [],
        honors: editableData.honors || [],
      };

      const response = await fetch("/api/resume/preview-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: transformedData,
          templateId: selectedTemplate,
          accentColor: selectedColor,
          templateOptions,
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
      return;
    }

    setLoadingRecommendations((prev) => ({ ...prev, [jobIdx]: true }));

    const requestBody = {
      role: { company: exp.company.trim(), title: exp.title.trim() },
      existingBullets: exp.description.filter((b) => b.trim() !== ""),
    };

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

  const fetchToken = async () => {
    try {
      const res = await fetch("/api/extension/token");
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
      }
    } catch (err) {
      console.error("Failed to fetch token:", err);
    }
  };

  const copyToken = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const handleImportLinkedIn = () => {
    window.open("https://www.linkedin.com/in/me?resumegenie_import=auto", "_blank");
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
          accent_color: selectedColor,
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setStep("complete");
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      setStep("summary");
      console.error(err);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!editableData) return;
    setDownloadingPdf(true);

    try {
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
        certifications: editableData.certifications || [],
        languages: editableData.languages || [],
        honors: editableData.honors || [],
      };

      const response = await fetch("/api/generate-resume-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: transformedData,
          templateId: selectedTemplate,
          accentColor: selectedColor,
          templateOptions,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-${selectedTemplate}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      setError("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
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
      case "complete": return 11;
      default: return 0;
    }
  };

  // Steps shown in progress bar (after entry/import)
  const stepLabels = ["Template", "Contact", "Experience", "Achievements", "Skills", "Education", "Certs", "Languages", "Honors", "Summary"];

  // Determine if we should show side-by-side layout with preview (not on complete step - it has its own full preview)
  const showPreviewLayout = ["template", "contact", "work-experience", "achievements", "skills", "education", "certifications", "languages", "honors", "summary"].includes(step);

  // Callback for achievements back button
  const clearRecommendationsAndGoBack = () => {
    setAiRecommendations({});
    fetchedJobsRef.current.clear();
    setStep("work-experience");
  };

  return (
    <div className="min-h-screen bg-brand-gray py-8">
      <div className={`mx-auto px-4 ${step === "complete" ? "max-w-4xl" : showPreviewLayout ? "max-w-7xl" : "max-w-2xl"}`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to ResumeGenie</h1>
          <p className="text-gray-600 mt-2">
            {step === "entry" ? "Let's build your professional resume" : "Complete your profile"}
          </p>
        </div>

        {/* Progress indicator - only show after entry/import steps */}
        {!["entry", "upload", "connect", "import", "saving", "complete"].includes(step) && (
          <ProgressIndicator
            stepLabels={stepLabels}
            currentStepNumber={getStepNumber()}
          />
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

        {/* Entry Step */}
        {step === "entry" && (
          <EntryStep
            setEntryPath={setEntryPath}
            setStep={setStep}
            setEditableData={setEditableData}
            sessionUserName={session?.user?.name}
            sessionUserEmail={session?.user?.email}
          />
        )}

        {/* Upload Resume Step - kept inline since it's simple and tightly coupled */}
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
                    const file = e.target.files?.[0];
                    if (file) {
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
                onChange={(e) => {
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
                  setError("Resume parsing coming soon! Try LinkedIn import or Start Fresh for now.");
                }}
                className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* LinkedIn Import Steps - kept inline since they're tightly coupled to token flow */}
        {(step === "connect" || step === "import") && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Import from LinkedIn
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Use the ResumeGenie Chrome extension to import your full LinkedIn profile — work history, education, skills, and more.
            </p>

            {/* Step 1: Install extension */}
            <div className="mb-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-7 h-7 bg-brand-gold text-gray-900 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Install the Chrome Extension</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Add ResumeGenie to your browser to enable profile imports.
                  </p>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Extension (Coming Soon)
                  </a>
                </div>
              </div>
            </div>

            {/* Step 2: Connect extension */}
            <div className="mb-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-7 h-7 bg-brand-gold text-gray-900 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm">Connect the extension</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Open the extension side panel, expand &quot;Settings&quot;, and paste these values:
                  </p>
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Server URL</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="flex-1 bg-gray-100 px-3 py-1.5 rounded text-xs text-gray-700 font-mono truncate">
                          {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}
                        </code>
                        <button
                          onClick={() => copyToken(typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")}
                          className="px-2 py-1.5 bg-gray-100 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Token</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="flex-1 bg-gray-100 px-3 py-1.5 rounded text-xs text-gray-700 font-mono truncate">
                          {token || "Loading..."}
                        </code>
                        <button
                          onClick={() => token && copyToken(token)}
                          disabled={!token}
                          className="px-2 py-1.5 bg-gray-100 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                          {tokenCopied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Log in & Import */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-7 h-7 bg-brand-gold text-gray-900 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">Log into LinkedIn & import</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Make sure you&apos;re signed into LinkedIn, then click the button below. The extension will capture your profile and bring you back here automatically.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleImportLinkedIn}
              className="w-full bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              Open LinkedIn & Import Profile
            </button>

            <p className="text-xs text-gray-400 mt-4 text-center">
              We never store your LinkedIn password. The extension only reads your profile page.
            </p>

            <div className="mt-4">
              <button
                onClick={() => setStep("entry")}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Template Selection Step */}
        {step === "template" && (
          <TemplateSelectionStep
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            templateCategory={templateCategory}
            setTemplateCategory={setTemplateCategory}
            templateOptions={templateOptions}
            setTemplateOptions={setTemplateOptions}
            setStep={setStep}
          />
        )}

        {/* Contact Info Step */}
        {step === "contact" && editableData && (
          <ContactInfoStep
            editableData={editableData}
            setEditableData={setEditableData}
            setStep={setStep}
          />
        )}

        {/* Work Experience Step */}
        {step === "work-experience" && editableData && (
          <WorkExperienceStep
            editableData={editableData}
            setEditableData={setEditableData}
            setStep={setStep}
            entryPath={entryPath}
            freshBulletSuggestions={freshBulletSuggestions}
            setFreshBulletSuggestions={setFreshBulletSuggestions}
            loadingFreshSuggestions={loadingFreshSuggestions}
            fetchFreshBulletSuggestions={fetchFreshBulletSuggestions}
            triggerBulletSuggestions={triggerBulletSuggestions}
          />
        )}

        {/* Achievements Step */}
        {step === "achievements" && editableData && (
          <AchievementsStep
            editableData={editableData}
            setEditableData={setEditableData}
            setStep={setStep}
            aiRecommendations={aiRecommendations}
            loadingRecommendations={loadingRecommendations}
            expandedSuggestions={expandedSuggestions}
            setExpandedSuggestions={setExpandedSuggestions}
            regeneratingBullets={regeneratingBullets}
            handleBulletFeedback={handleBulletFeedback}
            clearRecommendationsAndGoBack={clearRecommendationsAndGoBack}
            MAX_BULLETS_PER_ROLE={MAX_BULLETS_PER_ROLE}
            INITIAL_SUGGESTIONS_SHOWN={INITIAL_SUGGESTIONS_SHOWN}
          />
        )}

        {/* Skills Step */}
        {step === "skills" && editableData && (
          <SkillsStep
            editableData={editableData}
            setEditableData={setEditableData}
            setStep={setStep}
            newSkill={newSkill}
            setNewSkill={setNewSkill}
            skillSuggestions={skillSuggestions}
            setSkillSuggestions={setSkillSuggestions}
            loadingSkillSuggestions={loadingSkillSuggestions}
            expandedSkillCategory={expandedSkillCategory}
            setExpandedSkillCategory={setExpandedSkillCategory}
            INITIAL_SKILLS_SHOWN={INITIAL_SKILLS_SHOWN}
          />
        )}

        {/* Education Step */}
        {step === "education" && editableData && (
          <EducationStep
            editableData={editableData}
            setEditableData={setEditableData}
            setStep={setStep}
          />
        )}

        {/* Certifications Step */}
        {step === "certifications" && editableData && (
          <CertificationsStep
            editableData={editableData}
            setEditableData={setEditableData}
            setStep={setStep}
          />
        )}

        {/* Languages Step */}
        {step === "languages" && editableData && (
          <LanguagesStep
            editableData={editableData}
            setEditableData={setEditableData}
            setStep={setStep}
          />
        )}

        {/* Honors Step */}
        {step === "honors" && editableData && (
          <HonorsStep
            editableData={editableData}
            setEditableData={setEditableData}
            setStep={setStep}
          />
        )}

        {/* Summary Step */}
        {step === "summary" && editableData && (
          <SummaryStep
            summaryOptions={summaryOptions}
            selectedSummary={selectedSummary}
            setSelectedSummary={setSelectedSummary}
            loadingSummary={loadingSummary}
            fetchSummaryOptions={fetchSummaryOptions}
            handleSave={handleSave}
            setStep={setStep}
          />
        )}

        {/* Saving State */}
        {step === "saving" && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Saving your profile...</p>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <CompletionStep
            previewHtml={previewHtml}
            downloadingPdf={downloadingPdf}
            handleDownloadPdf={handleDownloadPdf}
            onGoToDashboard={() => router.push("/dashboard")}
          />
        )}

          </div>
          {/* End of left column */}

          {/* Right column: Live Preview */}
          {showPreviewLayout && (
            <LivePreviewPanel
              previewHtml={previewHtml}
              loadingPreview={loadingPreview}
              previewScale={previewScale}
              setPreviewScale={setPreviewScale}
              selectedTemplate={selectedTemplate}
              selectedColor={selectedColor}
            />
          )}
        </div>
        {/* End of grid wrapper */}

      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-gray flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
