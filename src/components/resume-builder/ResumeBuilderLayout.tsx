"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface ResumeBuilderLayoutProps {
  resumeName: string;
  onNameChange?: (name: string) => void;
  onExportPDF: () => void;
  contentEditorContent: ReactNode;
  designerContent: ReactNode;
  previewContent: ReactNode;
  showSaveFinish?: boolean;
  onSaveFinish?: () => void;
  saveFinishLoading?: boolean;
}

export default function ResumeBuilderLayout({
  resumeName,
  onNameChange,
  onExportPDF,
  contentEditorContent,
  designerContent,
  previewContent,
  showSaveFinish = false,
  onSaveFinish,
  saveFinishLoading = false,
}: ResumeBuilderLayoutProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"content" | "designer">("content");
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(resumeName);

  const handleNameSave = () => {
    if (onNameChange && tempName.trim()) {
      onNameChange(tempName.trim());
    }
    setEditingName(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {editingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
              className="text-lg font-semibold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setTempName(resumeName);
                setEditingName(true);
              }}
              className="text-lg font-semibold text-gray-900 hover:text-gray-600 transition-colors"
            >
              {resumeName}
            </button>
          )}
        </div>

        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("content")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "content"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Content Editor
            </div>
            {activeTab === "content" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("designer")}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === "designer"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Designer
            </div>
            {activeTab === "designer" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scrollable */}
        <div className="w-1/2 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="max-w-2xl">
            {activeTab === "content" ? contentEditorContent : designerContent}

            {/* Save & Finish button (onboarding only) */}
            {showSaveFinish && activeTab === "content" && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={onSaveFinish}
                  disabled={saveFinishLoading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveFinishLoading ? "Saving..." : "Save & Finish"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 bg-gray-100 overflow-y-auto p-6">
          <div className="sticky top-0">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Live Preview</h3>
            {previewContent}
          </div>
        </div>
      </div>
    </div>
  );
}
