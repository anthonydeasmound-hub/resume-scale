"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import TabsNav from "@/components/TabsNav";
import { MasterResumeSkeleton } from "@/components/Skeleton";
import ContactInfoSection from "@/components/master-resume/ContactInfoSection";
import ProfessionalSummarySection from "@/components/master-resume/ProfessionalSummarySection";
import TemplateStyleSelector from "@/components/master-resume/TemplateStyleSelector";
import WorkExperienceSection from "@/components/master-resume/WorkExperienceSection";
import EducationSection from "@/components/master-resume/EducationSection";
import SkillsSection from "@/components/master-resume/SkillsSection";
import CertificationsSection from "@/components/master-resume/CertificationsSection";
import LanguagesSection from "@/components/master-resume/LanguagesSection";
import HonorsSection from "@/components/master-resume/HonorsSection";
import ProfilePhotoSection from "@/components/master-resume/ProfilePhotoSection";
import LivePreviewPanel from "@/components/master-resume/LivePreviewPanel";
import FullPreviewModal from "@/components/master-resume/FullPreviewModal";
import type { ResumeData, ContactInfo, WorkExperience, Education, Certification, Honor } from "@/components/master-resume/types";

const TEMPLATES = [
  { id: "executive", name: "Executive", description: "Traditional corporate style" },
  { id: "horizon", name: "Horizon", description: "Clean, contemporary design" },
  { id: "canvas", name: "Canvas", description: "Bold and artistic" },
  { id: "terminal", name: "Terminal", description: "Developer-focused minimal" },
  { id: "summit", name: "Summit", description: "C-suite elegance" },
  { id: "cornerstone", name: "Cornerstone", description: "Balanced two-column" },
];

const COLORS = [
  { id: "blue", hex: "#2563eb", name: "Blue" },
  { id: "emerald", hex: "#059669", name: "Emerald" },
  { id: "violet", hex: "#7c3aed", name: "Violet" },
  { id: "rose", hex: "#e11d48", name: "Rose" },
  { id: "slate", hex: "#475569", name: "Slate" },
];

const emptyResume: ResumeData = {
  contact_info: { name: "", email: "", phone: "", location: "", linkedin: "" },
  work_experience: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  honors: [],
  profile_photo_path: null,
  summary: "",
  resume_style: "executive",
  accent_color: "#2563eb",
};

