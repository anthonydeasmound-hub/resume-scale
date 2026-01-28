"use client";

import { ContactInfo } from "./types";

interface CoverLetterPreviewProps {
  contactInfo: ContactInfo;
  coverLetter: string;
  accentColor: string;
}

export default function CoverLetterPreview({
  contactInfo,
  coverLetter,
  accentColor,
}: CoverLetterPreviewProps) {
  return (
    <div className="p-8 text-xs" style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}>
      <div className="mb-4">
        <h1 style={{ fontFamily: "var(--font-lora), 'Lora', serif", fontSize: "16pt", color: accentColor }}>
          {contactInfo.name}
        </h1>
        <div style={{ fontSize: "8pt", color: "#666" }}>
          <p>{contactInfo.email}</p>
          <p>{contactInfo.phone}</p>
        </div>
      </div>
      <p style={{ fontSize: "8pt", marginBottom: "12px" }}>
        {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <p style={{ fontSize: "8pt", marginBottom: "8px" }}>Dear Hiring Manager,</p>
      <div style={{ fontSize: "8pt", color: "#444", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
        {coverLetter || "Your cover letter will appear here..."}
      </div>
      <div style={{ marginTop: "16px", fontSize: "8pt" }}>
        <p>Sincerely,</p>
        <p style={{ marginTop: "16px", fontWeight: 600 }}>{contactInfo.name}</p>
      </div>
    </div>
  );
}
