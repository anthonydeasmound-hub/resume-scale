"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { LinkedInData, TEMPLATES, COLORS } from "@/components/onboarding/types";

interface SectionProps {
  editableData: LinkedInData;
  setEditableData: (data: LinkedInData) => void;
}

const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

// Contact Information Section
export function ContactInfoContent({ editableData, setEditableData }: SectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={editableData.contact_info.name}
          onChange={(e) => {
            const updated = { ...editableData };
            updated.contact_info.name = e.target.value;
            setEditableData(updated);
          }}
          className={inputClass}
          placeholder="John Doe"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={editableData.contact_info.email}
            onChange={(e) => {
              const updated = { ...editableData };
              updated.contact_info.email = e.target.value;
              setEditableData(updated);
            }}
            className={inputClass}
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="tel"
            value={editableData.contact_info.phone}
            onChange={(e) => {
              const updated = { ...editableData };
              updated.contact_info.phone = e.target.value;
              setEditableData(updated);
            }}
            className={inputClass}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Location</label>
        <input
          type="text"
          value={editableData.contact_info.location}
          onChange={(e) => {
            const updated = { ...editableData };
            updated.contact_info.location = e.target.value;
            setEditableData(updated);
          }}
          className={inputClass}
          placeholder="San Francisco, CA"
        />
      </div>
      <div>
        <label className={labelClass}>LinkedIn (optional)</label>
        <input
          type="url"
          value={editableData.contact_info.linkedin}
          onChange={(e) => {
            const updated = { ...editableData };
            updated.contact_info.linkedin = e.target.value;
            setEditableData(updated);
          }}
          className={inputClass}
          placeholder="linkedin.com/in/johndoe"
        />
      </div>
    </div>
  );
}

// Professional Summary Section
interface SummaryContentProps extends SectionProps {
  summary: string;
  setSummary: (summary: string) => void;
}

export function ProfessionalSummaryContent({ summary, setSummary }: SummaryContentProps) {
  return (
    <div>
      <label className={labelClass}>Professional Summary</label>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        className={`${inputClass} min-h-[120px] resize-none`}
        placeholder="Write a brief professional summary highlighting your experience and skills..."
      />
      <p className="text-xs text-gray-500 mt-1">2-4 sentences recommended</p>
    </div>
  );
}