export default function MasterResumePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>(emptyResume);
  const [originalData, setOriginalData] = useState<ResumeData>(emptyResume);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Template and color state
  const [selectedTemplate, setSelectedTemplate] = useState("executive");
  const [selectedColor, setSelectedColor] = useState("#2563eb");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  // Preview state
  const [previewHtml, setPreviewHtml] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.52);
  const previewDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.title = "ResumeGenie - Master Resume";
  }, []);

  useEffect(() => {
    if (session) {
      fetchResumeData();
    }
  }, [session]);

  useEffect(() => {
    setHasChanges(JSON.stringify(resumeData) !== JSON.stringify(originalData));
  }, [resumeData, originalData]);

  // Fetch preview when resume data changes (debounced)
  const fetchPreviewHtml = useCallback(async () => {
    if (!resumeData.contact_info.name && resumeData.work_experience.length === 0) {
      return; // Don't fetch if no data
    }

    setLoadingPreview(true);
    try {
      // Transform data to match ResumeData type expected by the template
      const transformedData = {
        contactInfo: {
          name: resumeData.contact_info.name || "",
          email: resumeData.contact_info.email || "",
          phone: resumeData.contact_info.phone || "",
          location: resumeData.contact_info.location || "",
          linkedin: resumeData.contact_info.linkedin || "",
        },
        jobTitle: resumeData.work_experience[0]?.title || "",
        summary: resumeData.summary || "",
        experience: resumeData.work_experience.map(exp => ({
          title: exp.title,
          company: exp.company,
          dates: `${exp.start_date} - ${exp.end_date}`,
          description: exp.description.filter(d => d.trim() !== ""),
        })),
        education: resumeData.education.map(edu => ({
          school: edu.institution,
          degree: edu.degree,
          dates: edu.graduation_date,
          specialty: edu.field,
        })),
        skills: resumeData.skills,
        certifications: resumeData.certifications || [],
        languages: resumeData.languages || [],
        honors: resumeData.honors || [],
      };

      const response = await fetch("/api/resume/preview-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: transformedData,
          templateId: selectedTemplate,
          accentColor: selectedColor,
          templateOptions: { showLanguages },
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
  }, [resumeData, selectedTemplate, selectedColor, showLanguages]);

  useEffect(() => {
    // Debounce preview fetching
    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
    }
    previewDebounceRef.current = setTimeout(() => {
      fetchPreviewHtml();
    }, 300);

    return () => {
      if (previewDebounceRef.current) {
        clearTimeout(previewDebounceRef.current);
      }
    };
  }, [fetchPreviewHtml]);

  const fetchResumeData = async () => {
    try {
      const response = await fetch("/api/resume/master");
      if (response.ok) {
        const data = await response.json();
        const formatted: ResumeData = {
          contact_info: data.contact_info || emptyResume.contact_info,
          work_experience: data.work_experience || [],
          education: data.education || [],
          skills: data.skills || [],
          certifications: data.certifications || [],
          languages: data.languages || [],
          honors: data.honors || [],
          profile_photo_path: data.profile_photo_path || null,
          summary: data.summary || "",
          resume_style: data.resume_style || "executive",
          accent_color: data.accent_color || "#2563eb",
        };
        setResumeData(formatted);
        setOriginalData(formatted);
        setSelectedTemplate(formatted.resume_style);
        setSelectedColor(formatted.accent_color);
      }
    } catch (err) {
      console.error("Failed to fetch resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      if (response.ok) {
        setOriginalData(resumeData);
        setSaveMessage("Changes saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Failed to save changes. Please try again.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveMessage("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setResumeData(prev => ({ ...prev, resume_style: templateId }));
  };

  const handleColorChange = (hex: string) => {
    setSelectedColor(hex);
    setResumeData(prev => ({ ...prev, accent_color: hex }));
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const transformedData = {
        contactInfo: {
          name: resumeData.contact_info.name || "",
          email: resumeData.contact_info.email || "",
          phone: resumeData.contact_info.phone || "",
          location: resumeData.contact_info.location || "",
          linkedin: resumeData.contact_info.linkedin || "",
        },
        jobTitle: resumeData.work_experience[0]?.title || "",
        summary: resumeData.summary || "",
        experience: resumeData.work_experience.map(exp => ({
          title: exp.title,
          company: exp.company,
          dates: `${exp.start_date} - ${exp.end_date}`,
          description: exp.description.filter(d => d.trim() !== ""),
        })),
        education: resumeData.education.map(edu => ({
          school: edu.institution,
          degree: edu.degree,
          dates: edu.graduation_date,
          specialty: edu.field,
        })),
        skills: resumeData.skills,
        certifications: resumeData.certifications || [],
        languages: resumeData.languages || [],
        honors: resumeData.honors || [],
      };

      const response = await fetch("/api/generate-resume-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: transformedData,
          templateId: selectedTemplate,
          accentColor: selectedColor,
          templateOptions: { showLanguages },
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
      setSaveMessage("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const updateContactInfo = (field: keyof ContactInfo, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      contact_info: { ...prev.contact_info, [field]: value },
    }));
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string | string[]) => {
    setResumeData((prev) => ({
      ...prev,
      work_experience: prev.work_experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const addWorkExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      work_experience: [
        ...prev.work_experience,
        { company: "", title: "", start_date: "", end_date: "", description: [""] },
      ],
    }));
    setExpandedJobs((prev) => new Set([...prev, resumeData.work_experience.length]));
  };

  const removeWorkExperience = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index),
    }));
  };

  const addBulletPoint = (jobIndex: number) => {
    setResumeData((prev) => ({
      ...prev,
      work_experience: prev.work_experience.map((exp, i) =>
        i === jobIndex ? { ...exp, description: [...exp.description, ""] } : exp
      ),
    }));
  };

  const updateBulletPoint = (jobIndex: number, bulletIndex: number, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      work_experience: prev.work_experience.map((exp, i) =>
        i === jobIndex
          ? {
              ...exp,
              description: exp.description.map((d, j) => (j === bulletIndex ? value : d)),
            }
          : exp
      ),
    }));
  };

  const removeBulletPoint = (jobIndex: number, bulletIndex: number) => {
    setResumeData((prev) => ({
      ...prev,
      work_experience: prev.work_experience.map((exp, i) =>
        i === jobIndex
          ? { ...exp, description: exp.description.filter((_, j) => j !== bulletIndex) }
          : exp
      ),
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { institution: "", degree: "", field: "", graduation_date: "" },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !resumeData.skills.includes(newSkill.trim())) {
      setResumeData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addCertification = () => {
    setResumeData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", issuer: "", date: "" }],
    }));
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      ),
    }));
  };

  const removeCertification = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !resumeData.languages.includes(newLanguage.trim())) {
      setResumeData((prev) => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()],
      }));
      setNewLanguage("");
    }
  };

  const removeLanguage = (language: string) => {
    setResumeData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l !== language),
    }));
  };

  const addHonor = () => {
    setResumeData((prev) => ({
      ...prev,
      honors: [...prev.honors, { title: "", issuer: "", date: "" }],
    }));
  };

  const updateHonor = (index: number, field: keyof Honor, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      honors: prev.honors.map((honor, i) =>
        i === index ? { ...honor, [field]: value } : honor
      ),
    }));
  };

  const removeHonor = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      honors: prev.honors.filter((_, i) => i !== index),
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch("/api/resume/photo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResumeData((prev) => ({ ...prev, profile_photo_path: data.path }));
        setOriginalData((prev) => ({ ...prev, profile_photo_path: data.path }));
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      setSaveMessage("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    try {
      const response = await fetch("/api/resume/photo", { method: "DELETE" });
      if (response.ok) {
        setResumeData((prev) => ({ ...prev, profile_photo_path: null }));
        setOriginalData((prev) => ({ ...prev, profile_photo_path: null }));
      } else {
        setSaveMessage("Failed to delete photo. Please try again.");
      }
    } catch (err) {
      console.error("Photo delete error:", err);
      setSaveMessage("Failed to delete photo. Please try again.");
    }
  };

  const toggleJobExpanded = (index: number) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-brand-gray">
        <TabsNav />
        <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
          <MasterResumeSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <TabsNav />

      <div className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Master Resume</h1>
            <p className="text-gray-600 text-sm">
              Edit your profile information. This data is used to generate tailored resumes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {saveMessage}
              </span>
            )}
            <button
              onClick={() => setShowFullPreview(true)}
              className="px-4 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Full Preview
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {downloadingPdf ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {downloadingPdf ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hasChanges
                  ? "bg-brand-gold text-gray-900 hover:bg-brand-gold-dark"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {saving ? "Saving..." : hasChanges ? "Save Changes" : "No Changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Form */}
          <div className="space-y-6">
            <ContactInfoSection
              contactInfo={resumeData.contact_info}
              onUpdate={updateContactInfo}
            />
            <ProfessionalSummarySection
              summary={resumeData.summary}
              onUpdate={(value) => setResumeData(prev => ({ ...prev, summary: value }))}
            />
            <TemplateStyleSelector
              templates={TEMPLATES}
              colors={COLORS}
              selectedTemplate={selectedTemplate}
              selectedColor={selectedColor}
              showLanguages={showLanguages}
              onTemplateChange={handleTemplateChange}
              onColorChange={handleColorChange}
              onShowLanguagesChange={setShowLanguages}
            />
            <WorkExperienceSection
              workExperience={resumeData.work_experience}
              expandedJobs={expandedJobs}
              onAdd={addWorkExperience}
              onRemove={removeWorkExperience}
              onUpdate={updateWorkExperience}
              onToggleExpanded={toggleJobExpanded}
              onAddBullet={addBulletPoint}
              onUpdateBullet={updateBulletPoint}
              onRemoveBullet={removeBulletPoint}
            />
            <EducationSection
              education={resumeData.education}
              onAdd={addEducation}
              onRemove={removeEducation}
              onUpdate={updateEducation}
            />
            <SkillsSection
              skills={resumeData.skills}
              newSkill={newSkill}
              onNewSkillChange={setNewSkill}
              onAdd={addSkill}
              onRemove={removeSkill}
            />
            <CertificationsSection
              certifications={resumeData.certifications}
              onAdd={addCertification}
              onRemove={removeCertification}
              onUpdate={updateCertification}
            />
            <LanguagesSection
              languages={resumeData.languages}
              newLanguage={newLanguage}
              onNewLanguageChange={setNewLanguage}
              onAdd={addLanguage}
              onRemove={removeLanguage}
            />
            <HonorsSection
              honors={resumeData.honors}
              onAdd={addHonor}
              onRemove={removeHonor}
              onUpdate={updateHonor}
            />
            <ProfilePhotoSection
              profilePhotoPath={resumeData.profile_photo_path}
              uploadingPhoto={uploadingPhoto}
              onUpload={handlePhotoUpload}
              onDelete={handlePhotoDelete}
            />
          </div>

          {/* Right side - Live Preview */}
          <LivePreviewPanel
            previewHtml={previewHtml}
            previewScale={previewScale}
            loadingPreview={loadingPreview}
            onScaleChange={setPreviewScale}
          />
        </div>
      </div>

      {/* Full Preview Modal */}
      {showFullPreview && (
        <FullPreviewModal
          previewHtml={previewHtml}
          downloadingPdf={downloadingPdf}
          onDownloadPdf={handleDownloadPdf}
          onClose={() => setShowFullPreview(false)}
        />
      )}
    </div>
  );
}
