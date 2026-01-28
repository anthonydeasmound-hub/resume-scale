"use client";

import React from "react";

interface ResumePreviewPaneProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  previewHtml: string;
  loadingPreview: boolean;
}

export default function ResumePreviewPane({
  iframeRef,
  previewHtml,
  loadingPreview,
}: ResumePreviewPaneProps) {
  return (
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
            width: "425px",
            height: "550px",
            overflow: "hidden",
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            title="Resume Preview"
            style={{
              width: "8.5in",
              height: "11in",
              transform: "scale(0.52)",
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
          <p>Select options to preview your resume</p>
        </div>
      )}
    </div>
  );
}
