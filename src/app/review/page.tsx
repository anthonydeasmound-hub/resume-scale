"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import TabsNav from "@/components/TabsNav";

interface Job {
  id: number;
  company_name: string;
  job_title: string;
  job_description: string;
  tailored_resume: string | null;
  cover_letter: string | null;
  resume_style: string;
  resume_color: string;
  status: string;
  reviewed: boolean;
  created_at: string;
  job_details_parsed: string | null;
}

interface JobDetailsParsed {
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  salary_range: string | null;
  location: string | null;
  work_type: string | null;
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
}

interface WorkExperience {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string[];
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  graduation_date: string;
}

interface MasterResume {
  contact_info: ContactInfo;
  work_experience: WorkExperience[];
  skills: string[];
  education: Education[];
}

interface TailoredResume {
  contact_info: ContactInfo;
  summary: string;
  work_experience: WorkExperience[];
  skills: string[];
  education: Education[];
}

interface SelectedRole {
  roleIndex: number;
  selectedBullets: number[];
  masterBullets: string[];  // Original bullets from master resume
  aiBullets: string[];      // AI-generated alternatives
  bulletOptions: string[];  // Combined: master first, then AI
  loadingBullets: boolean;
}

const COLOR_OPTIONS = [
  { id: "blue", name: "Navy Blue", hex: "#3D5A80" },
  { id: "teal", name: "Teal", hex: "#2A9D8F" },
  { id: "burgundy", name: "Burgundy", hex: "#7B2D26" },
  { id: "forest", name: "Forest", hex: "#2D5A27" },
  { id: "slate", name: "Slate", hex: "#4A5568" },
  { id: "purple", name: "Purple", hex: "#5B4B8A" },
];

function ReviewContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"resume" | "cover" | "job-details">("resume");
  const [accentColor, setAccentColor] = useState("#3D5A80");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Master resume from database
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null);

  // Accordion states
  const [expandedSection, setExpandedSection] = useState<"summary" | "experience" | "skills" | null>(null);

  // Summary options
  const [summaryOptions, setSummaryOptions] = useState<string[]>([]);
  const [selectedSummaryIndex, setSelectedSummaryIndex] = useState<number | null>(null);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editedSummaryText, setEditedSummaryText] = useState("");

  // Work experience selections
  const [selectedRoles, setSelectedRoles] = useState<SelectedRole[]>([]);
  // Track edited bullets: key is "roleIndex-bulletIndex", value is edited text
  const [editedBullets, setEditedBullets] = useState<Record<string, string>>({});
  // Track which bullet is currently being edited: "roleIndex-bulletIndex" or null
  const [editingBulletKey, setEditingBulletKey] = useState<string | null>(null);
  const [editingBulletText, setEditingBulletText] = useState("");

  // Skills options
  const [skillsFromResume, setSkillsFromResume] = useState<string[]>([]);
  const [skillsFromJobDescription, setSkillsFromJobDescription] = useState<string[]>([]);
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Cover letter
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);

  // Resume Review Score
  interface ResumeReviewResult {
    overallScore: number;
    categoryScores: {
      impact: number;
      metrics: number;
      actionVerbs: number;
      relevance: number;
      clarity: number;
    };
    strengths: string[];
    improvements: string[];
    bulletFeedback: {
      bullet: string;
      score: number;
      feedback: string;
      suggestion?: string;
    }[];
  }
  const [reviewScore, setReviewScore] = useState<ResumeReviewResult | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  // Job details sidebar
  const [showJobDetails, setShowJobDetails] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchJobs();
      fetchMasterResume();
    }
  }, [session]);

  useEffect(() => {
    if (jobId && jobs.length > 0) {
      const job = jobs.find((j) => j.id === parseInt(jobId));
      if (job) {
        setSelectedJob(job);
        // Load saved color or default to navy blue
        setAccentColor(job.resume_color && job.resume_color !== "#000000" ? job.resume_color : "#3D5A80");

        // If job already has tailored resume, load it
        if (job.tailored_resume) {
          const tailored = JSON.parse(job.tailored_resume) as TailoredResume;
          // Pre-populate selections from saved data
          if (tailored.summary) {
            setSummaryOptions([tailored.summary]);
            setSelectedSummaryIndex(0);
          }
          if (tailored.skills) {
            setSelectedSkills(tailored.skills);
          }
          if (tailored.work_experience && masterResume) {
            // Reconstruct selected roles from saved data
            const reconstructedRoles: SelectedRole[] = tailored.work_experience.map((exp) => {
              const masterIndex = masterResume.work_experience.findIndex(
                (m) => m.company === exp.company && m.title === exp.title
              );
              // For saved data, treat all saved bullets as the selected set
              return {
                roleIndex: masterIndex !== -1 ? masterIndex : 0,
                masterBullets: exp.description,
                aiBullets: [],
                selectedBullets: exp.description.map((_, i) => i),
                bulletOptions: exp.description,
                loadingBullets: false,
              };
            });
            setSelectedRoles(reconstructedRoles);
          }
        }
        if (job.cover_letter) {
          setCoverLetter(job.cover_letter);
        }
      }
    }
  }, [jobId, jobs, masterResume]);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (response.ok) {
        const data = await response.json();
        const reviewJobs = data
          .filter((j: Job) => j.status === "review")
          .map((j: Job) => ({ ...j, reviewed: Boolean(j.reviewed) }));
        setJobs(reviewJobs);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterResume = async () => {
    try {
      const response = await fetch("/api/resume/master");
      if (response.ok) {
        const data = await response.json();
        setMasterResume(data);
      }
    } catch (err) {
      console.error("Failed to fetch master resume:", err);
    }
  };

  // Auto-load all AI content when job is selected
  useEffect(() => {
    if (selectedJob && masterResume && !selectedJob.tailored_resume) {
      // Only auto-load if no saved tailored resume exists
      const autoLoadContent = async () => {
        // Load all content in parallel
        if (summaryOptions.length === 0 && !loadingSummaries) {
          loadSummaryOptions();
        }
        if (selectedRoles.length === 0) {
          loadAllBulletOptions();
        }
        if (skillsFromResume.length === 0 && !loadingSkills) {
          loadSkillRecommendations();
        }
      };
      autoLoadContent();
    }
  }, [selectedJob, masterResume]);

  const toggleSection = async (section: "summary" | "experience" | "skills") => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Auto-load bullets for top 3 most recent roles
  const loadAllBulletOptions = async () => {
    if (!selectedJob || !masterResume) return;

    // Get top 3 most recent roles
    const topRoles = masterResume.work_experience.slice(0, 3);

    // Initialize all roles with master bullets, but only pre-select up to calculated max
    const initialRoles: SelectedRole[] = topRoles.map((role, idx) => {
      const masterBullets = role.description.slice(0, 8); // Get up to 8 master bullets as options
      // Only pre-select 3 bullets initially (will be enforced by MAX_TOTAL_BULLETS)
      const initialSelected = Math.min(3, masterBullets.length);
      return {
        roleIndex: idx,
        masterBullets,
        aiBullets: [],
        bulletOptions: masterBullets, // Start with master bullets
        selectedBullets: Array.from({ length: initialSelected }, (_, i) => i), // Pre-select first 3
        loadingBullets: true,
      };
    });
    setSelectedRoles(initialRoles);

    // Load AI bullets for all roles in parallel
    const promises = topRoles.map(async (role, idx) => {
      try {
        const response = await fetch("/api/ai/generate-bullets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: selectedJob.id,
            role: {
              company: role.company,
              title: role.title,
              description: role.description,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return { roleIndex: idx, aiBullets: data.bullets, success: true };
        }
        return { roleIndex: idx, aiBullets: [], success: false };
      } catch {
        return { roleIndex: idx, aiBullets: [], success: false };
      }
    });

    const results = await Promise.all(promises);

    // Update all roles: master bullets first (pre-selected), then AI alternatives
    setSelectedRoles((prev) =>
      prev.map((r) => {
        const result = results.find((res) => res.roleIndex === r.roleIndex);
        if (result?.success) {
          // Combine master bullets + AI bullets
          const combined = [...r.masterBullets, ...result.aiBullets];
          return {
            ...r,
            aiBullets: result.aiBullets,
            bulletOptions: combined,
            loadingBullets: false,
            // Keep master bullets selected (first N indices)
            selectedBullets: r.masterBullets.map((_, i) => i),
          };
        }
        return { ...r, loadingBullets: false };
      })
    );
  };

  const loadSummaryOptions = async () => {
    if (!selectedJob) return;
    setLoadingSummaries(true);

    try {
      const response = await fetch("/api/ai/generate-summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJob.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummaryOptions(data.summaries);
        // Auto-select the first (most relevant) summary
        if (data.summaries.length > 0 && selectedSummaryIndex === null) {
          setSelectedSummaryIndex(0);
        }
      }
    } catch (err) {
      console.error("Failed to load summaries:", err);
    } finally {
      setLoadingSummaries(false);
    }
  };

  const loadSkillRecommendations = async () => {
    if (!selectedJob) return;
    setLoadingSkills(true);

    try {
      const response = await fetch("/api/ai/generate-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: selectedJob.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setSkillsFromResume(data.fromResume || []);
        setSkillsFromJobDescription(data.fromJobDescription || []);
        setRecommendedSkills(data.recommended || []);
        // Pre-select all skills from resume
        setSelectedSkills(data.fromResume || []);
      }
    } catch (err) {
      console.error("Failed to load skills:", err);
    } finally {
      setLoadingSkills(false);
    }
  };

  const loadBulletOptions = async (roleIndex: number) => {
    if (!selectedJob || !masterResume) return;

    const role = masterResume.work_experience[roleIndex];
    const existingRoleIdx = selectedRoles.findIndex((r) => r.roleIndex === roleIndex);

    if (existingRoleIdx !== -1) {
      // Already loaded, toggle off
      setSelectedRoles(selectedRoles.filter((r) => r.roleIndex !== roleIndex));
      return;
    }

    // Add new role with first 3 master bullets pre-selected
    const masterBullets = role.description.slice(0, 8);
    const initialSelected = Math.min(3, masterBullets.length);
    const newRole: SelectedRole = {
      roleIndex,
      masterBullets,
      aiBullets: [],
      bulletOptions: masterBullets,
      selectedBullets: Array.from({ length: initialSelected }, (_, i) => i),
      loadingBullets: true,
    };
    setSelectedRoles([...selectedRoles, newRole]);

    try {
      const response = await fetch("/api/ai/generate-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob.id,
          role: {
            company: role.company,
            title: role.title,
            description: role.description,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedRoles((prev) =>
          prev.map((r) => {
            if (r.roleIndex !== roleIndex) return r;
            const combined = [...r.masterBullets, ...data.bullets];
            return {
              ...r,
              aiBullets: data.bullets,
              bulletOptions: combined,
              loadingBullets: false,
            };
          })
        );
      }
    } catch (err) {
      console.error("Failed to load bullets:", err);
      setSelectedRoles((prev) => prev.filter((r) => r.roleIndex !== roleIndex));
    }
  };

  // Hard limit of 12 bullets total across all roles
  const MAX_TOTAL_BULLETS = 12;
  const INITIAL_SUGGESTIONS_SHOWN = 4;

  // Track which roles have expanded suggestions
  const [expandedBulletOptions, setExpandedBulletOptions] = useState<Record<number, boolean>>({});

  // Calculate total selected bullets across all roles
  const totalSelectedBullets = selectedRoles.reduce((sum, r) => sum + r.selectedBullets.length, 0);

  const toggleBullet = (roleIndex: number, bulletIndex: number) => {
    setSelectedRoles((prev) => {
      // Calculate current total
      const currentTotal = prev.reduce((sum, r) => sum + r.selectedBullets.length, 0);

      return prev.map((r) => {
        if (r.roleIndex !== roleIndex) return r;

        const isSelected = r.selectedBullets.includes(bulletIndex);
        let newSelected: number[];

        if (isSelected) {
          // Always allow deselecting
          newSelected = r.selectedBullets.filter((i) => i !== bulletIndex);
        } else if (currentTotal < MAX_TOTAL_BULLETS) {
          // Only allow selecting if under total limit
          newSelected = [...r.selectedBullets, bulletIndex];
        } else {
          return r; // Max total bullets reached
        }

        return { ...r, selectedBullets: newSelected };
      });
    });
    setHasChanges(true);
  };

  // Get bullet text, checking for edits first
  const getBulletText = (roleIndex: number, bulletIndex: number, bulletOptions: string[]): string => {
    const key = `${roleIndex}-${bulletIndex}`;
    return editedBullets[key] ?? bulletOptions[bulletIndex];
  };

  // Start editing a bullet
  const startEditingBullet = (roleIndex: number, bulletIndex: number, currentText: string) => {
    const key = `${roleIndex}-${bulletIndex}`;
    setEditingBulletKey(key);
    setEditingBulletText(currentText);
  };

  // Save edited bullet
  const saveEditedBullet = () => {
    if (!editingBulletKey) return;
    setEditedBullets((prev) => ({
      ...prev,
      [editingBulletKey]: editingBulletText,
    }));
    setEditingBulletKey(null);
    setEditingBulletText("");
    setHasChanges(true);
  };

  // Cancel editing
  const cancelEditingBullet = () => {
    setEditingBulletKey(null);
    setEditingBulletText("");
  };

  // Move bullet up in the selected list
  const moveBulletUp = (roleIndex: number, selectedIndex: number) => {
    if (selectedIndex === 0) return;
    setSelectedRoles((prev) =>
      prev.map((r) => {
        if (r.roleIndex !== roleIndex) return r;
        const newSelected = [...r.selectedBullets];
        [newSelected[selectedIndex - 1], newSelected[selectedIndex]] = [newSelected[selectedIndex], newSelected[selectedIndex - 1]];
        return { ...r, selectedBullets: newSelected };
      })
    );
    setHasChanges(true);
  };

  // Move bullet down in the selected list
  const moveBulletDown = (roleIndex: number, selectedIndex: number, totalSelected: number) => {
    if (selectedIndex === totalSelected - 1) return;
    setSelectedRoles((prev) =>
      prev.map((r) => {
        if (r.roleIndex !== roleIndex) return r;
        const newSelected = [...r.selectedBullets];
        [newSelected[selectedIndex], newSelected[selectedIndex + 1]] = [newSelected[selectedIndex + 1], newSelected[selectedIndex]];
        return { ...r, selectedBullets: newSelected };
      })
    );
    setHasChanges(true);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    setHasChanges(true);
  };

  const selectSummary = (index: number) => {
    setSelectedSummaryIndex(index);
    setHasChanges(true);
  };

  const updateColor = async (newColor: string) => {
    if (!selectedJob) return;
    setAccentColor(newColor);

    await fetch(`/api/jobs/${selectedJob.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_color: newColor }),
    });
  };

  const generateCoverLetter = async () => {
    if (!selectedJob) return;
    setGeneratingCoverLetter(true);

    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/generate`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setCoverLetter(data.cover_letter);
        setHasChanges(true);
      }
    } catch (err) {
      console.error("Failed to generate cover letter:", err);
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const reviewResumeQuality = async () => {
    if (!selectedJob || selectedRoles.length === 0) return;
    setLoadingReview(true);
    setShowReviewPanel(true);

    try {
      // Collect all selected bullets from all roles
      const allBullets: string[] = [];
      const role = selectedRoles[0]; // Use first role for context
      const masterRole = masterResume?.work_experience[role.roleIndex];

      selectedRoles.forEach((r) => {
        r.selectedBullets.forEach((idx) => {
          allBullets.push(r.bulletOptions[idx]);
        });
      });

      const response = await fetch("/api/review-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullets: allBullets,
          role: masterRole ? { title: masterRole.title, company: masterRole.company } : { title: selectedJob.job_title, company: selectedJob.company_name },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReviewScore(data);
      }
    } catch (err) {
      console.error("Failed to review resume:", err);
    } finally {
      setLoadingReview(false);
    }
  };

  const buildTailoredResume = (): TailoredResume | null => {
    if (!masterResume) return null;

    const summary = selectedSummaryIndex !== null ? summaryOptions[selectedSummaryIndex] : "";

    const workExperience = selectedRoles.map((r) => {
      const masterRole = masterResume.work_experience[r.roleIndex];
      return {
        company: masterRole.company,
        title: masterRole.title,
        start_date: masterRole.start_date,
        end_date: masterRole.end_date,
        description: r.selectedBullets.map((i) => getBulletText(r.roleIndex, i, r.bulletOptions)),
      };
    });

    return {
      contact_info: masterResume.contact_info,
      summary,
      work_experience: workExperience,
      skills: selectedSkills,
      education: masterResume.education,
    };
  };

  const saveChanges = async () => {
    if (!selectedJob) return;
    setSaving(true);

    try {
      const tailoredResume = buildTailoredResume();

      await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailored_resume: JSON.stringify(tailoredResume),
          cover_letter: coverLetter,
        }),
      });
      setHasChanges(false);
      setSelectedJob({
        ...selectedJob,
        tailored_resume: JSON.stringify(tailoredResume),
        cover_letter: coverLetter,
      });
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const markAsApplied = async () => {
    if (!selectedJob) return;

    if (hasChanges) {
      await saveChanges();
    }

    await fetch(`/api/jobs/${selectedJob.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "applied", date_applied: new Date().toISOString() }),
    });

    router.push("/applied");
  };

  const downloadResumePDF = async () => {
    if (!selectedJob || !masterResume) return;

    const tailoredResume = buildTailoredResume();
    if (!tailoredResume) return;

    try {
      const resumeData = {
        contactInfo: {
          name: tailoredResume.contact_info.name,
          email: tailoredResume.contact_info.email,
          phone: tailoredResume.contact_info.phone,
          location: tailoredResume.contact_info.location,
          linkedin: tailoredResume.contact_info.linkedin || "",
        },
        jobTitle: tailoredResume.work_experience[0]?.title || selectedJob.job_title,
        summary: tailoredResume.summary,
        experience: tailoredResume.work_experience.map((exp) => ({
          title: exp.title,
          company: exp.company,
          dates: `${exp.start_date} - ${exp.end_date}`,
          description: exp.description, // Pass all selected bullets
        })),
        education: tailoredResume.education.map((edu) => ({
          school: edu.institution,
          degree: edu.degree,
          dates: edu.graduation_date,
          specialty: edu.field,
        })),
        skills: tailoredResume.skills,
      };

      const response = await fetch("/api/generate-resume-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: resumeData, template: "professional", accentColor }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Resume_${selectedJob.company_name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (!selectedJob.reviewed) {
        await fetch(`/api/jobs/${selectedJob.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewed: true }),
        });
        setSelectedJob({ ...selectedJob, reviewed: true });
        fetchJobs();
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const downloadCoverLetterPDF = async () => {
    if (!selectedJob || !masterResume) return;

    try {
      const paragraphs = coverLetter.split("\n\n").filter((p) => p.trim());
      const opening = paragraphs[0] || "";
      const body = paragraphs.slice(1, -1).join("\n\n") || "";
      const closing = paragraphs[paragraphs.length - 1] || "";

      const coverLetterData = {
        contactInfo: {
          name: masterResume.contact_info.name,
          email: masterResume.contact_info.email,
          phone: masterResume.contact_info.phone,
          location: masterResume.contact_info.location,
          linkedin: masterResume.contact_info.linkedin || "",
        },
        companyName: selectedJob.company_name,
        jobTitle: selectedJob.job_title,
        opening,
        body,
        closing,
      };

      const response = await fetch("/api/generate-cover-letter-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: coverLetterData, template: "professional", accentColor }),
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CoverLetter_${selectedJob.company_name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Cover letter PDF error:", error);
      alert("Failed to generate cover letter PDF.");
    }
  };

  // Build preview resume from current selections
  const previewResume = buildTailoredResume();

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TabsNav reviewCount={jobs.filter((j) => !j.reviewed).length} />

      <div className="ml-64 p-8">
        {!selectedJob ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Review ({jobs.length} pending)
            </h1>

            {jobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-500">
                No jobs to review. Add a job from the Dashboard.
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/review?job=${job.id}`)}
                    className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.job_title}</h3>
                        <p className="text-gray-600">{job.company_name}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setSummaryOptions([]);
                    setSelectedSummaryIndex(null);
                    setSelectedRoles([]);
                    setSelectedSkills([]);
                    setCoverLetter("");
                    setHasChanges(false);
                    router.push("/review");
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm mb-2"
                >
                  &#8592; Back to list
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedJob.job_title} at {selectedJob.company_name}
                </h1>
              </div>
              <div className="flex gap-3">
                {hasChanges && (
                  <button
                    onClick={saveChanges}
                    disabled={saving}
                    className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                )}
                <button
                  onClick={markAsApplied}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Mark as Applied
                </button>
              </div>
            </div>

            <div className={`grid gap-6 ${showJobDetails ? "lg:grid-cols-[1fr_1fr_280px]" : "lg:grid-cols-2"}`}>
              {/* Left side - Accordions */}
              <div className="space-y-4">
                {/* Resume/Cover Letter Tabs */}
                <div className="bg-white rounded-xl shadow p-2 flex">
                  <button
                    onClick={() => setActiveTab("resume")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "resume" ? "bg-blue-100 text-blue-700" : "text-gray-600"
                    }`}
                  >
                    Resume Builder
                  </button>
                  <button
                    onClick={() => setActiveTab("cover")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "cover" ? "bg-blue-100 text-blue-700" : "text-gray-600"
                    }`}
                  >
                    Cover Letter
                  </button>
                  <button
                    onClick={() => setActiveTab("job-details")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "job-details" ? "bg-blue-100 text-blue-700" : "text-gray-600"
                    }`}
                  >
                    Job Details
                  </button>
                </div>

                {activeTab === "resume" && (
                  <>
                    {/* Summary Accordion */}
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                      <button
                        onClick={() => toggleSection("summary")}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            selectedSummaryIndex !== null ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {selectedSummaryIndex !== null ? "✓" : "1"}
                          </div>
                          <span className="font-medium text-gray-900">Summary</span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === "summary" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedSection === "summary" && (
                        <div className="px-4 pb-4 border-t">
                          {loadingSummaries ? (
                            <div className="py-8 text-center">
                              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Generating summary options...</p>
                            </div>
                          ) : (
                            <div className="pt-3">
                              {/* Selected Summary at top - Editable */}
                              {selectedSummaryIndex !== null && summaryOptions[selectedSummaryIndex] && (
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-gray-600">Selected:</p>
                                    {!editingSummary && (
                                      <button
                                        onClick={() => {
                                          setEditingSummary(true);
                                          setEditedSummaryText(summaryOptions[selectedSummaryIndex]);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                  {editingSummary ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editedSummaryText}
                                        onChange={(e) => setEditedSummaryText(e.target.value)}
                                        className="w-full p-3 rounded-lg border-2 border-blue-500 bg-white text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        rows={4}
                                        autoFocus
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          onClick={() => {
                                            setEditingSummary(false);
                                            setEditedSummaryText("");
                                          }}
                                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => {
                                            const newOptions = [...summaryOptions];
                                            newOptions[selectedSummaryIndex] = editedSummaryText;
                                            setSummaryOptions(newOptions);
                                            setEditingSummary(false);
                                            setEditedSummaryText("");
                                          }}
                                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => {
                                        setEditingSummary(true);
                                        setEditedSummaryText(summaryOptions[selectedSummaryIndex]);
                                      }}
                                      className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                                    >
                                      <p className="text-sm text-gray-700">{summaryOptions[selectedSummaryIndex]}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Alternative summaries below */}
                              {summaryOptions.filter((_, idx) => idx !== selectedSummaryIndex).length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-purple-600 mb-2">AI Alternatives (click to select):</p>
                                  <div className="space-y-2">
                                    {summaryOptions.map((summary, idx) => {
                                      if (idx === selectedSummaryIndex) return null;
                                      return (
                                        <div
                                          key={idx}
                                          onClick={() => selectSummary(idx)}
                                          className="p-3 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors"
                                        >
                                          <p className="text-sm text-gray-700">{summary}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Work Experience Accordion */}
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                      <button
                        onClick={() => toggleSection("experience")}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            selectedRoles.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {selectedRoles.length > 0 ? "✓" : "2"}
                          </div>
                          <span className="font-medium text-gray-900">Work Experience</span>
                          {selectedRoles.length > 0 && (
                            <span className="text-sm text-gray-500">({selectedRoles.length} role{selectedRoles.length > 1 ? "s" : ""} selected)</span>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === "experience" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedSection === "experience" && masterResume && (
                        <div className="px-4 pb-4 border-t">
                          <p className="text-sm text-gray-600 py-3">
                            Select bullets for your resume ({totalSelectedBullets}/{MAX_TOTAL_BULLETS} selected):
                          </p>

                          <div className="space-y-3">
                            {selectedRoles.length === 0 ? (
                              <div className="py-8 text-center">
                                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Generating bullet options for your roles...</p>
                              </div>
                            ) : (
                              selectedRoles.map((selectedRole) => {
                                const role = masterResume.work_experience[selectedRole.roleIndex];
                                if (!role) return null;

                                // Get selected bullets text
                                const selectedBulletTexts = selectedRole.selectedBullets.map(idx => selectedRole.bulletOptions[idx]);
                                // Get unselected bullets (AI alternatives not yet selected)
                                const unselectedBullets = selectedRole.bulletOptions
                                  .map((bullet, idx) => ({ bullet, idx }))
                                  .filter(({ idx }) => !selectedRole.selectedBullets.includes(idx));

                                return (
                                  <div key={selectedRole.roleIndex} className="rounded-lg border border-blue-500">
                                    <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
                                      <div className="font-medium text-gray-900">{role.title}</div>
                                      <div className="text-sm text-gray-500">{role.company} | {role.start_date} - {role.end_date}</div>
                                    </div>

                                    <div className="px-3 pb-3 bg-gray-50">
                                      {selectedRole.loadingBullets ? (
                                        <div className="py-4 text-center">
                                          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                                          <p className="text-xs text-gray-500">Loading AI alternatives...</p>
                                        </div>
                                      ) : (
                                        <div className="pt-3">
                                          {/* Selected bullets at top */}
                                          <div className="mb-3">
                                            <p className="text-xs font-medium text-gray-600 mb-2">
                                              Selected ({selectedRole.selectedBullets.length}) - drag to reorder, click edit to modify:
                                            </p>
                                            <div className="space-y-2">
                                              {selectedRole.selectedBullets.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">No bullets selected yet</p>
                                              ) : (
                                                selectedRole.selectedBullets.map((bulletIdx, selectedIndex) => {
                                                  const bulletText = getBulletText(selectedRole.roleIndex, bulletIdx, selectedRole.bulletOptions);
                                                  const isFromMaster = bulletIdx < selectedRole.masterBullets.length;
                                                  const editKey = `${selectedRole.roleIndex}-${bulletIdx}`;
                                                  const isEditing = editingBulletKey === editKey;
                                                  const isEdited = editedBullets[editKey] !== undefined;

                                                  return (
                                                    <div
                                                      key={bulletIdx}
                                                      className={`p-2 rounded border-2 text-sm ${
                                                        isFromMaster ? "border-blue-400 bg-blue-50" : "border-purple-400 bg-purple-50"
                                                      } ${isEdited ? "ring-2 ring-green-300" : ""}`}
                                                    >
                                                      {isEditing ? (
                                                        /* Editing mode */
                                                        <div className="space-y-2">
                                                          <textarea
                                                            value={editingBulletText}
                                                            onChange={(e) => setEditingBulletText(e.target.value)}
                                                            className="w-full p-2 border rounded text-sm resize-none"
                                                            rows={3}
                                                            autoFocus
                                                          />
                                                          <div className="flex justify-end gap-2">
                                                            <button
                                                              onClick={cancelEditingBullet}
                                                              className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                                                            >
                                                              Cancel
                                                            </button>
                                                            <button
                                                              onClick={saveEditedBullet}
                                                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                            >
                                                              Save
                                                            </button>
                                                          </div>
                                                        </div>
                                                      ) : (
                                                        /* Display mode */
                                                        <div className="flex items-start gap-2">
                                                          {/* Reorder buttons */}
                                                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                                                            <button
                                                              onClick={(e) => { e.stopPropagation(); moveBulletUp(selectedRole.roleIndex, selectedIndex); }}
                                                              disabled={selectedIndex === 0}
                                                              className={`p-0.5 rounded ${selectedIndex === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-200"}`}
                                                              title="Move up"
                                                            >
                                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                              </svg>
                                                            </button>
                                                            <button
                                                              onClick={(e) => { e.stopPropagation(); moveBulletDown(selectedRole.roleIndex, selectedIndex, selectedRole.selectedBullets.length); }}
                                                              disabled={selectedIndex === selectedRole.selectedBullets.length - 1}
                                                              className={`p-0.5 rounded ${selectedIndex === selectedRole.selectedBullets.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-200"}`}
                                                              title="Move down"
                                                            >
                                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                              </svg>
                                                            </button>
                                                          </div>
                                                          {/* Checkbox */}
                                                          <div
                                                            onClick={() => toggleBullet(selectedRole.roleIndex, bulletIdx)}
                                                            className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer ${
                                                              isFromMaster ? "bg-blue-500" : "bg-purple-500"
                                                            }`}
                                                            title="Click to remove"
                                                          >
                                                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                          </div>
                                                          {/* Bullet text */}
                                                          <span className="text-gray-700 flex-1">{bulletText}</span>
                                                          {/* Labels and edit button */}
                                                          <div className="flex items-center gap-1 flex-shrink-0">
                                                            {isEdited && (
                                                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600">
                                                                Edited
                                                              </span>
                                                            )}
                                                            <span className={`text-xs px-1.5 py-0.5 rounded ${isFromMaster ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                                                              {isFromMaster ? "Resume" : "AI"}
                                                            </span>
                                                            <button
                                                              onClick={(e) => { e.stopPropagation(); startEditingBullet(selectedRole.roleIndex, bulletIdx, bulletText); }}
                                                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                              title="Edit bullet"
                                                            >
                                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                              </svg>
                                                            </button>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })
                                              )}
                                            </div>
                                          </div>

                                          {/* Unselected bullets below */}
                                          {unselectedBullets.length > 0 && (
                                            <div>
                                              {(() => {
                                                const isMaxReached = totalSelectedBullets >= MAX_TOTAL_BULLETS;
                                                const isExpanded = expandedBulletOptions[selectedRole.roleIndex];
                                                const bulletsToShow = isExpanded
                                                  ? unselectedBullets
                                                  : unselectedBullets.slice(0, INITIAL_SUGGESTIONS_SHOWN);
                                                const hasMoreOptions = unselectedBullets.length > INITIAL_SUGGESTIONS_SHOWN;

                                                return (
                                                  <>
                                                    <p className="text-xs font-medium text-purple-600 mb-2">
                                                      Available options - click to add:
                                                    </p>
                                                    {isMaxReached && (
                                                      <p className="text-xs text-amber-600 mb-2">
                                                        Maximum {MAX_TOTAL_BULLETS} bullets reached - remove one to add more
                                                      </p>
                                                    )}
                                                    <div className="space-y-2">
                                                      {bulletsToShow.map(({ bullet, idx }) => {
                                                        const isFromMaster = idx < selectedRole.masterBullets.length;
                                                        return (
                                                          <div
                                                            key={idx}
                                                            onClick={() => !isMaxReached && toggleBullet(selectedRole.roleIndex, idx)}
                                                            className={`p-2 rounded border cursor-pointer text-sm transition-colors ${
                                                              isMaxReached
                                                                ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                                                                : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                                                            }`}
                                                          >
                                                            <div className="flex items-start gap-2">
                                                              <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                                                              <span className="text-gray-700 flex-1">{bullet}</span>
                                                              <span className={`text-xs px-1.5 py-0.5 rounded ${isFromMaster ? "bg-gray-100 text-gray-500" : "bg-purple-50 text-purple-500"}`}>
                                                                {isFromMaster ? "Resume" : "AI"}
                                                              </span>
                                                            </div>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                    {hasMoreOptions && !isExpanded && (
                                                      <button
                                                        onClick={() => setExpandedBulletOptions(prev => ({ ...prev, [selectedRole.roleIndex]: true }))}
                                                        className="w-full py-2 mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center justify-center gap-1"
                                                      >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                        Load more options ({unselectedBullets.length - INITIAL_SUGGESTIONS_SHOWN} more)
                                                      </button>
                                                    )}
                                                    {isExpanded && hasMoreOptions && (
                                                      <button
                                                        onClick={() => setExpandedBulletOptions(prev => ({ ...prev, [selectedRole.roleIndex]: false }))}
                                                        className="w-full py-2 mt-2 text-sm text-gray-500 hover:text-gray-600 flex items-center justify-center gap-1"
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
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Skills Accordion */}
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                      <button
                        onClick={() => toggleSection("skills")}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            selectedSkills.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {selectedSkills.length > 0 ? "✓" : "3"}
                          </div>
                          <span className="font-medium text-gray-900">Skills</span>
                          {selectedSkills.length > 0 && (
                            <span className="text-sm text-gray-500">({selectedSkills.length} selected)</span>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === "skills" ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedSection === "skills" && (
                        <div className="px-4 pb-4 border-t">
                          {loadingSkills ? (
                            <div className="py-8 text-center">
                              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Analyzing skills for this role...</p>
                            </div>
                          ) : (
                            <div className="pt-3">
                              {/* Selected skills at top */}
                              <div className="mb-4">
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                  Selected ({selectedSkills.length}) - click to remove:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedSkills.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No skills selected yet</p>
                                  ) : (
                                    selectedSkills.map((skill) => {
                                      const isFromResume = skillsFromResume.includes(skill);
                                      return (
                                        <button
                                          key={skill}
                                          onClick={() => toggleSkill(skill)}
                                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                            isFromResume
                                              ? "bg-blue-100 text-blue-700 border-2 border-blue-400"
                                              : "bg-purple-100 text-purple-700 border-2 border-purple-400"
                                          }`}
                                        >
                                          {skill} ✕
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>

                              {/* Skills from Job Description - Most Important */}
                              {skillsFromJobDescription.filter(s => !selectedSkills.includes(s)).length > 0 && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-xs font-medium text-amber-700">Required in Job Description - click to add:</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {skillsFromJobDescription
                                      .filter(skill => !selectedSkills.includes(skill))
                                      .map((skill) => (
                                        <button
                                          key={skill}
                                          onClick={() => toggleSkill(skill)}
                                          className="px-3 py-1 rounded-full text-sm transition-colors bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 font-medium"
                                        >
                                          + {skill}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Unselected skills from resume */}
                              {skillsFromResume.filter(s => !selectedSkills.includes(s)).length > 0 && (
                                <div className="mb-4">
                                  <p className="text-xs font-medium text-gray-600 mb-2">From your resume - click to add:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {skillsFromResume
                                      .filter(skill => !selectedSkills.includes(skill))
                                      .map((skill) => (
                                        <button
                                          key={skill}
                                          onClick={() => toggleSkill(skill)}
                                          className="px-3 py-1 rounded-full text-sm transition-colors bg-gray-100 text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                        >
                                          + {skill}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* AI recommended skills */}
                              {recommendedSkills.filter(s => !selectedSkills.includes(s)).length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-purple-600 mb-2">AI Suggestions - click to add:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {recommendedSkills
                                      .filter(skill => !selectedSkills.includes(skill))
                                      .map((skill) => (
                                        <button
                                          key={skill}
                                          onClick={() => toggleSkill(skill)}
                                          className="px-3 py-1 rounded-full text-sm transition-colors bg-gray-100 text-gray-600 border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                                        >
                                          + {skill}
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Color Selection */}
                    <div className="bg-white rounded-xl shadow p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Accent Color</h3>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => updateColor(c.hex)}
                            title={c.name}
                            className={`w-8 h-8 rounded-full transition-all ${
                              accentColor === c.hex
                                ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                                : "hover:scale-105"
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Resume Quality Score */}
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                      <button
                        onClick={() => showReviewPanel ? setShowReviewPanel(false) : reviewResumeQuality()}
                        disabled={selectedRoles.length === 0 || loadingReview}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            reviewScore ? (reviewScore.overallScore >= 70 ? "bg-green-100 text-green-700" : reviewScore.overallScore >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700") : "bg-purple-100 text-purple-600"
                          }`}>
                            {loadingReview ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : reviewScore ? (
                              Math.round(reviewScore.overallScore)
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {loadingReview ? "Analyzing..." : reviewScore ? `Score: ${reviewScore.overallScore}/100` : "AI Resume Score"}
                          </span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${showReviewPanel ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showReviewPanel && (
                        <div className="px-4 pb-4 border-t">
                          {loadingReview ? (
                            <div className="py-8 text-center">
                              <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
                              <p className="text-sm text-gray-500">AI is reviewing your resume bullets...</p>
                            </div>
                          ) : reviewScore ? (
                            <div className="pt-4 space-y-4">
                              {/* Overall Score */}
                              <div className="text-center">
                                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${
                                  reviewScore.overallScore >= 70 ? "bg-green-100 text-green-700" :
                                  reviewScore.overallScore >= 50 ? "bg-yellow-100 text-yellow-700" :
                                  "bg-red-100 text-red-700"
                                }`}>
                                  {reviewScore.overallScore}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Overall Score</p>
                              </div>

                              {/* Category Scores */}
                              <div className="grid grid-cols-5 gap-2">
                                {Object.entries(reviewScore.categoryScores).map(([key, value]) => (
                                  <div key={key} className="text-center">
                                    <div className={`text-sm font-semibold ${
                                      value >= 7 ? "text-green-600" : value >= 5 ? "text-yellow-600" : "text-red-600"
                                    }`}>
                                      {value}/10
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">{key}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Strengths */}
                              {reviewScore.strengths.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-green-600 mb-1">Strengths</p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {reviewScore.strengths.map((s, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <span className="text-green-500">+</span> {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Improvements */}
                              {reviewScore.improvements.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-amber-600 mb-1">Areas to Improve</p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {reviewScore.improvements.map((s, i) => (
                                      <li key={i} className="flex items-start gap-1">
                                        <span className="text-amber-500">!</span> {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Bullet Feedback */}
                              {reviewScore.bulletFeedback.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-2">Bullet Analysis</p>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {reviewScore.bulletFeedback.map((fb, i) => (
                                      <div key={i} className={`p-2 rounded text-xs ${
                                        fb.score >= 7 ? "bg-green-50 border border-green-200" :
                                        fb.score >= 5 ? "bg-yellow-50 border border-yellow-200" :
                                        "bg-red-50 border border-red-200"
                                      }`}>
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="text-gray-700 truncate flex-1 mr-2">{fb.bullet}</span>
                                          <span className={`font-semibold ${
                                            fb.score >= 7 ? "text-green-600" : fb.score >= 5 ? "text-yellow-600" : "text-red-600"
                                          }`}>{fb.score}/10</span>
                                        </div>
                                        <p className="text-gray-500">{fb.feedback}</p>
                                        {fb.suggestion && (
                                          <p className="text-purple-600 mt-1 italic">Suggestion: {fb.suggestion}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <button
                                onClick={reviewResumeQuality}
                                className="w-full py-2 text-sm text-purple-600 hover:text-purple-700"
                              >
                                Re-analyze
                              </button>
                            </div>
                          ) : (
                            <div className="py-4 text-center text-sm text-gray-500">
                              Click to analyze your resume bullets with AI
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Download Buttons */}
                    <div className="bg-white rounded-xl shadow p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Download</h3>
                      <button
                        onClick={downloadResumePDF}
                        disabled={selectedSummaryIndex === null || selectedRoles.length === 0}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Download Resume PDF
                      </button>
                      {(selectedSummaryIndex === null || selectedRoles.length === 0) && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Complete Summary and Work Experience sections first
                        </p>
                      )}
                    </div>
                  </>
                )}

                {activeTab === "cover" && (
                  <>
                    <div className="bg-white rounded-xl shadow p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">Cover Letter</h3>
                        {!coverLetter && (
                          <button
                            onClick={generateCoverLetter}
                            disabled={generatingCoverLetter}
                            className="text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          >
                            {generatingCoverLetter ? "Generating..." : "Generate with AI"}
                          </button>
                        )}
                      </div>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => {
                          setCoverLetter(e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={16}
                        placeholder="Write or generate your cover letter..."
                      />
                    </div>

                    {/* Color Selection */}
                    <div className="bg-white rounded-xl shadow p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Accent Color</h3>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => updateColor(c.hex)}
                            title={c.name}
                            className={`w-8 h-8 rounded-full transition-all ${
                              accentColor === c.hex
                                ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                                : "hover:scale-105"
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="bg-white rounded-xl shadow p-4">
                      <button
                        onClick={downloadCoverLetterPDF}
                        disabled={!coverLetter}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Download Cover Letter PDF
                      </button>
                    </div>
                  </>
                )}

                {activeTab === "job-details" && selectedJob && (
                  <>
                    {/* Company Info */}
                    <div className="bg-white rounded-xl shadow p-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-gray-400">
                            {selectedJob.company_name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900">{selectedJob.company_name}</h2>
                          <p className="text-lg text-gray-600">{selectedJob.job_title}</p>
                        </div>
                      </div>

                      {/* Employment Details */}
                      {selectedJob.job_details_parsed && (() => {
                        const details: JobDetailsParsed = JSON.parse(selectedJob.job_details_parsed);
                        return (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {details.work_type && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                {details.work_type}
                              </span>
                            )}
                            {details.location && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                {details.location}
                              </span>
                            )}
                            {details.salary_range && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                {details.salary_range}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Job Description */}
                    <div className="bg-white rounded-xl shadow p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Job Description</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedJob.job_description || "No description available"}
                      </div>
                    </div>

                    {/* Requirements & Responsibilities (if parsed) */}
                    {selectedJob.job_details_parsed && (() => {
                      const details: JobDetailsParsed = JSON.parse(selectedJob.job_details_parsed);
                      return (
                        <>
                          {details.responsibilities && details.responsibilities.length > 0 && (
                            <div className="bg-white rounded-xl shadow p-4">
                              <h3 className="font-medium text-gray-900 mb-3">Responsibilities</h3>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {details.responsibilities.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {details.requirements && details.requirements.length > 0 && (
                            <div className="bg-white rounded-xl shadow p-4">
                              <h3 className="font-medium text-gray-900 mb-3">Requirements</h3>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {details.requirements.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {details.qualifications && details.qualifications.length > 0 && (
                            <div className="bg-white rounded-xl shadow p-4">
                              <h3 className="font-medium text-gray-900 mb-3">Qualifications</h3>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {details.qualifications.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {details.benefits && details.benefits.length > 0 && (
                            <div className="bg-white rounded-xl shadow p-4">
                              <h3 className="font-medium text-gray-900 mb-3">Benefits</h3>
                              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                {details.benefits.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* Right side - Live Preview */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8" style={{ height: "fit-content" }}>
                <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Live Preview</span>
                  <span className="text-xs text-gray-500">Professional template</span>
                </div>

                <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
                  {activeTab === "resume" && previewResume && (
                    <div className="text-xs" style={{ fontFamily: "'Inter', sans-serif", transform: "scale(0.65)", transformOrigin: "top left", width: "153.85%" }}>
                      {/* Single column ATS layout with fixed footer */}
                      <div style={{ padding: "24px 28px", minHeight: "715px", display: "flex", flexDirection: "column" }}>
                        {/* Header - Name centered */}
                        <div className="text-center" style={{ marginBottom: "6px" }}>
                          <div style={{ fontSize: "18pt", fontWeight: 700, color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                            {previewResume.contact_info.name}
                          </div>
                          <div style={{ fontSize: "7.5pt", color: "#333", marginTop: "4px" }}>
                            {[previewResume.contact_info.location, previewResume.contact_info.phone, previewResume.contact_info.email].filter(Boolean).join(" • ")}
                          </div>
                          {previewResume.contact_info.linkedin && (
                            <div style={{ fontSize: "7.5pt", color: "#333" }}>{previewResume.contact_info.linkedin}</div>
                          )}
                        </div>

                        {/* Main Content - Summary and Work Experience */}
                        <div style={{ flex: 1 }}>
                          {/* Summary Section */}
                          <div style={{ marginBottom: "12px" }}>
                            <h3 style={{ fontSize: "9pt", fontWeight: 700, color: accentColor, textTransform: "uppercase", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px" }}>Summary</h3>
                            <p style={{ fontSize: "7.5pt", color: "#333", lineHeight: "1.5" }}>
                              {previewResume.summary || "Select a summary option"}
                            </p>
                          </div>

                          {/* Work Experience Section */}
                          <div>
                            <h3 style={{ fontSize: "9pt", fontWeight: 700, color: accentColor, textTransform: "uppercase", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px" }}>Work Experience</h3>
                            {previewResume.work_experience.length > 0 ? (
                              previewResume.work_experience.map((exp, i) => (
                                <div key={i} style={{ marginBottom: "10px" }}>
                                  <div className="flex justify-between" style={{ marginBottom: "2px" }}>
                                    <span style={{ fontSize: "7.5pt", fontWeight: 600, color: "#1a1a1a" }}>{exp.title}, {exp.company}</span>
                                    <span style={{ fontSize: "7.5pt", color: "#333" }}>{exp.start_date} - {exp.end_date}</span>
                                  </div>
                                  <div style={{ fontSize: "7.5pt", color: "#333" }}>
                                    {exp.description.map((d, j) => (
                                      <p key={j} style={{ paddingLeft: "10px", position: "relative", marginBottom: "1px" }}>
                                        <span style={{ position: "absolute", left: 0 }}>•</span> {d}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p style={{ fontSize: "7.5pt", color: "#999" }}>Select roles and bullets</p>
                            )}
                          </div>
                        </div>

                        {/* Footer - Skills and Education pinned to bottom */}
                        <div style={{ marginTop: "auto" }}>
                          {/* Skills Section */}
                          <div style={{ marginBottom: "12px" }}>
                            <h3 style={{ fontSize: "9pt", fontWeight: 700, color: accentColor, textTransform: "uppercase", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px" }}>Skills</h3>
                            {previewResume.skills.length > 0 ? (
                              <p style={{ fontSize: "7.5pt", color: "#333" }}>
                                {previewResume.skills.join(" | ")}
                              </p>
                            ) : (
                              <p style={{ fontSize: "7.5pt", color: "#999" }}>Select skills</p>
                            )}
                          </div>

                          {/* Education Section */}
                          <div>
                            <h3 style={{ fontSize: "9pt", fontWeight: 700, color: accentColor, textTransform: "uppercase", borderBottom: "1px solid #ccc", paddingBottom: "3px", marginBottom: "6px" }}>Education</h3>
                            {previewResume.education.map((edu, i) => (
                              <div key={i} style={{ marginBottom: "6px" }}>
                                <div style={{ fontSize: "7.5pt", fontWeight: 600, color: "#1a1a1a" }}>{edu.degree}</div>
                                <div style={{ fontSize: "7.5pt", color: "#333" }}>{edu.institution}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "cover" && masterResume && (
                    <div className="p-8 text-xs" style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
                      <div className="mb-4">
                        <h1 style={{ fontFamily: "var(--font-lora), 'Lora', serif", fontSize: "16pt", color: accentColor }}>
                          {masterResume.contact_info.name}
                        </h1>
                        <div style={{ fontSize: "8pt", color: "#666" }}>
                          <p>{masterResume.contact_info.email}</p>
                          <p>{masterResume.contact_info.phone}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: "8pt", marginBottom: "12px" }}>
                        {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                      <p style={{ fontSize: "8pt", marginBottom: "8px" }}>Dear Hiring Manager,</p>
                      <div style={{ fontSize: "8pt", color: "#444", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                        {coverLetter || "Your cover letter will appear here..."}
                      </div>
                      <div style={{ marginTop: "16px", fontSize: "8pt" }}>
                        <p>Sincerely,</p>
                        <p style={{ marginTop: "16px", fontWeight: 600 }}>{masterResume.contact_info.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Job Details Sidebar */}
              {showJobDetails && selectedJob?.job_details_parsed && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8" style={{ height: "fit-content" }}>
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Job Details</span>
                    <button
                      onClick={() => setShowJobDetails(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="overflow-auto p-4 space-y-4" style={{ maxHeight: "calc(100vh - 200px)" }}>
                    {(() => {
                      const details: JobDetailsParsed = JSON.parse(selectedJob.job_details_parsed);
                      return (
                        <>
                          {/* Location & Work Type */}
                          {(details.location || details.work_type || details.salary_range) && (
                            <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-100">
                              {details.location && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {details.location}
                                </span>
                              )}
                              {details.work_type && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-600">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {details.work_type}
                                </span>
                              )}
                              {details.salary_range && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-xs text-green-600">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {details.salary_range}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Requirements */}
                          {details.requirements.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Requirements
                              </h4>
                              <ul className="space-y-1.5">
                                {details.requirements.map((req, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Responsibilities */}
                          {details.responsibilities.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Responsibilities
                              </h4>
                              <ul className="space-y-1.5">
                                {details.responsibilities.map((resp, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <span className="text-indigo-400 mt-0.5">•</span>
                                    <span>{resp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Qualifications */}
                          {details.qualifications.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                Qualifications
                              </h4>
                              <ul className="space-y-1.5">
                                {details.qualifications.map((qual, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <span className="text-purple-400 mt-0.5">•</span>
                                    <span>{qual}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Benefits */}
                          {details.benefits.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                                Benefits
                              </h4>
                              <ul className="space-y-1.5">
                                {details.benefits.map((benefit, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <span className="text-green-400 mt-0.5">•</span>
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Full Description - Collapsible */}
                    {selectedJob.job_description && (
                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Full Description
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform ${showFullDescription ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showFullDescription && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                            <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                              {selectedJob.job_description}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Toggle button when sidebar is hidden */}
              {!showJobDetails && selectedJob?.job_details_parsed && (
                <button
                  onClick={() => setShowJobDetails(true)}
                  className="fixed right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2 rounded-l-lg shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all"
                  title="Show Job Details"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
