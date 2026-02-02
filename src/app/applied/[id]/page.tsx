"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { ResumeData } from "@/types/resume";
import TabsNav from "@/components/TabsNav";
import { JobDetailSkeleton } from "@/components/Skeleton";
import { showToast } from "@/components/Toast";
import EditJobModal, { EditJobData } from "@/components/applied/EditJobModal";
import ContactsTab from "@/components/applied/ContactsTab";
import EmailTemplatesTab from "@/components/applied/EmailTemplatesTab";
import InterviewPrepTab from "@/components/applied/InterviewPrepTab";

// Import Review components for Resume Builder tab
import JobAnalysisPanel from "@/components/review/JobAnalysisPanel";
import ATSScoreCard from "@/components/review/ATSScoreCard";
import { ATSScore } from "@/lib/ats-scorer";
import ProfileSelector from "@/components/review/ProfileSelector";
import SummarySection from "@/components/review/SummarySection";
import WorkExperienceSection from "@/components/review/WorkExperienceSection";
import SkillsSection from "@/components/review/SkillsSection";
import CoverLetterPreview from "@/components/review/CoverLetterPreview";
import ResumePreviewPane from "@/components/review/ResumePreviewPane";
import BulletOptimizationModal, { BulletSuggestion } from "@/components/review/BulletOptimizationModal";
import { MasterResume, TailoredResume, SelectedRole, Job as ReviewJob } from "@/components/review/types";
import { Profile } from "@/components/master-resume/types";

interface InterviewStage {
  id: number;
  job_id: number;
  stage_number: number;
  stage_type: string;
  stage_name: string | null;
  status: string;
  scheduled_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface JobDetails {
  salary_range: string | null;
  location: string | null;
  work_type: string | null;
}

interface Job {
  id: number;
  company_name: string;
  job_title: string;
  job_description: string | null;
  job_url: string | null;
  status: string;
  date_applied: string | null;
  pinned: number;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_title: string | null;
  job_details_parsed: string | null;
  interview_guide: string | null;
  tailored_resume: string | null;
  cover_letter: string | null;
  resume_color: string | null;
  source_profile_id: number | null;
  excitement_level: number | null;
  created_at: string;
}

type TabType = "resume" | "cover" | "job-details" | "contacts" | "emails" | "interview-prep";

const COLOR_OPTIONS = [
  { id: "blue", name: "Navy Blue", hex: "#3D5A80" },
  { id: "teal", name: "Teal", hex: "#2A9D8F" },
  { id: "burgundy", name: "Burgundy", hex: "#7B2D26" },
  { id: "forest", name: "Forest", hex: "#2D5A27" },
  { id: "slate", name: "Slate", hex: "#4A5568" },
  { id: "purple", name: "Purple", hex: "#5B4B8A" },
];

export default function JobDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [stages, setStages] = useState<InterviewStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("resume");

  // Edit/Delete modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Resume Builder state (from review page)
  const [accentColor, setAccentColor] = useState("#3D5A80");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<"summary" | "experience" | "skills" | null>(null);

