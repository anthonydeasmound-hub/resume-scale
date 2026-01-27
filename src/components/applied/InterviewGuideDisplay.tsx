"use client";

import { useState } from "react";
import { InterviewGuide, InterviewRound } from "@/lib/db";

interface InterviewGuideDisplayProps {
  jobId: number;
  guide: InterviewGuide | null;
  generatedAt: string | null;
  onGenerate: () => Promise<void>;
}

export default function InterviewGuideDisplay({
  jobId,
  guide,
  generatedAt,
  onGenerate,
}: InterviewGuideDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/interview-guide/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interview_guide.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getRoundTypeLabel = (type: InterviewRound["type"]): string => {
    const labels: Record<InterviewRound["type"], string> = {
      phone_screen: "Phone Screen",
      technical: "Technical Interview",
      behavioral: "Behavioral Interview",
      hiring_manager: "Hiring Manager Interview",
      final: "Final Round",
    };
    return labels[type] || type;
  };

  if (!guide) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Interview Guide Not Generated
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Generate a personalized interview preparation guide based on the job description
          and your resume. Includes company research, likely questions, and STAR answer
          frameworks using your actual achievements.
        </p>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating Guide...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Interview Guide
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Interview Preparation Guide</h3>
          {generatedAt && (
            <p className="text-xs text-gray-500">
              Generated {new Date(generatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {isGenerating ? "Regenerating..." : "Regenerate"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isDownloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Company Research */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Company Research</h4>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Overview: </span>
            <span className="text-gray-600">{guide.companyResearch.overview}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Culture: </span>
            <span className="text-gray-600">{guide.companyResearch.culture}</span>
          </div>
          {guide.companyResearch.competitors.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">Competitors: </span>
              <span className="text-gray-600">{guide.companyResearch.competitors.join(", ")}</span>
            </div>
          )}
          {guide.companyResearch.recentNews.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">Recent News:</span>
              <ul className="list-disc list-inside mt-1 text-gray-600">
                {guide.companyResearch.recentNews.map((news, idx) => (
                  <li key={idx}>{news}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Interview Rounds */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Interview Rounds</h4>
        <div className="space-y-2">
          {guide.interviewRounds.map((round) => {
            const isExpanded = expandedRound === round.round;
            return (
              <div key={round.round} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedRound(isExpanded ? null : round.round)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      {round.round}
                    </span>
                    <span className="font-medium text-gray-900">
                      {getRoundTypeLabel(round.type)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({round.typicalDuration})
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-4 py-4 bg-gray-50 border-t space-y-4">
                    {/* Likely Questions */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Likely Questions</h5>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {round.likelyQuestions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>

                    {/* STAR Answers */}
                    {round.starAnswers.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">STAR Answer Frameworks</h5>
                        <div className="space-y-3">
                          {round.starAnswers.map((star, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3 border text-sm">
                              <div className="font-medium text-gray-900 mb-2 italic">
                                &ldquo;{star.question}&rdquo;
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-medium text-blue-600">Situation: </span>
                                  <span className="text-gray-600">{star.situation}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-600">Task: </span>
                                  <span className="text-gray-600">{star.task}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-600">Action: </span>
                                  <span className="text-gray-600">{star.action}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-600">Result: </span>
                                  <span className="text-gray-600">{star.result}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    {round.tips.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Tips</h5>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {round.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Questions to Ask */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Questions to Ask</h4>
        <div className="grid grid-cols-2 gap-4">
          {guide.questionsToAsk.map((category, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-sm font-medium text-blue-600 mb-2">{category.category}</h5>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {category.questions.map((q, qIdx) => (
                  <li key={qIdx}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* General Tips */}
      {guide.generalTips.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">General Tips</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {guide.generalTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
