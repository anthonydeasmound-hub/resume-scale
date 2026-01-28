"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { ResumeData } from "@/types/resume";
import TabsNav from "@/components/TabsNav";
import JobAnalysisPanel from "@/components/review/JobAnalysisPanel";
import ATSScoreCard from "@/components/review/ATSScoreCard";
import { ATSScore } from "@/lib/ats-scorer";
import { ReviewSkeleton } from "@/components/Skeleton";
import { Job, MasterResume, TailoredResume, SelectedRole, ResumeReviewResult } from "@/components/review/types";
import JobSelectionList from "@/components/review/JobSelectionList";
import SummarySection from "@/components/review/SummarySection";
import WorkExperienceSection from "@/components/review/WorkExperienceSection";
import SkillsSection from "@/components/review/SkillsSection";
import ResumeQualityPanel from "@/components/review/ResumeQualityPanel";
import JobDetailsSidebar from "@/components/review/JobDetailsSidebar";
import CoverLetterPreview from "@/components/review/CoverLetterPreview";
import ResumePreviewPane from "@/components/review/ResumePreviewPane";

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
  // Drag and drop state
  const [draggedBullet, setDraggedBullet] = useState<{ roleIndex: number; selectedIndex: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Skills options
  const [skillsFromResume, setSkillsFromResume] = useState<string[]>([]);
  const [skillsFromJobDescription, setSkillsFromJobDescription] = useState<string[]>([]);
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Cover letter
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);

  // Iframe preview
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Resume Review Score
  const [reviewScore, setReviewScore] = useState<ResumeReviewResult | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  // Job details sidebar
  const [showJobDetails, setShowJobDetails] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // ATS Score
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [loadingAts, setLoadingAts] = useState(false);

  useEffect(() => {
    document.title = "ResumeGenie - Review";
  }, []);

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

  // Drag and drop handlers for bullet reordering
  const handleDragStart = (roleIndex: number, selectedIndex: number) => {
    setDraggedBullet({ roleIndex, selectedIndex });
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(targetIndex);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, roleIndex: number, targetIndex: number) => {
    e.preventDefault();
    if (!draggedBullet || draggedBullet.roleIndex !== roleIndex) {
      setDraggedBullet(null);
      setDragOverIndex(null);
      return;
    }

    const sourceIndex = draggedBullet.selectedIndex;
    if (sourceIndex === targetIndex) {
      setDraggedBullet(null);
      setDragOverIndex(null);
      return;
    }

    setSelectedRoles((prev) =>
      prev.map((r) => {
        if (r.roleIndex !== roleIndex) return r;
        const newSelected = [...r.selectedBullets];
        const [removed] = newSelected.splice(sourceIndex, 1);
        newSelected.splice(targetIndex, 0, removed);
        return { ...r, selectedBullets: newSelected };
      })
    );

    setDraggedBullet(null);
    setDragOverIndex(null);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedBullet(null);
    setDragOverIndex(null);
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

  const calculateAtsScore = async () => {
    if (!selectedJob || !masterResume || selectedRoles.length === 0) return;
    setLoadingAts(true);

    try {
      // Build resume content for scoring
      const resumeContent = {
        summary: selectedSummaryIndex !== null ? summaryOptions[selectedSummaryIndex] : undefined,
        experience: selectedRoles.map((r) => {
          const masterRole = masterResume.work_experience[r.roleIndex];
          return {
            title: masterRole.title,
            company: masterRole.company,
            bullets: r.selectedBullets.map((i) => getBulletText(r.roleIndex, i, r.bulletOptions)),
          };
        }),
        skills: selectedSkills,
        education: masterResume.education.map(e => ({
          degree: e.degree,
          field: e.field,
          institution: e.institution,
        })),
      };

      const response = await fetch("/api/ats/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resumeContent,
          jobDescription: selectedJob.job_description,
          jobTitle: selectedJob.job_title,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAtsScore(data);
      }
    } catch (err) {
      console.error("Failed to calculate ATS score:", err);
    } finally {
      setLoadingAts(false);
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

  // Convert TailoredResume to ResumeData format for PDF template
  const convertToResumeData = useCallback((tailored: TailoredResume, jobTitle: string): ResumeData => {
    return {
      contactInfo: {
        name: tailored.contact_info.name,
        email: tailored.contact_info.email,
        phone: tailored.contact_info.phone,
        location: tailored.contact_info.location,
        linkedin: tailored.contact_info.linkedin,
      },
      jobTitle: jobTitle,
      summary: tailored.summary,
      experience: tailored.work_experience.map((exp) => ({
        title: exp.title,
        company: exp.company,
        dates: `${exp.start_date} - ${exp.end_date}`,
        description: exp.description,
      })),
      education: tailored.education.map((edu) => ({
        school: edu.institution,
        degree: edu.degree,
        dates: edu.graduation_date,
      })),
      skills: tailored.skills,
    };
  }, []);

  // Fetch preview HTML whenever resume data changes
  useEffect(() => {
    const fetchPreviewHtml = async () => {
      const tailored = buildTailoredResume();
      if (!tailored || !selectedJob) {
        setPreviewHtml("");
        return;
      }

      setLoadingPreview(true);
      try {
        const resumeData = convertToResumeData(tailored, selectedJob.job_title);
        const response = await fetch("/api/resume/preview-html", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: resumeData, accentColor }),
        });

        if (response.ok) {
          const html = await response.text();
          setPreviewHtml(html);
        }
      } catch (err) {
        console.error("Failed to fetch preview HTML:", err);
      } finally {
        setLoadingPreview(false);
      }
    };

    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(fetchPreviewHtml, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedRoles, selectedSummaryIndex, summaryOptions, selectedSkills, accentColor, masterResume, selectedJob, editedBullets, convertToResumeData]);

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
      <div className="min-h-screen bg-brand-gray">
        <TabsNav />
        <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
          <ReviewSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <TabsNav reviewCount={jobs.filter((j) => !j.reviewed).length} />

      <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
        {!selectedJob ? (
          <JobSelectionList
            jobs={jobs}
            onSelectJob={(jobId) => router.push(`/review?job=${jobId}`)}
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
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
                  className="text-brand-blue hover:text-brand-blue-dark text-sm mb-2"
                >
                  &#8592; Back to list
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedJob.job_title} at {selectedJob.company_name}
                </h1>
              </div>
              <div className="flex flex-wrap gap-3">
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
                      activeTab === "resume" ? "bg-blue-100 text-brand-blue" : "text-gray-600"
                    }`}
                  >
                    Resume Builder
                  </button>
                  <button
                    onClick={() => setActiveTab("cover")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "cover" ? "bg-blue-100 text-brand-blue" : "text-gray-600"
                    }`}
                  >
                    Cover Letter
                  </button>
                  <button
                    onClick={() => setActiveTab("job-details")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "job-details" ? "bg-blue-100 text-brand-blue" : "text-gray-600"
                    }`}
                  >
                    Job Details
                  </button>
                </div>

                {activeTab === "resume" && (
                  <>
                    <SummarySection
                      expandedSection={expandedSection}
                      toggleSection={toggleSection}
                      loadingSummaries={loadingSummaries}
                      summaryOptions={summaryOptions}
                      selectedSummaryIndex={selectedSummaryIndex}
                      editingSummary={editingSummary}
                      editedSummaryText={editedSummaryText}
                      onSetEditingSummary={setEditingSummary}
                      onSetEditedSummaryText={setEditedSummaryText}
                      onSaveSummaryEdit={setSummaryOptions}
                      onSelectSummary={selectSummary}
                    />

                    {masterResume && (
                      <WorkExperienceSection
                        expandedSection={expandedSection}
                        toggleSection={toggleSection}
                        masterResume={masterResume}
                        selectedRoles={selectedRoles}
                        totalSelectedBullets={totalSelectedBullets}
                        maxTotalBullets={MAX_TOTAL_BULLETS}
                        initialSuggestionsShown={INITIAL_SUGGESTIONS_SHOWN}
                        expandedBulletOptions={expandedBulletOptions}
                        editingBulletKey={editingBulletKey}
                        editingBulletText={editingBulletText}
                        editedBullets={editedBullets}
                        draggedBullet={draggedBullet}
                        dragOverIndex={dragOverIndex}
                        getBulletText={getBulletText}
                        onToggleBullet={toggleBullet}
                        onStartEditingBullet={startEditingBullet}
                        onSaveEditedBullet={saveEditedBullet}
                        onCancelEditingBullet={cancelEditingBullet}
                        onSetEditingBulletText={setEditingBulletText}
                        onSetExpandedBulletOptions={setExpandedBulletOptions}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                      />
                    )}

                    <SkillsSection
                      expandedSection={expandedSection}
                      toggleSection={toggleSection}
                      loadingSkills={loadingSkills}
                      selectedSkills={selectedSkills}
                      skillsFromResume={skillsFromResume}
                      skillsFromJobDescription={skillsFromJobDescription}
                      recommendedSkills={recommendedSkills}
                      onToggleSkill={toggleSkill}
                    />

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

                    {/* ATS Compatibility Score */}
                    <ATSScoreCard
                      score={atsScore}
                      loading={loadingAts}
                      onCalculate={calculateAtsScore}
                      disabled={selectedRoles.length === 0 || !selectedJob}
                    />

                    <ResumeQualityPanel
                      reviewScore={reviewScore}
                      loadingReview={loadingReview}
                      showReviewPanel={showReviewPanel}
                      selectedRolesCount={selectedRoles.length}
                      onTogglePanel={() => showReviewPanel ? setShowReviewPanel(false) : reviewResumeQuality()}
                      onReviewResumeQuality={reviewResumeQuality}
                    />

                    {/* Download Buttons */}
                    <div className="bg-white rounded-xl shadow p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Download</h3>
                      <button
                        onClick={downloadResumePDF}
                        disabled={selectedSummaryIndex === null || selectedRoles.length === 0}
                        className="w-full bg-brand-gold text-gray-900 py-2 rounded-lg text-sm font-medium hover:bg-brand-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
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
                  <JobAnalysisPanel
                    jobId={selectedJob.id}
                    companyName={selectedJob.company_name}
                    jobTitle={selectedJob.job_title}
                    jobDescription={selectedJob.job_description}
                    jobDetailsParsed={
                      selectedJob.job_details_parsed
                        ? JSON.parse(selectedJob.job_details_parsed)
                        : null
                    }
                  />
                )}
              </div>

              {/* Right side - Live Preview */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8" style={{ height: "fit-content" }}>
                <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Live Preview</span>
                  <span className="text-xs text-gray-500">Professional template</span>
                </div>

                <div className="overflow-auto p-4 bg-gray-100" style={{ maxHeight: "calc(100vh - 200px)" }}>
                  {activeTab === "resume" && (
                    <ResumePreviewPane
                      iframeRef={iframeRef}
                      previewHtml={previewHtml}
                      loadingPreview={loadingPreview}
                    />
                  )}

                  {activeTab === "cover" && masterResume && (
                    <CoverLetterPreview
                      contactInfo={masterResume.contact_info}
                      coverLetter={coverLetter}
                      accentColor={accentColor}
                    />
                  )}
                </div>
              </div>

              {/* Right side - Job Details Sidebar */}
              {showJobDetails && selectedJob?.job_details_parsed && (
                <JobDetailsSidebar
                  jobDetailsParsed={selectedJob.job_details_parsed}
                  jobDescription={selectedJob.job_description}
                  showFullDescription={showFullDescription}
                  onSetShowFullDescription={setShowFullDescription}
                  onClose={() => setShowJobDetails(false)}
                />
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
        <div className="min-h-screen flex items-center justify-center bg-brand-gray">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
