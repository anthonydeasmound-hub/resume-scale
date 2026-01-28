"use client";

interface ProfessionalSummarySectionProps {
  summary: string;
  onUpdate: (value: string) => void;
}

export default function ProfessionalSummarySection({ summary, onUpdate }: ProfessionalSummarySectionProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Professional Summary</h2>
      <textarea
        value={summary}
        onChange={(e) => onUpdate(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-gray-900"
        placeholder="Write a brief professional summary highlighting your key skills and experience..."
      />
      <p className="text-xs text-gray-500 mt-2">
        This summary will be displayed at the top of your resume. It should be 2-4 sentences that highlight your expertise and career goals.
      </p>
    </div>
  );
}