// Work Experience Section
export function WorkExperienceContent({ editableData, setEditableData }: SectionProps) {
  const addExperience = () => {
    const updated = { ...editableData };
    updated.work_experience = [
      ...updated.work_experience,
      { company: "", title: "", start_date: "", end_date: "", description: [] },
    ];
    setEditableData(updated);
  };

  const removeExperience = (index: number) => {
    const updated = { ...editableData };
    updated.work_experience = updated.work_experience.filter((_, i) => i !== index);
    setEditableData(updated);
  };

  const updateExperience = (index: number, field: keyof Omit<typeof editableData.work_experience[0], 'description'>, value: string) => {
    const updated = { ...editableData };
    updated.work_experience[index] = { ...updated.work_experience[index], [field]: value };
    setEditableData(updated);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const updated = { ...editableData };
    updated.work_experience[expIndex].description[bulletIndex] = value;
    setEditableData(updated);
  };

  const addBullet = (expIndex: number) => {
    const updated = { ...editableData };
    updated.work_experience[expIndex].description.push("");
    setEditableData(updated);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = { ...editableData };
    updated.work_experience[expIndex].description = updated.work_experience[expIndex].description.filter(
      (_, i) => i !== bulletIndex
    );
    setEditableData(updated);
  };

  return (
    <div className="space-y-6">
      {editableData.work_experience.map((exp, expIndex) => (
        <div key={expIndex} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500">Position {expIndex + 1}</span>
            {editableData.work_experience.length > 1 && (
              <button
                onClick={() => removeExperience(expIndex)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Job Title</label>
              <input
                type="text"
                value={exp.title}
                onChange={(e) => updateExperience(expIndex, "title", e.target.value)}
                className={inputClass}
                placeholder="Software Engineer"
              />
            </div>
            <div>
              <label className={labelClass}>Company</label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateExperience(expIndex, "company", e.target.value)}
                className={inputClass}
                placeholder="Company Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="text"
                value={exp.start_date}
                onChange={(e) => updateExperience(expIndex, "start_date", e.target.value)}
                className={inputClass}
                placeholder="Jan 2020"
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="text"
                value={exp.end_date}
                onChange={(e) => updateExperience(expIndex, "end_date", e.target.value)}
                className={inputClass}
                placeholder="Present"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bullet Points</label>
            <div className="space-y-2">
              {exp.description.map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                    className={inputClass}
                    placeholder="Describe your achievement..."
                  />
                  <button
                    onClick={() => removeBullet(expIndex, bulletIndex)}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => addBullet(expIndex)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add bullet point
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addExperience}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        + Add Work Experience
      </button>
    </div>
  );
}

// Education Section
export function EducationContent({ editableData, setEditableData }: SectionProps) {
  const addEducation = () => {
    const updated = { ...editableData };
    updated.education = [
      ...updated.education,
      { institution: "", degree: "", field: "", graduation_date: "" },
    ];
    setEditableData(updated);
  };

  const removeEducation = (index: number) => {
    const updated = { ...editableData };
    updated.education = updated.education.filter((_, i) => i !== index);
    setEditableData(updated);
  };

  const updateEducation = (index: number, field: keyof typeof editableData.education[0], value: string) => {
    const updated = { ...editableData };
    updated.education[index] = { ...updated.education[index], [field]: value };
    setEditableData(updated);
  };

  return (
    <div className="space-y-6">
      {editableData.education.map((edu, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-500">Education {index + 1}</span>
            {editableData.education.length > 1 && (
              <button
                onClick={() => removeEducation(index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Institution</label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => updateEducation(index, "institution", e.target.value)}
                className={inputClass}
                placeholder="University Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Degree</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, "degree", e.target.value)}
                  className={inputClass}
                  placeholder="Bachelor's, Master's, etc."
                />
              </div>
              <div>
                <label className={labelClass}>Field of Study</label>
                <input
                  type="text"
                  value={edu.field}
                  onChange={(e) => updateEducation(index, "field", e.target.value)}
                  className={inputClass}
                  placeholder="Computer Science"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Graduation Date</label>
              <input
                type="text"
                value={edu.graduation_date}
                onChange={(e) => updateEducation(index, "graduation_date", e.target.value)}
                className={inputClass}
                placeholder="May 2020"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addEducation}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        + Add Education
      </button>
    </div>
  );
}

// Skills Section
export function SkillsContent({ editableData, setEditableData }: SectionProps) {
  const addSkill = (skill: string) => {
    if (skill.trim() && !editableData.skills.includes(skill.trim())) {
      const updated = { ...editableData };
      updated.skills = [...updated.skills, skill.trim()];
      setEditableData(updated);
    }
  };

  const removeSkill = (index: number) => {
    const updated = { ...editableData };
    updated.skills = updated.skills.filter((_, i) => i !== index);
    setEditableData(updated);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {editableData.skills.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {skill}
            <button
              onClick={() => removeSkill(index)}
              className="hover:text-blue-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type a skill and press Enter"
        className={inputClass}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addSkill((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = "";
          }
        }}
      />
    </div>
  );
}

// Certifications Section
export function CertificationsContent({ editableData, setEditableData }: SectionProps) {
  const addCertification = () => {
    const updated = { ...editableData };
    updated.certifications = [
      ...updated.certifications,
      { name: "", issuer: "", date: "" },
    ];
    setEditableData(updated);
  };

  const removeCertification = (index: number) => {
    const updated = { ...editableData };
    updated.certifications = updated.certifications.filter((_, i) => i !== index);
    setEditableData(updated);
  };

  const updateCertification = (index: number, field: keyof typeof editableData.certifications[0], value: string) => {
    const updated = { ...editableData };
    updated.certifications[index] = { ...updated.certifications[index], [field]: value };
    setEditableData(updated);
  };

  return (
    <div className="space-y-4">
      {editableData.certifications.map((cert, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-medium text-gray-500">Certification {index + 1}</span>
            <button
              onClick={() => removeCertification(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={cert.name}
              onChange={(e) => updateCertification(index, "name", e.target.value)}
              className={inputClass}
              placeholder="Certification Name"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={cert.issuer}
                onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                className={inputClass}
                placeholder="Issuing Organization"
              />
              <input
                type="text"
                value={cert.date}
                onChange={(e) => updateCertification(index, "date", e.target.value)}
                className={inputClass}
                placeholder="Date"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addCertification}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        + Add Certification
      </button>
    </div>
  );
}

// Languages Section
export function LanguagesContent({ editableData, setEditableData }: SectionProps) {
  const addLanguage = (language: string) => {
    if (language.trim() && !editableData.languages.includes(language.trim())) {
      const updated = { ...editableData };
      updated.languages = [...updated.languages, language.trim()];
      setEditableData(updated);
    }
  };

  const removeLanguage = (index: number) => {
    const updated = { ...editableData };
    updated.languages = updated.languages.filter((_, i) => i !== index);
    setEditableData(updated);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {editableData.languages.map((lang, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
          >
            {lang}
            <button
              onClick={() => removeLanguage(index)}
              className="hover:text-green-600"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type a language and press Enter"
        className={inputClass}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addLanguage((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = "";
          }
        }}
      />
    </div>
  );
}

// Honors Section
export function HonorsContent({ editableData, setEditableData }: SectionProps) {
  const addHonor = () => {
    const updated = { ...editableData };
    updated.honors = [
      ...updated.honors,
      { title: "", issuer: "", date: "" },
    ];
    setEditableData(updated);
  };

  const removeHonor = (index: number) => {
    const updated = { ...editableData };
    updated.honors = updated.honors.filter((_, i) => i !== index);
    setEditableData(updated);
  };

  const updateHonor = (index: number, field: keyof typeof editableData.honors[0], value: string) => {
    const updated = { ...editableData };
    updated.honors[index] = { ...updated.honors[index], [field]: value };
    setEditableData(updated);
  };

  return (
    <div className="space-y-4">
      {editableData.honors.map((honor, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <span className="text-sm font-medium text-gray-500">Honor {index + 1}</span>
            <button
              onClick={() => removeHonor(index)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={honor.title}
              onChange={(e) => updateHonor(index, "title", e.target.value)}
              className={inputClass}
              placeholder="Award/Honor Title"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={honor.issuer}
                onChange={(e) => updateHonor(index, "issuer", e.target.value)}
                className={inputClass}
                placeholder="Issuing Organization"
              />
              <input
                type="text"
                value={honor.date}
                onChange={(e) => updateHonor(index, "date", e.target.value)}
                className={inputClass}
                placeholder="Date"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addHonor}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        + Add Honor/Award
      </button>
    </div>
  );
}

// Designer Content (Template Selection + Color Picker)
interface DesignerContentProps {
  selectedTemplate: string;
  setSelectedTemplate: (id: string) => void;
  selectedColor: string;
  setSelectedColor: (hex: string) => void;
  templateCategory: string;
  setTemplateCategory: (cat: string) => void;
  templateOptions: {
    showPhoto: boolean;
    showSkillBars: boolean;
    showIcons: boolean;
    showLanguages: boolean;
  };
  setTemplateOptions: (opts: {
    showPhoto: boolean;
    showSkillBars: boolean;
    showIcons: boolean;
    showLanguages: boolean;
  }) => void;
}

export function DesignerContent({
  selectedTemplate,
  setSelectedTemplate,
  selectedColor,
  setSelectedColor,
  templateCategory,
  setTemplateCategory,
  templateOptions,
  setTemplateOptions,
}: DesignerContentProps) {
  const filteredTemplates = TEMPLATES.filter(
    (t) => templateCategory === "all" || t.category === templateCategory
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, templateCategory]);

  return (
    <div className="p-4 space-y-6">
      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Template Style</label>
        <div className="flex flex-wrap gap-2">
          {["all", "professional", "modern", "creative", "technical", "executive"].map((cat) => (
            <button
              key={cat}
              onClick={() => setTemplateCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                templateCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Template Carousel */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-3">Choose Template</label>

        {/* Left Arrow */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={`absolute left-0 top-1/2 mt-3 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
            canScrollPrev
              ? "hover:bg-gray-50 text-gray-700"
              : "opacity-50 cursor-not-allowed text-gray-300"
          }`}
          aria-label="Previous templates"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Carousel Viewport */}
        <div className="overflow-hidden px-2" ref={emblaRef}>
          <div className="flex gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="flex-[0_0_200px] min-w-0"
              >
                <button
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full p-2 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedTemplate === template.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="aspect-[8.5/11] bg-gray-100 rounded-lg mb-2 relative overflow-hidden">
                    <img
                      src={`/template-previews/${template.id}.png`}
                      alt={`${template.name} template preview`}
                      className="w-full h-full object-cover object-top rounded"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "block";
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-white rounded shadow-sm hidden"
                      style={{ display: "none" }}
                    >
                      <div className="p-2">
                        <div
                          className="h-3 bg-gray-300 rounded w-1/2 mb-2"
                          style={{
                            backgroundColor:
                              selectedTemplate === template.id ? selectedColor : undefined,
                          }}
                        />
                        <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-1" />
                        <div className="h-1.5 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-800 text-xs">{template.name}</h3>
                  <span className="text-xs text-gray-500 capitalize">{template.category}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={`absolute right-0 top-1/2 mt-3 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
            canScrollNext
              ? "hover:bg-gray-50 text-gray-700"
              : "opacity-50 cursor-not-allowed text-gray-300"
          }`}
          aria-label="Next templates"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Color Selection */}
      <div>
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
      <div className="p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-3">Display Options</label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={templateOptions.showPhoto}
              onChange={(e) => setTemplateOptions({ ...templateOptions, showPhoto: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Include photo placeholder</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={templateOptions.showSkillBars}
              onChange={(e) => setTemplateOptions({ ...templateOptions, showSkillBars: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show skill proficiency bars</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={templateOptions.showIcons}
              onChange={(e) => setTemplateOptions({ ...templateOptions, showIcons: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Use section icons</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={templateOptions.showLanguages}
              onChange={(e) => setTemplateOptions({ ...templateOptions, showLanguages: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show languages section</span>
          </label>
        </div>
      </div>
    </div>
  );
}
