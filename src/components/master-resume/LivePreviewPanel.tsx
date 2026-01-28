"use client";

interface LivePreviewPanelProps {
  previewHtml: string;
  previewScale: number;
  loadingPreview: boolean;
  onScaleChange: (scale: number) => void;
}

export default function LivePreviewPanel({ previewHtml, previewScale, loadingPreview, onScaleChange }: LivePreviewPanelProps) {
  return (
    <div className="lg:sticky lg:top-8 h-fit">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Live Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onScaleChange(Math.max(0.3, previewScale - 0.1))}
              className="p-1 hover:bg-gray-200 rounded text-gray-600"
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs text-gray-500 w-12 text-center">{Math.round(previewScale * 100)}%</span>
            <button
              onClick={() => onScaleChange(Math.min(1, previewScale + 0.1))}
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
  );
}
