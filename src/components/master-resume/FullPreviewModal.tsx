"use client";

interface FullPreviewModalProps {
  previewHtml: string;
  downloadingPdf: boolean;
  onDownloadPdf: () => void;
  onClose: () => void;
}

export default function FullPreviewModal({ previewHtml, downloadingPdf, onDownloadPdf, onClose }: FullPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-start justify-center overflow-auto py-8">
      {/* Close and Download bar */}
      <div className="fixed top-0 left-0 right-0 z-60 bg-gray-900 bg-opacity-90 px-6 py-3 flex items-center justify-between">
        <span className="text-white font-medium">Resume Preview</span>
        <div className="flex items-center gap-3">
          <button
            onClick={onDownloadPdf}
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
            onClick={onClose}
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
  );
}
