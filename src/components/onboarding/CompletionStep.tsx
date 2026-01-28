"use client";

interface CompletionStepProps {
  previewHtml: string;
  downloadingPdf: boolean;
  handleDownloadPdf: () => void;
  onGoToDashboard: () => void;
}

export default function CompletionStep({
  previewHtml,
  downloadingPdf,
  handleDownloadPdf,
  onGoToDashboard,
}: CompletionStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 lg:col-span-2">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your resume is ready!</h2>
        <p className="text-gray-600">Review your resume below, download it as a PDF, or head to your dashboard.</p>
      </div>

      {/* Full-page preview */}
      <div className="flex justify-center mb-8">
        <div
          className="bg-white shadow-2xl border border-gray-200 rounded-lg overflow-hidden"
          style={{
            width: "min(100%, 680px)",
          }}
        >
          {previewHtml ? (
            <div style={{ position: "relative", width: "100%", paddingBottom: `${(11 / 8.5) * 100}%` }}>
              <iframe
                srcDoc={previewHtml}
                title="Resume Preview"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${8.5 * 96}px`,
                  height: `${11 * 96}px`,
                  transform: `scale(${680 / (8.5 * 96)})`,
                  transformOrigin: "top left",
                  border: "none",
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-gray-900 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors disabled:opacity-50"
        >
          {downloadingPdf ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Generating PDF...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>
        <button
          onClick={onGoToDashboard}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Go to Dashboard
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
