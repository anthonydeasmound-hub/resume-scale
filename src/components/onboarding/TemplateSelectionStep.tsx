"use client";

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
