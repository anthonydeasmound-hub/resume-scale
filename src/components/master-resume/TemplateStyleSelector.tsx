"use client";

import TemplateMiniPreview from "./TemplateMiniPreview";

interface Template {
  id: string;
  name: string;
  description: string;
}

interface Color {
  id: string;
  hex: string;
  name: string;
}

interface TemplateStyleSelectorProps {
  templates: Template[];
  colors: Color[];
  selectedTemplate: string;
  selectedColor: string;
  showLanguages: boolean;
  onTemplateChange: (templateId: string) => void;
  onColorChange: (hex: string) => void;
  onShowLanguagesChange: (value: boolean) => void;
}

export default function TemplateStyleSelector({
  templates,
  colors,
  selectedTemplate,
  selectedColor,
  showLanguages,
  onTemplateChange,
  onColorChange,
  onShowLanguagesChange,
}: TemplateStyleSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Resume Template</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map(tmpl => (
          <button
            key={tmpl.id}
            onClick={() => onTemplateChange(tmpl.id)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedTemplate === tmpl.id
                ? "border-blue-500 bg-brand-blue-light shadow-md"
                : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
          >
            <div className="w-full bg-gray-50 rounded mb-2 border border-gray-200 overflow-hidden shadow-inner" style={{ height: 180 }}>
              <TemplateMiniPreview templateId={tmpl.id} accentColor={selectedColor} />
            </div>
            <p className="text-sm font-medium text-gray-700">{tmpl.name}</p>
            <p className="text-xs text-gray-500">{tmpl.description}</p>
          </button>
        ))}
      </div>

      {/* Accent Color */}
      <h3 className="text-sm font-semibold text-gray-700 mt-5 mb-3">Accent Color</h3>
      <div className="flex gap-3">
        {colors.map(color => (
          <button
            key={color.id}
            onClick={() => onColorChange(color.hex)}
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

      {/* Template Options */}
      <h3 className="text-sm font-semibold text-gray-700 mt-5 mb-3">Options</h3>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={showLanguages}
          onChange={(e) => onShowLanguagesChange(e.target.checked)}
          className="w-4 h-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue"
        />
        <span className="text-sm text-gray-700">Show languages section</span>
      </label>
    </div>
  );
}
