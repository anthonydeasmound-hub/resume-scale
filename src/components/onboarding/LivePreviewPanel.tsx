"use client";

import { TEMPLATES } from "./types";

interface LivePreviewPanelProps {
  previewHtml: string;
  loadingPreview: boolean;
  previewScale: number;
  setPreviewScale: (scale: number) => void;
  selectedTemplate: string;
  selectedColor: string;
}

export default function LivePreviewPanel({
  previewHtml,
  loadingPreview,
  previewScale,
  setPreviewScale,
  selectedTemplate,
  selectedColor,
}: LivePreviewPanelProps) {
  return (
    <div className="hidden lg:block">
      <div className="sticky top-8">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Live Preview</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewScale(Math.max(0.3, previewScale - 0.1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Zoom out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 w-12 text-center">{Math.round(previewScale * 100)}%</span>
              <button
                onClick={() => setPreviewScale(Math.min(1, previewScale + 0.1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Zoom in"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          <div
            className="bg-gray-100 rounded-lg overflow-hidden"
            style={{
              height: `${11 * 96 * previewScale + 32}px`,
            }}
          >
            {loadingPreview && !previewHtml ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : previewHtml ? (
              <div className="flex justify-center">
                <div
                  className="bg-white shadow-lg"
                  style={{
                    width: `${8.5 * 96 * previewScale}px`,
                    height: `${11 * 96 * previewScale}px`,
                    overflow: 'hidden',
                  }}
                >
                  <iframe
                    srcDoc={previewHtml}
                    title="Resume Preview"
                    style={{
                      width: `${8.5 * 96}px`,
                      height: `${11 * 96}px`,
                      transform: `scale(${previewScale})`,
                      transformOrigin: 'top left',
                      border: 'none',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">Your resume preview will appear here</p>
                <p className="text-xs mt-1">Add some content to see it</p>
              </div>
            )}
          </div>

          {/* Template info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Template: {TEMPLATES.find(t => t.id === selectedTemplate)?.name || selectedTemplate}</span>
              <div className="flex items-center gap-2">
                <span>Color:</span>
                <div
                  className="w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