  // Summary options
  const [summaryOptions, setSummaryOptions] = useState<string[]>([]);
  const [selectedSummaryIndex, setSelectedSummaryIndex] = useState<number | null>(null);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editedSummaryText, setEditedSummaryText] = useState("");

  // Work experience
  const [selectedRoles, setSelectedRoles] = useState<SelectedRole[]>([]);
  const [editedBullets, setEditedBullets] = useState<Record<string, string>>({});
  const [editingBulletKey, setEditingBulletKey] = useState<string | null>(null);
  const [editingBulletText, setEditingBulletText] = useState("");
  const [draggedBullet, setDraggedBullet] = useState<{ roleIndex: number; selectedIndex: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Skills
  const [skillsFromResume, setSkillsFromResume] = useState<string[]>([]);
  const [skillsFromJobDescription, setSkillsFromJobDescription] = useState<string[]>([]);
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Cover letter
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);

  // Preview
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ATS Score
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [loadingAts, setLoadingAts] = useState(false);
  const [loadingAllContent, setLoadingAllContent] = useState(false);

  // Bullet optimization
  const [optimizingBullets, setOptimizingBullets] = useState(false);
  const [bulletSuggestions, setBulletSuggestions] = useState<BulletSuggestion[]>([]);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  const MAX_TOTAL_BULLETS = 12;
  const INITIAL_SUGGESTIONS_SHOWN = 4;
  const [expandedBulletOptions, setExpandedBulletOptions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    document.title = "ResumeGenie - Job Details";
  }, []);

  useEffect(() => {
    if (session && jobId) {
      fetchJobData();
      fetchProfiles();
    }
  }, [session, jobId]);

  useEffect(() => {
    if (selectedProfileId !== null) {
      fetchMasterResume(selectedProfileId);
    }
  }, [selectedProfileId]);

  const fetchJobData = async () => {
    try {
      const [jobRes, stagesRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/jobs/${jobId}/stages`),
      ]);

      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJob(jobData);
        setAccentColor(jobData.resume_color && jobData.resume_color !== "#000000" ? jobData.resume_color : "#3D5A80");
        if (jobData.cover_letter) {
          setCoverLetter(jobData.cover_letter);
        }
        if (jobData.source_profile_id) {
          setSelectedProfileId(jobData.source_profile_id);
        }
      }
      if (stagesRes.ok) {
        const stagesData = await stagesRes.json();
        setStages(stagesData);
      }
    } catch (err) {
      console.error("Failed to fetch job data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/resume/profiles");
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles);
        if (selectedProfileId === null) {
          const primaryProfile = data.profiles.find((p: Profile) => p.is_primary);
          if (primaryProfile) {
            setSelectedProfileId(primaryProfile.id);
          } else if (data.profiles.length > 0) {
            setSelectedProfileId(data.profiles[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch profiles:", err);
    }
  };

  const fetchMasterResume = async (profileId?: number) => {
    try {
      const url = profileId ? `/api/resume/master?profileId=${profileId}` : "/api/resume/master";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMasterResume(data);
      }
    } catch (err) {
      console.error("Failed to fetch master resume:", err);
    }
  };

  // Load saved tailored resume
  useEffect(() => {
    if (job && masterResume && job.tailored_resume) {
      const tailored = JSON.parse(job.tailored_resume) as TailoredResume;
      if (tailored.summary) {
        setSummaryOptions([tailored.summary]);
        setSelectedSummaryIndex(0);
      }
      if (tailored.skills) {
        setSelectedSkills(tailored.skills);
      }
      if (tailored.work_experience && masterResume) {
        const reconstructedRoles: SelectedRole[] = tailored.work_experience.map((exp) => {
          const masterIndex = masterResume.work_experience.findIndex(
            (m) => m.company === exp.company && m.title === exp.title
          );
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
  }, [job, masterResume]);

  // Auto-load AI content
  const loadAllContent = async () => {
    if (!job || !masterResume || loadingAllContent) return;

    setLoadingAllContent(true);
    setLoadingSummaries(true);
    setLoadingSkills(true);

    const topRoles = masterResume.work_experience.slice(0, 3);
    const initialRoles: SelectedRole[] = topRoles.map((role, idx) => {
      const masterBullets = role.description.slice(0, 8);
      const initialSelected = Math.min(3, masterBullets.length);
      return {
        roleIndex: idx,
        masterBullets,
        aiBullets: [],
        bulletOptions: masterBullets,
        selectedBullets: Array.from({ length: initialSelected }, (_, i) => i),
        loadingBullets: true,
      };
    });
    setSelectedRoles(initialRoles);

    try {
      const response = await fetch("/api/ai/generate-all-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, profileId: selectedProfileId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.summaries?.length > 0) {
          setSummaryOptions(data.summaries);
          setSelectedSummaryIndex(0);
        }
        if (data.skills) {
          setSkillsFromResume(data.skills.fromResume || []);
          setSkillsFromJobDescription(data.skills.fromJobDescription || []);
          setRecommendedSkills(data.skills.recommended || []);
          setSelectedSkills(data.skills.fromResume || []);
        }
        if (data.rolesBullets?.length > 0) {
          setSelectedRoles((prev) =>
            prev.map((r) => {
              const roleBullets = data.rolesBullets.find(
                (rb: { roleIndex: number; bullets: string[] }) => rb.roleIndex === r.roleIndex
              );
              if (roleBullets?.bullets) {
                const combined = [...r.masterBullets, ...roleBullets.bullets];
                return {
                  ...r,
                  aiBullets: roleBullets.bullets,
                  bulletOptions: combined,
                  loadingBullets: false,
                  selectedBullets: r.masterBullets.map((_, i) => i),
                };
              }
              return { ...r, loadingBullets: false };
            })
          );
        } else {
          setSelectedRoles((prev) => prev.map((r) => ({ ...r, loadingBullets: false })));
        }
      }
    } catch (error) {
      console.error("Failed to load all content:", error);
      setSelectedRoles((prev) => prev.map((r) => ({ ...r, loadingBullets: false })));
    } finally {
      setLoadingAllContent(false);
      setLoadingSummaries(false);
      setLoadingSkills(false);
    }
  };

  useEffect(() => {
    if (job && masterResume && !job.tailored_resume) {
      if (summaryOptions.length === 0 && selectedRoles.length === 0 && !loadingAllContent) {
        loadAllContent();
      }
    }
  }, [job, masterResume]);

  const toggleSection = async (section: "summary" | "experience" | "skills") => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleProfileChange = async (profileId: number) => {
    if (profileId === selectedProfileId) return;

    const hasContent = summaryOptions.length > 0 || selectedRoles.length > 0 || selectedSkills.length > 0;
    if (hasContent) {
      const confirmed = window.confirm(
        "Changing the profile will reset all AI-generated content. Do you want to continue?"
      );
      if (!confirmed) return;
    }

    setSummaryOptions([]);
    setSelectedSummaryIndex(null);
    setSelectedRoles([]);
    setEditedBullets({});
    setSkillsFromResume([]);
    setSkillsFromJobDescription([]);
    setRecommendedSkills([]);
    setSelectedSkills([]);
    setAtsScore(null);

    setSelectedProfileId(profileId);
    setHasChanges(true);
  };

  const totalSelectedBullets = selectedRoles.reduce((sum, r) => sum + r.selectedBullets.length, 0);

  const toggleBullet = (roleIndex: number, bulletIndex: number) => {
    setSelectedRoles((prev) => {
      const currentTotal = prev.reduce((sum, r) => sum + r.selectedBullets.length, 0);
      return prev.map((r) => {
        if (r.roleIndex !== roleIndex) return r;
        const isSelected = r.selectedBullets.includes(bulletIndex);
        let newSelected: number[];
        if (isSelected) {
          newSelected = r.selectedBullets.filter((i) => i !== bulletIndex);
        } else if (currentTotal < MAX_TOTAL_BULLETS) {
          newSelected = [...r.selectedBullets, bulletIndex];
        } else {
          return r;
        }
        return { ...r, selectedBullets: newSelected };
      });
    });
    setHasChanges(true);
  };

  const getBulletText = (roleIndex: number, bulletIndex: number, bulletOptions: string[]): string => {
    const key = `${roleIndex}-${bulletIndex}`;
    return editedBullets[key] ?? bulletOptions[bulletIndex];
  };

  const startEditingBullet = (roleIndex: number, bulletIndex: number, currentText: string) => {
    setEditingBulletKey(`${roleIndex}-${bulletIndex}`);
    setEditingBulletText(currentText);
  };

  const saveEditedBullet = () => {
    if (!editingBulletKey) return;
    setEditedBullets((prev) => ({ ...prev, [editingBulletKey]: editingBulletText }));
    setEditingBulletKey(null);
    setEditingBulletText("");
    setHasChanges(true);
  };

  const cancelEditingBullet = () => {
    setEditingBulletKey(null);
    setEditingBulletText("");
  };

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
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
    setHasChanges(true);
  };

  const selectSummary = (index: number) => {
    setSelectedSummaryIndex(index);
    setHasChanges(true);
  };

  const updateColor = async (newColor: string) => {
    if (!job) return;
    setAccentColor(newColor);
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_color: newColor }),
    });
  };

  const generateCoverLetter = async () => {
    if (!job) return;
    setGeneratingCoverLetter(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/generate`, { method: "POST" });
      const data = await response.json();
      if (response.ok && data.cover_letter) {
        setCoverLetter(data.cover_letter);
        setHasChanges(true);
        showToast("success", "Cover letter generated!");
      } else {
        showToast("error", data.error || "Failed to generate cover letter.");
      }
    } catch (err) {
      console.error("Failed to generate cover letter:", err);
      showToast("error", "Failed to generate cover letter.");
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const calculateAtsScore = async () => {
    if (!job || !masterResume || selectedRoles.length === 0) return;
    setLoadingAts(true);
    try {
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
        education: masterResume.education.map((e) => ({
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
          jobDescription: job.job_description,
          jobTitle: job.job_title,
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

  const optimizeAllBullets = async () => {
    if (!job || !masterResume || !atsScore) return;
    setOptimizingBullets(true);
    try {
      const bulletsToOptimize: { roleIndex: number; bulletIndex: number; roleName: string; bulletText: string }[] = [];
      selectedRoles.forEach((role) => {
        const masterRole = masterResume.work_experience[role.roleIndex];
        role.selectedBullets.forEach((bulletIdx) => {
          const bulletText = getBulletText(role.roleIndex, bulletIdx, role.bulletOptions);
          bulletsToOptimize.push({
            roleIndex: role.roleIndex,
            bulletIndex: bulletIdx,
            roleName: `${masterRole.title} at ${masterRole.company}`,
            bulletText,
          });
        });
      });
      const promises = bulletsToOptimize.map(async (bullet) => {
        try {
          const response = await fetch("/api/ai/improve-bullet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId: job.id,
              bullet: bullet.bulletText,
              missingKeywords: atsScore.breakdown.keywords.missing || [],
              missingSkills: atsScore.breakdown.hardSkills.missing || [],
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.improved && data.improved !== bullet.bulletText) {
              return {
                roleIndex: bullet.roleIndex,
                bulletIndex: bullet.bulletIndex,
                roleName: bullet.roleName,
                original: bullet.bulletText,
                improved: data.improved,
                selected: true,
              } as BulletSuggestion;
            }
          }
          return null;
        } catch {
          return null;
        }
      });
      const results = await Promise.all(promises);
      const validSuggestions = results.filter((s): s is BulletSuggestion => s !== null);
      if (validSuggestions.length > 0) {
        setBulletSuggestions(validSuggestions);
        setShowOptimizationModal(true);
      } else {
        showToast("info", "All bullets are already optimized for ATS!");
      }
    } catch (error) {
      console.error("Failed to optimize bullets:", error);
      showToast("error", "Failed to optimize bullets");
    } finally {
      setOptimizingBullets(false);
    }
  };

  const applyBulletImprovements = (selectedSuggestions: BulletSuggestion[]) => {
    const newEditedBullets = { ...editedBullets };
    selectedSuggestions.forEach((suggestion) => {
      const key = `${suggestion.roleIndex}-${suggestion.bulletIndex}`;
      newEditedBullets[key] = suggestion.improved;
    });
    setEditedBullets(newEditedBullets);
    setHasChanges(true);
    setShowOptimizationModal(false);
    setBulletSuggestions([]);
    showToast("success", `Applied ${selectedSuggestions.length} bullet improvement${selectedSuggestions.length !== 1 ? "s" : ""}`);
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

  // Fetch preview HTML
  useEffect(() => {
    const fetchPreviewHtml = async () => {
      const tailored = buildTailoredResume();
      if (!tailored || !job) {
        setPreviewHtml("");
        return;
      }
      setLoadingPreview(true);
      try {
        const resumeData = convertToResumeData(tailored, job.job_title);
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
    const timeoutId = setTimeout(fetchPreviewHtml, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedRoles, selectedSummaryIndex, summaryOptions, selectedSkills, accentColor, masterResume, job, editedBullets, convertToResumeData]);

  const saveChanges = async () => {
    if (!job) return;
    setSaving(true);
    try {
      const tailoredResume = buildTailoredResume();
      await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailored_resume: JSON.stringify(tailoredResume),
          cover_letter: coverLetter,
          source_profile_id: selectedProfileId,
        }),
      });
      setHasChanges(false);
      showToast("success", "Changes saved");
    } catch (err) {
      console.error("Failed to save:", err);
      showToast("error", "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleEditJob = async (data: EditJobData) => {
    if (!job) return;
    try {
      // Update job details - this should NOT trigger re-analysis
      const jobDetailsParsed = job.job_details_parsed ? JSON.parse(job.job_details_parsed) : {};
      jobDetailsParsed.location = data.location;

      await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: data.job_title,
          company_name: data.company_name,
          job_url: data.job_url,
          job_description: data.job_description,
          job_details_parsed: JSON.stringify(jobDetailsParsed),
        }),
      });

      setJob({
        ...job,
        job_title: data.job_title,
        company_name: data.company_name,
        job_url: data.job_url,
        job_description: data.job_description,
        job_details_parsed: JSON.stringify(jobDetailsParsed),
      });
      showToast("success", "Job updated");
    } catch (err) {
      console.error("Failed to update job:", err);
      showToast("error", "Failed to update job");
      throw err;
    }
  };

  const handleDeleteJob = async () => {
    if (!job) return;
    if (!confirm("Are you sure you want to delete this job? This cannot be undone.")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Job deleted");
        router.push("/applied");
      } else {
        showToast("error", "Failed to delete job");
      }
    } catch (err) {
      console.error("Failed to delete job:", err);
      showToast("error", "Failed to delete job");
    } finally {
      setDeleting(false);
    }
  };

  const downloadResumePDF = async () => {
    if (!job || !masterResume) return;
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
        jobTitle: tailoredResume.work_experience[0]?.title || job.job_title,
        summary: tailoredResume.summary,
        experience: tailoredResume.work_experience.map((exp) => ({
          title: exp.title,
          company: exp.company,
          dates: `${exp.start_date} - ${exp.end_date}`,
          description: exp.description,
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
      link.download = `Resume_${job.company_name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation error:", error);
      showToast("error", "Failed to generate PDF.");
    }
  };

  const downloadCoverLetterPDF = async () => {
    if (!job || !masterResume) return;
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
        companyName: job.company_name,
        jobTitle: job.job_title,
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
      link.download = `CoverLetter_${job.company_name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Cover letter PDF error:", error);
      showToast("error", "Failed to generate cover letter PDF.");
    }
  };

  const getJobDetails = (): JobDetails | null => {
    if (!job?.job_details_parsed) return null;
    try {
      return JSON.parse(job.job_details_parsed);
    } catch {
      return null;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-brand-gray">
        <TabsNav />
        <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
          <JobDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="text-lg text-gray-600">Job not found</div>
      </div>
    );
  }

  const jobDetails = getJobDetails();
  const currentStage = stages.find((s) => s.status === "scheduled" || s.status === "pending");

  return (
    <div className="min-h-screen bg-brand-gray">
      <TabsNav reviewCount={0} />

      <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <button
              onClick={() => router.push("/applied")}
              className="flex items-center gap-1 text-brand-blue hover:text-brand-blue-dark text-sm mb-3 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Applications
            </button>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{job.job_title}</h1>
            <div className="text-gray-600 mb-2">
              <span className="font-medium">{job.company_name}</span>
              {jobDetails?.location && (
                <>
                  <span className="mx-2">—</span>
                  <span>{jobDetails.location}</span>
                </>
              )}
            </div>
            {job.date_applied && (
              <p className="text-sm text-gray-500">Applied {formatDate(job.date_applied)}</p>
            )}
          </div>

          {/* Edit/Delete buttons */}
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-4 py-2 bg-brand-gold text-gray-900 rounded-lg font-medium hover:bg-brand-gold-dark disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            )}
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Edit job"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteJob}
              disabled={deleting}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete job"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: "resume", label: "Resume Builder" },
              { id: "cover", label: "Cover Letter" },
              { id: "job-details", label: "Job Details" },
              { id: "contacts", label: "Contacts" },
              { id: "emails", label: "Email Templates" },
              { id: "interview-prep", label: "Interview Prep" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-blue text-brand-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Tab-specific content */}
          <div className="space-y-4">
            {activeTab === "resume" && (
              <>
                {profiles.length > 1 && (
                  <ProfileSelector
                    profiles={profiles}
                    selectedProfileId={selectedProfileId}
                    onSelect={handleProfileChange}
                    disabled={false}
                  />
                )}

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

                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Accent Color</h3>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => updateColor(c.hex)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full transition-all ${
                          accentColor === c.hex ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                <ATSScoreCard
                  score={atsScore}
                  loading={loadingAts}
                  onCalculate={calculateAtsScore}
                  disabled={selectedRoles.length === 0 || !job}
                  onOptimizeBullets={optimizeAllBullets}
                  optimizingBullets={optimizingBullets}
                  hasBullets={selectedRoles.some((r) => r.selectedBullets.length > 0)}
                />

                <div className="bg-white rounded-xl shadow p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Download</h3>
                  <button
                    onClick={downloadResumePDF}
                    disabled={selectedSummaryIndex === null || selectedRoles.length === 0}
                    className="w-full bg-brand-gold text-gray-900 py-2 rounded-lg text-sm font-medium hover:bg-brand-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Download Resume PDF
                  </button>
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
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    rows={16}
                    placeholder="Write or generate your cover letter..."
                  />
                </div>
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

            {activeTab === "job-details" && (
              <JobAnalysisPanel
                jobId={job.id}
                companyName={job.company_name}
                jobTitle={job.job_title}
                jobDescription={job.job_description}
                jobDetailsParsed={job.job_details_parsed ? JSON.parse(job.job_details_parsed) : null}
                onJobDetailsUpdated={(jobDetails) => {
                  setJob({ ...job, job_details_parsed: JSON.stringify(jobDetails) });
                }}
              />
            )}

            {activeTab === "contacts" && (
              <ContactsTab
                jobId={job.id}
                companyName={job.company_name}
                recruiterName={job.recruiter_name}
                recruiterEmail={job.recruiter_email}
                recruiterTitle={job.recruiter_title}
              />
            )}

            {activeTab === "emails" && (
              <EmailTemplatesTab
                jobId={job.id}
                companyName={job.company_name}
                jobTitle={job.job_title}
                recruiterName={job.recruiter_name}
                recruiterEmail={job.recruiter_email}
                interviewStage={currentStage?.stage_type}
              />
            )}

            {activeTab === "interview-prep" && (
              <InterviewPrepTab
                jobId={job.id}
                companyName={job.company_name}
                jobTitle={job.job_title}
                jobDescription={job.job_description}
                existingGuide={job.interview_guide}
              />
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8" style={{ height: "fit-content" }}>
            <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Live Preview</span>
              <span className="text-xs text-gray-500">Professional template</span>
            </div>

            <div className="overflow-auto p-4 bg-gray-100" style={{ maxHeight: "calc(100vh - 200px)" }}>
              {(activeTab === "resume" || activeTab === "job-details" || activeTab === "contacts" || activeTab === "emails" || activeTab === "interview-prep") && (
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
        </div>
      </div>

      {/* Edit Job Modal */}
      <EditJobModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditJob}
        initialData={{
          job_title: job.job_title,
          company_name: job.company_name,
          job_url: job.job_url || "",
          location: jobDetails?.location || "",
          job_description: job.job_description || "",
        }}
      />

      {/* Bullet Optimization Modal */}
      {showOptimizationModal && bulletSuggestions.length > 0 && (
        <BulletOptimizationModal
          suggestions={bulletSuggestions}
          onApply={applyBulletImprovements}
          onClose={() => {
            setShowOptimizationModal(false);
            setBulletSuggestions([]);
          }}
        />
      )}
    </div>
  );
}
