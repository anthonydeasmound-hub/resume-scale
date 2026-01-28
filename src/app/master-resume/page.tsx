"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import TabsNav from "@/components/TabsNav";

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

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
}

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

interface ResumeData {
  contact_info: ContactInfo;
  work_experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  languages: string[];
  honors: Honor[];
  profile_photo_path: string | null;
  summary: string;
  resume_style: string;
  accent_color: string;
}

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>(emptyResume);
  const [originalData, setOriginalData] = useState<ResumeData>(emptyResume);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [includeLanguages, setIncludeLanguages] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Template and color state
  const [selectedTemplate, setSelectedTemplate] = useState("executive");
  const [selectedColor, setSelectedColor] = useState("#2563eb");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Preview state
  const [previewHtml, setPreviewHtml] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.52);
  const previewDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

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
        languages: includeLanguages ? resumeData.languages : undefined,
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
  }, [resumeData, selectedTemplate, selectedColor, includeLanguages]);

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
        languages: includeLanguages ? resumeData.languages : undefined,
      };

      const response = await fetch("/api/generate-resume-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: transformedData,
          templateId: selectedTemplate,
          accentColor: selectedColor,
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

  // Certification handlers
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

  // Language handlers
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

  // Honor handlers
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

  // Photo handlers
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
      }
    } catch (err) {
      console.error("Photo delete error:", err);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TabsNav />

      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Master Resume</h1>
            <p className="text-gray-600 text-sm">
              Edit your profile information. This data is used to generate tailored resumes.
            </p>
          </div>
          <div className="flex items-center gap-3">
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
                  ? "bg-blue-600 text-white hover:bg-blue-700"
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

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={resumeData.contact_info.name}
                onChange={(e) => updateContactInfo("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={resumeData.contact_info.email}
                onChange={(e) => updateContactInfo("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={resumeData.contact_info.phone}
                onChange={(e) => updateContactInfo("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
              <input
                type="text"
                value={resumeData.contact_info.location}
                onChange={(e) => updateContactInfo("location", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="San Francisco, CA"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={resumeData.contact_info.linkedin}
                onChange={(e) => updateContactInfo("linkedin", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Professional Summary</h2>
          <textarea
            value={resumeData.summary}
            onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder="Write a brief professional summary highlighting your key skills and experience..."
          />
          <p className="text-xs text-gray-500 mt-2">
            This summary will be displayed at the top of your resume. It should be 2-4 sentences that highlight your expertise and career goals.
          </p>
        </div>

        {/* Resume Template */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Resume Template</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TEMPLATES.map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => handleTemplateChange(tmpl.id)}
                className={`p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedTemplate === tmpl.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-full h-16 bg-gray-100 rounded mb-2 flex items-center justify-center">
                  <svg className="w-8 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">{tmpl.name}</p>
                <p className="text-xs text-gray-500">{tmpl.description}</p>
              </button>
            ))}
          </div>

          {/* Accent Color */}
          <h3 className="text-sm font-semibold text-gray-700 mt-5 mb-3">Accent Color</h3>
          <div className="flex gap-3">
            {COLORS.map(color => (
              <button
                key={color.id}
                onClick={() => handleColorChange(color.hex)}
                className={`w-9 h-9 rounded-full border-2 transition-all ${
                  selectedColor === color.hex
                    ? "border-gray-800 scale-110 ring-2 ring-offset-2 ring-gray-300"
                    : "border-gray-200 hover:scale-105"
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Work Experience */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Work Experience</h2>
            <button
              onClick={addWorkExperience}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Position
            </button>
          </div>

          {resumeData.work_experience.length === 0 ? (
            <p className="text-gray-500 text-sm">No work experience added yet.</p>
          ) : (
            <div className="space-y-4">
              {resumeData.work_experience.map((job, jobIndex) => (
                <div key={jobIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Job Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                    onClick={() => toggleJobExpanded(jobIndex)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {job.title || "Untitled Position"} {job.company && `at ${job.company}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {job.start_date || "Start"} - {job.end_date || "Present"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWorkExperience(jobIndex);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedJobs.has(jobIndex) ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Job Details (Expanded) */}
                  {expandedJobs.has(jobIndex) && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
                          <input
                            type="text"
                            value={job.title}
                            onChange={(e) => updateWorkExperience(jobIndex, "title", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
                          <input
                            type="text"
                            value={job.company}
                            onChange={(e) => updateWorkExperience(jobIndex, "company", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="Acme Inc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                          <input
                            type="text"
                            value={job.start_date}
                            onChange={(e) => updateWorkExperience(jobIndex, "start_date", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="Jan 2020"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                          <input
                            type="text"
                            value={job.end_date}
                            onChange={(e) => updateWorkExperience(jobIndex, "end_date", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="Present"
                          />
                        </div>
                      </div>

                      {/* Bullet Points */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-600">Achievements / Responsibilities</label>
                          <button
                            onClick={() => addBulletPoint(jobIndex)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            + Add Bullet
                          </button>
                        </div>
                        <div className="space-y-2">
                          {job.description.map((bullet, bulletIndex) => (
                            <div key={bulletIndex} className="flex gap-2">
                              <span className="text-gray-400 mt-2">•</span>
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => updateBulletPoint(jobIndex, bulletIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                placeholder="Describe an achievement or responsibility..."
                              />
                              <button
                                onClick={() => removeBulletPoint(jobIndex, bulletIndex)}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          {job.description.length === 0 && (
                            <p className="text-gray-400 text-sm">No bullet points added.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Education */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Education</h2>
            <button
              onClick={addEducation}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Education
            </button>
          </div>

          {resumeData.education.length === 0 ? (
            <p className="text-gray-500 text-sm">No education added yet.</p>
          ) : (
            <div className="space-y-4">
              {resumeData.education.map((edu, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">Education #{index + 1}</span>
                    <button
                      onClick={() => removeEducation(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, "institution", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="University of California"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="Bachelor of Science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => updateEducation(index, "field", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Graduation Date</label>
                      <input
                        type="text"
                        value={edu.graduation_date}
                        onChange={(e) => updateEducation(index, "graduation_date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="May 2020"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Skills</h2>

          {/* Add Skill Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Add a skill..."
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Skills Tags */}
          {resumeData.skills.length === 0 ? (
            <p className="text-gray-500 text-sm">No skills added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:text-blue-900"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Certifications</h2>
            <button
              onClick={addCertification}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Certification
            </button>
          </div>

          {resumeData.certifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No certifications added yet.</p>
          ) : (
            <div className="space-y-3">
              {resumeData.certifications.map((cert, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">Certification #{index + 1}</span>
                    <button onClick={() => removeCertification(index)} className="text-red-500 hover:text-red-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => updateCertification(index, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="AWS Solutions Architect"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Issuer</label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Amazon Web Services"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                      <input
                        type="text"
                        value={cert.date}
                        onChange={(e) => updateCertification(index, "date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="2023"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Languages */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Languages</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-600">Include in resume</span>
              <button
                type="button"
                onClick={() => { setIncludeLanguages(!includeLanguages); setHasChanges(true); }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  includeLanguages ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    includeLanguages ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLanguage()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Add a language..."
            />
            <button
              onClick={addLanguage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          {resumeData.languages.length === 0 ? (
            <p className="text-gray-500 text-sm">No languages added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {resumeData.languages.map((language, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                >
                  {language}
                  <button onClick={() => removeLanguage(language)} className="hover:text-indigo-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Honors & Awards */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Honors & Awards</h2>
            <button
              onClick={addHonor}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Honor
            </button>
          </div>

          {resumeData.honors.length === 0 ? (
            <p className="text-gray-500 text-sm">No honors or awards added yet.</p>
          ) : (
            <div className="space-y-3">
              {resumeData.honors.map((honor, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-gray-500">Honor #{index + 1}</span>
                    <button onClick={() => removeHonor(index)} className="text-red-500 hover:text-red-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                      <input
                        type="text"
                        value={honor.title}
                        onChange={(e) => updateHonor(index, "title", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Employee of the Year"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Issuer</label>
                      <input
                        type="text"
                        value={honor.issuer}
                        onChange={(e) => updateHonor(index, "issuer", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Company Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                      <input
                        type="text"
                        value={honor.date}
                        onChange={(e) => updateHonor(index, "date", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="2023"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Photo */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Photo</h2>
          <p className="text-gray-500 text-sm mb-4">This photo is displayed in your dashboard only, not on generated resumes.</p>

          <div className="flex items-center gap-6">
            {resumeData.profile_photo_path ? (
              <div className="relative">
                <img
                  src={resumeData.profile_photo_path}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  onClick={handlePhotoDelete}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}

            <div>
              <label className="cursor-pointer">
                <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block">
                  {uploadingPhoto ? "Uploading..." : resumeData.profile_photo_path ? "Change Photo" : "Upload Photo"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">JPEG, PNG, or WebP. Max 5MB.</p>
            </div>
          </div>
        </div>

          </div>
          {/* End of Left side - Form */}

          {/* Right side - Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
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

              <div className="overflow-auto p-4 bg-gray-100" style={{ maxHeight: "calc(100vh - 180px)" }}>
                <div className="flex justify-center">
                  {loadingPreview && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
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
                      <p>Add content to preview your resume</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* End of Right side - Live Preview */}
        </div>
        {/* End of grid */}

      </div>

      {/* Full Preview Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-start justify-center overflow-auto py-8">
          {/* Close and Download bar */}
          <div className="fixed top-0 left-0 right-0 z-60 bg-gray-900 bg-opacity-90 px-6 py-3 flex items-center justify-between">
            <span className="text-white font-medium">Resume Preview</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
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
                onClick={() => setShowFullPreview(false)}
                className="flex items-center gap-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>

          {/* Resume at full scale */}
          <div className="mt-16">
            {previewHtml ? (
              <div
                className="bg-white shadow-2xl"
                style={{
                  width: `${8.5 * 96}px`,
                  height: `${11 * 96}px`,
                  overflow: "hidden",
                }}
              >
                <iframe
                  srcDoc={previewHtml}
                  title="Resume Full Preview"
                  style={{
                    width: `${8.5 * 96}px`,
                    height: `${11 * 96}px`,
                    border: "none",
                    background: "white",
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-white">
                <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
