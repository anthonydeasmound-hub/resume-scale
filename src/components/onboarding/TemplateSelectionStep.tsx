"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Step, TEMPLATES, COLORS } from "./types";

interface TemplateSelectionStepProps {
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
  setStep: (step: Step) => void;
}

export default function TemplateSelectionStep({
  selectedTemplate,
  setSelectedTemplate,
  selectedColor,
  setSelectedColor,
  templateCategory,
  setTemplateCategory,
  templateOptions,
  setTemplateOptions,
  setStep,
}: TemplateSelectionStepProps) {
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

  // Reset carousel when category changes
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, templateCategory]);

  return (
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

      {/* Template Carousel */}
      <div className="relative mb-6">
        {/* Left Arrow */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
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
                className="flex-[0_0_280px] md:flex-[0_0_280px] sm:flex-[0_0_45%] max-sm:flex-[0_0_85%] min-w-0"
              >
                <button
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedTemplate === template.id
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  {/* Template Preview Image */}
                  <div className="aspect-[8.5/11] bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
                    <img
                      src={`/template-previews/${template.id}.png`}
                      alt={`${template.name} template preview`}
                      className="w-full h-full object-cover object-top rounded"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to placeholder if image doesn't exist
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = "block";
                      }}
                    />
                    {/* Fallback placeholder - template-specific designs */}
                    <div
                      className="absolute inset-0 bg-white rounded shadow-sm hidden"
                      style={{ display: "none" }}
                    >
                      {/* Navy Header - header band with photo */}
                      {template.id === "navy-header" && (
                        <div className="h-full flex flex-col">
                          <div className="p-2 flex items-center justify-between" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#1e3a5f" }}>
                            <div className="space-y-0.5"><div className="h-1 bg-white/60 rounded w-8"></div><div className="h-0.5 bg-white/40 rounded w-10"></div></div>
                            <div className="w-6 h-6 rounded-full bg-white/90 border border-white/50"></div>
                            <div className="text-right space-y-0.5"><div className="h-1.5 bg-white rounded w-10"></div><div className="h-1 bg-white/60 rounded w-8"></div></div>
                          </div>
                          <div className="p-2 flex-1 space-y-2">
                            <div><div className="h-1.5 rounded w-1/4 mb-1" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#1e3a5f40" }}></div><div className="h-0.5 bg-gray-200 rounded w-full"></div><div className="h-0.5 bg-gray-200 rounded w-4/5 mt-0.5"></div></div>
                            <div><div className="h-1.5 rounded w-1/3 mb-1" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#1e3a5f40" }}></div><div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-5/6"></div></div></div>
                          </div>
                        </div>
                      )}
                      {/* Blush Sidebar - pink sidebar with script style */}
                      {template.id === "blush-sidebar" && (
                        <div className="h-full flex">
                          <div className="w-1/3 p-1.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}20` : "#fce7f3" }}>
                            <div className="w-5 h-5 rounded-full mx-auto mb-1.5 border-2" style={{ backgroundColor: "#f9a8d4", borderColor: selectedTemplate === template.id ? selectedColor : "#f472b6" }}></div>
                            <div className="h-1 rounded w-3/4 mx-auto mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}60` : "#f472b680" }}></div>
                            <div className="space-y-1 mt-2"><div className="h-1 rounded w-2/3" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#f472b640" }}></div><div className="h-0.5 bg-pink-200 rounded"></div><div className="h-0.5 bg-pink-200 rounded w-4/5"></div></div>
                          </div>
                          <div className="flex-1 p-1.5 space-y-1.5">
                            <div><div className="h-1 rounded w-1/4 mb-0.5 italic" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#f472b640" }}></div><div className="h-0.5 bg-gray-200 rounded"></div></div>
                            <div><div className="h-1 rounded w-1/3 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#f472b640" }}></div><div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-4/5"></div></div></div>
                          </div>
                        </div>
                      )}
                      {/* Navy Initials - dark sidebar with initials circle */}
                      {template.id === "navy-initials" && (
                        <div className="h-full flex">
                          <div className="w-1/3 p-1.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#1e40af" }}>
                            <div className="w-5 h-5 rounded-full bg-white mx-auto mb-1 flex items-center justify-center"><span className="text-[6px] font-bold" style={{ color: selectedTemplate === template.id ? selectedColor : "#1e40af" }}>AB</span></div>
                            <div className="h-1 bg-white/70 rounded w-3/4 mx-auto mb-0.5"></div>
                            <div className="space-y-1 mt-2"><div className="h-0.5 bg-white/40 rounded"></div><div className="h-0.5 bg-white/30 rounded w-4/5"></div></div>
                          </div>
                          <div className="flex-1 p-1.5 space-y-1.5">
                            <div><div className="h-1 rounded w-1/3 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#1e40af" }}></div><div className="h-0.5 bg-gray-200 rounded"></div></div>
                            <div><div className="h-1 rounded w-1/4 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#1e40af" }}></div><div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-5/6"></div></div></div>
                          </div>
                        </div>
                      )}
                      {/* Teal Split - header with two-column body */}
                      {template.id === "teal-header-split" && (
                        <div className="h-full flex flex-col">
                          <div className="p-1.5 flex items-center gap-1.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#0d9488" }}>
                            <div className="w-5 h-5 rounded-full bg-white"></div>
                            <div className="flex-1"><div className="h-1.5 bg-white rounded w-1/2 mb-0.5"></div><div className="h-1 bg-white/70 rounded w-1/3"></div></div>
                          </div>
                          <div className="flex-1 flex p-1.5 gap-1.5">
                            <div className="flex-1 space-y-1"><div className="h-1 rounded w-1/3 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#0d948840" }}></div><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-4/5"></div></div>
                            <div className="w-1/3 space-y-1"><div className="h-1 rounded w-2/3 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#0d948840" }}></div><div className="h-0.5 bg-gray-200 rounded"></div></div>
                          </div>
                        </div>
                      )}
                      {/* Coral Sidebar */}
                      {template.id === "coral-sidebar" && (
                        <div className="h-full flex">
                          <div className="w-1/3 p-1.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#f97316" }}>
                            <div className="w-5 h-5 rounded-lg bg-white mx-auto mb-1"></div>
                            <div className="h-1 bg-white/80 rounded w-3/4 mx-auto mb-0.5"></div>
                            <div className="space-y-1 mt-2"><div className="h-0.5 bg-white/50 rounded"></div><div className="h-0.5 bg-white/40 rounded w-4/5"></div></div>
                          </div>
                          <div className="flex-1 p-1.5 bg-gray-50 space-y-1.5">
                            <div><div className="h-1 rounded w-1/4 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}60` : "#f9731660" }}></div><div className="h-0.5 bg-gray-200 rounded"></div></div>
                            <div><div className="h-1 rounded w-1/3 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}60` : "#f9731660" }}></div><div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-5/6"></div></div></div>
                          </div>
                        </div>
                      )}
                      {/* Lavender Right */}
                      {template.id === "lavender-right" && (
                        <div className="h-full flex">
                          <div className="flex-1 p-1.5 space-y-1.5">
                            <div className="border-b pb-1" style={{ borderColor: selectedTemplate === template.id ? `${selectedColor}40` : "#c4b5fd" }}><div className="h-2 bg-gray-300 rounded w-1/2 mb-0.5"></div><div className="h-1 rounded w-1/3" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}60` : "#a78bfa" }}></div></div>
                            <div><div className="h-1 rounded w-1/4 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#c4b5fd" }}></div><div className="h-0.5 bg-gray-200 rounded"></div></div>
                          </div>
                          <div className="w-1/3 p-1.5 border-l-2" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}15` : "#ede9fe", borderColor: selectedTemplate === template.id ? `${selectedColor}40` : "#c4b5fd" }}>
                            <div className="w-5 h-5 rounded-full mx-auto mb-1 border-2" style={{ backgroundColor: "#ddd", borderColor: selectedTemplate === template.id ? `${selectedColor}60` : "#a78bfa" }}></div>
                            <div className="space-y-1"><div className="h-0.5 rounded" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#c4b5fd" }}></div><div className="h-0.5 bg-purple-200 rounded w-4/5"></div></div>
                          </div>
                        </div>
                      )}
                      {/* Teal Contact - gradient sidebar with icons */}
                      {template.id === "teal-contact" && (
                        <div className="h-full flex">
                          <div className="w-1/3 p-1.5" style={{ background: selectedTemplate === template.id ? `linear-gradient(180deg, ${selectedColor} 0%, ${selectedColor}dd 100%)` : "linear-gradient(180deg, #0d9488 0%, #0d9488dd 100%)" }}>
                            <div className="w-5 h-5 rounded-full bg-white/90 mx-auto mb-1"></div>
                            <div className="h-1 bg-white/70 rounded w-3/4 mx-auto mb-0.5"></div>
                            <div className="space-y-1.5 mt-2">
                              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/30"></div><div className="h-0.5 bg-white/50 rounded flex-1"></div></div>
                              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/30"></div><div className="h-0.5 bg-white/50 rounded flex-1"></div></div>
                            </div>
                          </div>
                          <div className="flex-1 p-1.5 space-y-1.5">
                            <div><div className="h-1 rounded w-1/3 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#0d9488" }}></div><div className="h-0.5 bg-gray-200 rounded"></div></div>
                            <div><div className="h-1 rounded w-1/4 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#0d9488" }}></div><div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-5/6"></div></div></div>
                          </div>
                        </div>
                      )}
                      {/* Dusty Blue */}
                      {template.id === "dusty-blue" && (
                        <div className="h-full flex">
                          <div className="w-1/3 p-1.5 border-r-4" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}20` : "#dbeafe", borderColor: selectedTemplate === template.id ? selectedColor : "#3b82f6" }}>
                            <div className="w-5 h-5 rounded-full mx-auto mb-1 border-2" style={{ backgroundColor: "#ddd", borderColor: selectedTemplate === template.id ? selectedColor : "#3b82f6" }}></div>
                            <div className="h-1 rounded w-3/4 mx-auto mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#3b82f6" }}></div>
                            <div className="space-y-1 mt-2"><div className="h-1 rounded w-2/3" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}60` : "#3b82f660" }}></div><div className="h-0.5 bg-blue-200 rounded"></div></div>
                          </div>
                          <div className="flex-1 p-1.5 space-y-1.5">
                            <div><div className="h-1 rounded w-1/3 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#3b82f6" }}></div><div className="h-0.5 bg-gray-200 rounded"></div></div>
                            <div><div className="h-1 rounded w-1/4 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#3b82f6" }}></div><div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-5/6"></div></div></div>
                          </div>
                        </div>
                      )}
                      {/* Minimalist Bars */}
                      {template.id === "minimalist-bars" && (
                        <div className="h-full p-2 space-y-1.5">
                          <div className="text-center pb-1.5 border-b-2" style={{ borderColor: selectedTemplate === template.id ? selectedColor : "#374151" }}><div className="h-2 bg-gray-300 rounded w-1/3 mx-auto mb-0.5"></div><div className="h-1 rounded w-1/4 mx-auto" style={{ backgroundColor: selectedTemplate === template.id ? `${selectedColor}40` : "#37415140" }}></div></div>
                          <div><div className="h-1.5 rounded-sm w-1/4 mb-0.5 flex items-center pl-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#374151" }}><span className="text-white text-[4px]">SUMMARY</span></div><div className="h-0.5 bg-gray-200 rounded"></div></div>
                          <div><div className="h-1.5 rounded-sm w-1/4 mb-0.5 flex items-center pl-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#374151" }}><span className="text-white text-[4px]">EXPERIENCE</span></div><div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-4/5"></div></div></div>
                        </div>
                      )}
                      {/* Clean Dividers */}
                      {template.id === "clean-dividers" && (
                        <div className="h-full p-2 space-y-1.5">
                          <div><div className="h-2 bg-gray-300 rounded w-1/2 mb-0.5"></div><div className="h-1 rounded w-1/4" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}></div></div>
                          <div className="flex items-center gap-1"><div className="h-1 rounded w-1/6 flex-shrink-0" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}></div><div className="h-px bg-gray-200 flex-1"></div></div>
                          <div className="h-0.5 bg-gray-200 rounded"></div>
                          <div className="flex items-center gap-1"><div className="h-1 rounded w-1/5 flex-shrink-0" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}></div><div className="h-px bg-gray-200 flex-1"></div></div>
                          <div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-5/6"></div></div>
                        </div>
                      )}
                      {/* Block Accent */}
                      {template.id === "block-accent" && (
                        <div className="h-full flex">
                          <div className="w-1/3 p-1.5 bg-gray-100 border-r-4" style={{ borderColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}>
                            <div className="w-5 h-5 mx-auto mb-1" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}></div>
                            <div className="h-1 bg-gray-800 rounded w-3/4 mx-auto mb-0.5"></div>
                            <div className="mt-2 -mx-1.5 px-1.5 py-0.5 text-white text-[4px]" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}>CONTACT</div>
                            <div className="space-y-0.5 mt-1"><div className="h-0.5 bg-gray-300 rounded"></div><div className="h-0.5 bg-gray-300 rounded w-4/5"></div></div>
                          </div>
                          <div className="flex-1 p-1.5 space-y-1.5">
                            <div><div className="h-1 rounded w-1/4 border-b-2 inline-block" style={{ borderColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}></div></div>
                            <div className="flex justify-between items-center"><div className="h-0.5 bg-gray-300 rounded w-1/3"></div><div className="h-1.5 rounded text-[4px] text-white px-1" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}>2023</div></div>
                            <div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-5/6"></div></div>
                          </div>
                        </div>
                      )}
                      {/* Minimal Photo */}
                      {template.id === "minimal-photo" && (
                        <div className="h-full p-2 space-y-1.5">
                          <div className="flex items-center gap-2 pb-1.5 border-b border-gray-200">
                            <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                            <div className="flex-1"><div className="h-2 bg-gray-300 rounded w-1/2 mb-0.5"></div><div className="h-1 rounded w-1/3" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}></div></div>
                          </div>
                          <div><div className="h-1 rounded w-1/5 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}></div><div className="h-0.5 bg-gray-200 rounded"></div></div>
                          <div><div className="h-1 rounded w-1/4 mb-0.5" style={{ backgroundColor: selectedTemplate === template.id ? selectedColor : "#2563eb" }}></div><div className="space-y-0.5"><div className="h-0.5 bg-gray-200 rounded"></div><div className="h-0.5 bg-gray-200 rounded w-4/5"></div></div></div>
                        </div>
                      )}
                    </div>
                    {/* Selection checkmark */}
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm">{template.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                      {template.category}
                    </span>
                    <p className="text-xs text-gray-500 truncate">{template.description}</p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all ${
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
      <div className="mb-6 p-4 bg-brand-gray rounded-lg">
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
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={templateOptions.showLanguages}
              onChange={(e) => setTemplateOptions({ ...templateOptions, showLanguages: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Show languages section</span>
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
          onClick={() => setStep("contact")}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
