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
  const [activeTab, setActiveTab] = useState<"resume" | "cover">("resume");
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

  // Work experience selections
  const [selectedRoles, setSelectedRoles] = useState<SelectedRole[]>([]);

  // Skills options
  const [skillsFromResume, setSkillsFromResume] = useState<string[]>([]);
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Cover letter
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);

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
      // Only pre-select 3 bullets initially (will be enforced by maxBulletsPerRole)
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
        setSkillsFromResume(data.fromResume);
        setRecommendedSkills(data.recommended);
        // Pre-select all skills from resume
        setSelectedSkills(data.fromResume);
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

  // Calculate max bullets per role to fit on single page
  // Footer (Skills + Education) is fixed at bottom, main content must fit above it
  const calculateMaxBullets = (): number => {
    const summaryLength = selectedSummaryIndex !== null && summaryOptions[selectedSummaryIndex]
      ? summaryOptions[selectedSummaryIndex].length
      : 0;
    const rolesCount = selectedRoles.length;

    // Available lines in main content area (above fixed footer):
    // Main content max-height is 6.4in ≈ 32 lines at 10.3pt with 1.5 line-height
    // Header (name + contact): ~3 lines
    // Summary section title + text: 4-6 lines
    // Work Experience title: 1 line
    // Role headers: 2 lines each
    // Remaining for bullets

    let availableLines = 32;

    // Header takes ~3 lines
    availableLines -= 3;

    // Summary section (title + text): 4-6 lines based on length
    if (summaryLength > 350) availableLines -= 6;
    else if (summaryLength > 200) availableLines -= 5;
    else availableLines -= 4;

    // Work Experience section title
    availableLines -= 1;

    // Each role has a 2-line header (title, company, dates)
    availableLines -= rolesCount * 2;

    // Remaining lines for bullets, distributed across roles
    // Each bullet averages ~1.5 lines (many wrap to 2 lines)
    const totalBullets = Math.floor(availableLines / 1.5);
    const bulletsPerRole = Math.floor(totalBullets / Math.max(rolesCount, 1));

    // Clamp between 3 and 4 bullets per role for safety
    return Math.max(3, Math.min(4, bulletsPerRole));
  };

  const maxBulletsPerRole = calculateMaxBullets();

  const toggleBullet = (roleIndex: number, bulletIndex: number) => {
    setSelectedRoles((prev) =>
      prev.map((r) => {
        if (r.roleIndex !== roleIndex) return r;

        const isSelected = r.selectedBullets.includes(bulletIndex);
        let newSelected: number[];

        if (isSelected) {
          newSelected = r.selectedBullets.filter((i) => i !== bulletIndex);
        } else if (r.selectedBullets.length < maxBulletsPerRole) {
          newSelected = [...r.selectedBullets, bulletIndex];
        } else {
          return r; // Max bullets reached
        }

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
        description: r.selectedBullets.map((i) => r.bulletOptions[i]),
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

            <div className="grid lg:grid-cols-2 gap-6">
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
                              {/* Selected Summary at top */}
                              {selectedSummaryIndex !== null && summaryOptions[selectedSummaryIndex] && (
                                <div className="mb-4">
                                  <p className="text-xs font-medium text-gray-600 mb-2">Selected:</p>
                                  <div className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50">
                                    <p className="text-sm text-gray-700">{summaryOptions[selectedSummaryIndex]}</p>
                                  </div>
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
                          <p className="text-sm text-gray-600 py-3">Select {maxBulletsPerRole} bullets for each role:</p>

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
                                              Selected ({selectedRole.selectedBullets.length}/{maxBulletsPerRole}) - click to remove:
                                            </p>
                                            <div className="space-y-2">
                                              {selectedRole.selectedBullets.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">No bullets selected yet</p>
                                              ) : (
                                                selectedRole.selectedBullets.map((bulletIdx) => {
                                                  const bullet = selectedRole.bulletOptions[bulletIdx];
                                                  const isFromMaster = bulletIdx < selectedRole.masterBullets.length;
                                                  return (
                                                    <div
                                                      key={bulletIdx}
                                                      onClick={() => toggleBullet(selectedRole.roleIndex, bulletIdx)}
                                                      className={`p-2 rounded border-2 cursor-pointer text-sm ${
                                                        isFromMaster ? "border-blue-400 bg-blue-50" : "border-purple-400 bg-purple-50"
                                                      }`}
                                                    >
                                                      <div className="flex items-start gap-2">
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                          isFromMaster ? "bg-blue-500" : "bg-purple-500"
                                                        }`}>
                                                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                          </svg>
                                                        </div>
                                                        <span className="text-gray-700 flex-1">{bullet}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${isFromMaster ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                                                          {isFromMaster ? "Resume" : "AI"}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  );
                                                })
                                              )}
                                            </div>
                                          </div>

                                          {/* Unselected bullets below */}
                                          {unselectedBullets.length > 0 && (
                                            <div>
                                              <p className="text-xs font-medium text-purple-600 mb-2">
                                                Available options - click to add:
                                              </p>
                                              <div className="space-y-2">
                                                {unselectedBullets.map(({ bullet, idx }) => {
                                                  const isFromMaster = idx < selectedRole.masterBullets.length;
                                                  const isMaxReached = selectedRole.selectedBullets.length >= maxBulletsPerRole;
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
                                  <p className="text-xs font-medium text-purple-600 mb-2">AI Recommendations - click to add:</p>
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
