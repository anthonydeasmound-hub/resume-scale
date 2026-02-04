"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { showToast } from "@/components/Toast";

interface InterviewPrepTabProps {
  jobId: number;
  companyName: string;
  jobTitle: string;
  jobDescription: string | null;
  existingGuide?: string | null;
}

interface PrepCard {
  id: string;
  type: "question" | "tip" | "talking_point" | "star_story";
  front: string;
  back: string;
  category?: string;
}

interface InterviewStagePrep {
  id: string;
  name: string;
  type: string;
  duration: string;
  description: string;
  prepCards: PrepCard[];
  tips: string[];
}

interface InterviewGuide {
  detectedRoleType?: string;
  processExplanation?: string;
  companyResearch?: {
    overview?: string;
    recentNews?: string[];
    culture?: string;
    competitors?: string[];
  };
  suggestedStages?: InterviewStagePrep[];
  questionsToAsk?: {
    category: string;
    questions: string[];
    bestAskedDuring?: string;
  }[];
  generalTips?: string[];
  interviewRounds?: Array<{
    round: number;
    type: string;
    typicalDuration: string;
    likelyQuestions: string[];
    starAnswers: Array<{
      question: string;
      situation: string;
      task: string;
      action: string;
      result: string;
    }>;
    tips: string[];
  }>;
}

const ROLE_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  sales: { label: "Sales", icon: "💼", color: "bg-green-100 text-green-700" },
  engineering: { label: "Engineering", icon: "💻", color: "bg-blue-100 text-blue-700" },
  product: { label: "Product", icon: "📊", color: "bg-purple-100 text-purple-700" },
  design: { label: "Design", icon: "🎨", color: "bg-pink-100 text-pink-700" },
  marketing: { label: "Marketing", icon: "📢", color: "bg-orange-100 text-orange-700" },
  data: { label: "Data/Analytics", icon: "📈", color: "bg-cyan-100 text-cyan-700" },
  operations: { label: "Operations", icon: "⚙️", color: "bg-gray-100 text-gray-700" },
  executive: { label: "Executive", icon: "👔", color: "bg-indigo-100 text-indigo-700" },
  other: { label: "General", icon: "📋", color: "bg-slate-100 text-slate-700" },
};

const STAGE_TYPE_OPTIONS = [
  { type: "phone_screen", name: "Phone Screen", icon: "📞" },
  { type: "recruiter_screen", name: "Recruiter Screen", icon: "📞" },
  { type: "hiring_manager", name: "Hiring Manager", icon: "👔" },
  { type: "technical", name: "Technical Interview", icon: "💻" },
  { type: "coding", name: "Coding Challenge", icon: "⌨️" },
  { type: "system_design", name: "System Design", icon: "🏗️" },
  { type: "behavioral", name: "Behavioral Interview", icon: "💬" },
  { type: "case_study", name: "Case Study", icon: "📊" },
  { type: "sales_demo", name: "Sales Demo/Roleplay", icon: "🎯" },
  { type: "presentation", name: "Presentation", icon: "📽️" },
  { type: "panel", name: "Panel Interview", icon: "👥" },
  { type: "take_home", name: "Take-Home Assignment", icon: "🏠" },
  { type: "portfolio", name: "Portfolio Review", icon: "🎨" },
  { type: "culture_fit", name: "Culture Fit", icon: "🤝" },
  { type: "final", name: "Final Round", icon: "🎯" },
];

const STAGE_TYPE_ICONS: Record<string, string> = Object.fromEntries(
  STAGE_TYPE_OPTIONS.map(opt => [opt.type, opt.icon])
);

const CARD_TYPE_STYLES: Record<string, { bg: string; icon: string; label: string; labelColor: string }> = {
  question: { bg: "bg-blue-50 border-blue-200", icon: "❓", label: "Question", labelColor: "bg-blue-100 text-blue-700" },
  tip: { bg: "bg-green-50 border-green-200", icon: "💡", label: "Tip", labelColor: "bg-green-100 text-green-700" },
  talking_point: { bg: "bg-purple-50 border-purple-200", icon: "💬", label: "Talking Point", labelColor: "bg-purple-100 text-purple-700" },
  star_story: { bg: "bg-amber-50 border-amber-200", icon: "⭐", label: "STAR Story", labelColor: "bg-amber-100 text-amber-700" },
};

export default function InterviewPrepTab({
  jobId,
  companyName,
  jobTitle,
  existingGuide,
}: InterviewPrepTabProps) {
  const [guide, setGuide] = useState<InterviewGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showCompanyResearch, setShowCompanyResearch] = useState(false);
  const [showQuestionsToAsk, setShowQuestionsToAsk] = useState(false);
  const [stages, setStages] = useState<InterviewStagePrep[]>([]);

  // Dropdown states
  const [showAddStageMenu, setShowAddStageMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showAddCardMenu, setShowAddCardMenu] = useState(false);

  // Loading states for individual actions
  const [refreshingStageId, setRefreshingStageId] = useState<string | null>(null);
  const [addingStageType, setAddingStageType] = useState<string | null>(null);
  const [generatingCards, setGeneratingCards] = useState(false);

  // Editing state for custom cards
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Refs for click outside
  const addStageRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const addCardRef = useRef<HTMLDivElement>(null);

  // Load reviewed cards from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`interview-prep-${jobId}-reviewed`);
    if (saved) {
      setReviewedCards(new Set(JSON.parse(saved)));
    }
  }, [jobId]);

  // Save reviewed cards to localStorage
  const saveReviewedCards = useCallback((cards: Set<string>) => {
    localStorage.setItem(`interview-prep-${jobId}-reviewed`, JSON.stringify([...cards]));
  }, [jobId]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addStageRef.current && !addStageRef.current.contains(event.target as Node)) {
        setShowAddStageMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
      if (addCardRef.current && !addCardRef.current.contains(event.target as Node)) {
        setShowAddCardMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Parse existing guide
  useEffect(() => {
    if (existingGuide) {
      try {
        const parsed = JSON.parse(existingGuide);
        setGuide(parsed);

        if (parsed.suggestedStages) {
          setStages(parsed.suggestedStages);
          if (parsed.suggestedStages.length > 0) {
            setActiveStageId(parsed.suggestedStages[0].id);
          }
        } else if (parsed.interviewRounds) {
          const convertedStages = convertLegacyRounds(parsed.interviewRounds);
          setStages(convertedStages);
          if (convertedStages.length > 0) {
            setActiveStageId(convertedStages[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to parse existing guide:", e);
      }
    }
  }, [existingGuide]);

  const convertLegacyRounds = (rounds: InterviewGuide["interviewRounds"]): InterviewStagePrep[] => {
    if (!rounds) return [];
    return rounds.map((round, idx) => ({
      id: `legacy-stage-${idx + 1}`,
      name: formatLegacyType(round.type),
      type: round.type,
      duration: round.typicalDuration,
      description: `Round ${round.round} of the interview process`,
      prepCards: [
        ...round.likelyQuestions.map((q, qIdx) => ({
          id: `legacy-${idx}-q-${qIdx}`,
          type: "question" as const,
          front: q,
          back: "Prepare a structured answer using specific examples from your experience",
          category: "questions",
        })),
        ...round.starAnswers.map((star, sIdx) => ({
          id: `legacy-${idx}-star-${sIdx}`,
          type: "star_story" as const,
          front: star.question,
          back: `S: ${star.situation}\nT: ${star.task}\nA: ${star.action}\nR: ${star.result}`,
          category: "behavioral",
        })),
      ],
      tips: round.tips,
    }));
  };

  const formatLegacyType = (type: string): string => {
    const opt = STAGE_TYPE_OPTIONS.find(o => o.type === type);
    return opt?.name || type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const generateGuide = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/interview-guide`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setGuide(data.guide);
        if (data.guide.suggestedStages) {
          setStages(data.guide.suggestedStages);
          if (data.guide.suggestedStages.length > 0) {
            setActiveStageId(data.guide.suggestedStages[0].id);
          }
        }
        showToast("success", "Interview guide generated!");
      } else {
        showToast("error", "Failed to generate guide");
      }
    } catch (error) {
      console.error("Failed to generate guide:", error);
      showToast("error", "Failed to generate guide");
    } finally {
      setLoading(false);
    }
  };

  // Add a new stage with AI-generated content
  const addStageWithContent = async (stageType: string, stageName: string) => {
    setAddingStageType(stageType);
    setShowAddStageMenu(false);

    try {
      const res = await fetch(`/api/jobs/${jobId}/interview-guide/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_stage",
          stageName,
          stageType,
          roleType: guide?.detectedRoleType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newStage = data.stage;
        setStages(prev => [...prev, newStage]);
        setActiveStageId(newStage.id);
        showToast("success", `Added ${stageName} stage`);
      } else {
        showToast("error", "Failed to add stage");
      }
    } catch (error) {
      console.error("Failed to add stage:", error);
      showToast("error", "Failed to add stage");
    } finally {
      setAddingStageType(null);
    }
  };

  // Refresh content for a specific stage
  const refreshStageContent = async (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    setRefreshingStageId(stageId);

    try {
      const res = await fetch(`/api/jobs/${jobId}/interview-guide/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_stage",
          stageName: stage.name,
          stageType: stage.type,
          roleType: guide?.detectedRoleType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStages(prev => prev.map(s =>
          s.id === stageId
            ? { ...data.stage, id: stageId, name: stage.name }
            : s
        ));
        showToast("success", `Refreshed ${stage.name} content`);
      } else {
        showToast("error", "Failed to refresh content");
      }
    } catch (error) {
      console.error("Failed to refresh stage:", error);
      showToast("error", "Failed to refresh content");
    } finally {
      setRefreshingStageId(null);
    }
  };

  // Generate more prep cards for active stage
  const generateMoreCards = async (cardType: "question" | "star_story" | "tip") => {
    const stage = stages.find(s => s.id === activeStageId);
    if (!stage) return;

    setGeneratingCards(true);
    setShowAddCardMenu(false);

    try {
      const res = await fetch(`/api/jobs/${jobId}/interview-guide/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_cards",
          stageName: stage.name,
          stageType: stage.type,
          cardType,
          existingCards: stage.prepCards.map(c => c.front),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cards && data.cards.length > 0) {
          setStages(prev => prev.map(s =>
            s.id === activeStageId
              ? { ...s, prepCards: [...s.prepCards, ...data.cards] }
              : s
          ));
          showToast("success", `Added ${data.cards.length} new cards`);
        } else {
          showToast("info", "No new cards generated");
        }
      } else {
        showToast("error", "Failed to generate cards");
      }
    } catch (error) {
      console.error("Failed to generate cards:", error);
      showToast("error", "Failed to generate cards");
    } finally {
      setGeneratingCards(false);
    }
  };

  // Add custom card manually
  const addCustomCard = (cardType: "question" | "tip" | "star_story") => {
    const stage = stages.find(s => s.id === activeStageId);
    if (!stage) return;

    const cardId = `custom-${Date.now()}`;
    const typeLabels: Record<string, string> = {
      question: "Enter your question here...",
      tip: "Enter your tip here...",
      star_story: "Enter the behavioral question here...",
    };
    const backLabels: Record<string, string> = {
      question: "Enter your answer or notes here...",
      tip: "Add any additional details...",
      star_story: "S: Situation\nT: Task\nA: Action\nR: Result",
    };

    const newCard: PrepCard = {
      id: cardId,
      type: cardType,
      front: typeLabels[cardType] || "New card",
      back: backLabels[cardType] || "Add notes...",
      category: "custom",
    };

    setStages(prev => prev.map(s =>
      s.id === activeStageId
        ? { ...s, prepCards: [...s.prepCards, newCard] }
        : s
    ));
    setShowAddCardMenu(false);
    // Auto-expand and start editing the new card
    setExpandedCards(prev => new Set([...prev, cardId]));
    setEditingCardId(cardId);
  };

  const removeStage = (stageId: string) => {
    if (stages.length <= 1) {
      showToast("error", "Cannot remove the last stage");
      return;
    }
    setStages(prev => prev.filter(s => s.id !== stageId));
    if (activeStageId === stageId) {
      const remaining = stages.filter(s => s.id !== stageId);
      setActiveStageId(remaining[0]?.id || null);
    }
    showToast("success", "Stage removed");
  };

  const removeCard = (cardId: string) => {
    setStages(prev => prev.map(s =>
      s.id === activeStageId
        ? { ...s, prepCards: s.prepCards.filter(c => c.id !== cardId) }
        : s
    ));
  };

  const updateCard = (cardId: string, field: "front" | "back", value: string) => {
    setStages(prev => prev.map(s =>
      s.id === activeStageId
        ? {
            ...s,
            prepCards: s.prepCards.map(c =>
              c.id === cardId ? { ...c, [field]: value } : c
            ),
          }
        : s
    ));
  };

  const startEditingCard = (cardId: string) => {
    setEditingCardId(cardId);
    // Auto-expand the card when editing
    setExpandedCards(prev => new Set([...prev, cardId]));
  };

  const stopEditingCard = () => {
    setEditingCardId(null);
  };

  const toggleCardReviewed = (cardId: string) => {
    const newReviewed = new Set(reviewedCards);
    if (newReviewed.has(cardId)) {
      newReviewed.delete(cardId);
    } else {
      newReviewed.add(cardId);
    }
    setReviewedCards(newReviewed);
    saveReviewedCards(newReviewed);
  };

  const toggleCardExpanded = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  // Calculate progress
  const totalCards = stages.reduce((sum, stage) => sum + stage.prepCards.length, 0);
  const reviewedCount = stages.reduce(
    (sum, stage) => sum + stage.prepCards.filter(c => reviewedCards.has(c.id)).length,
    0
  );
  const progressPercent = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

  const activeStage = stages.find(s => s.id === activeStageId);
  const roleType = guide?.detectedRoleType || "other";
  const roleInfo = ROLE_TYPE_LABELS[roleType] || ROLE_TYPE_LABELS.other;

  // Empty state
  if (!guide && !loading) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Interview Prep</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Get a personalized interview guide tailored to your role type. We&apos;ll analyze the job and suggest a realistic interview process with targeted prep materials.
        </p>
        <button
          onClick={generateGuide}
          className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Generate Interview Guide
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <svg className="w-8 h-8 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div>
            <p className="text-gray-700 font-medium">Analyzing role and generating your prep guide...</p>
            <p className="text-gray-500 text-sm mt-1">This may take 15-30 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Role Detection & Progress */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}>
              {roleInfo.icon} {roleInfo.label} Role
            </span>
            <span className="text-sm text-gray-500">{companyName}</span>
          </div>

          {/* Settings dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48 z-50">
                <button
                  onClick={() => {
                    generateGuide();
                    setShowSettingsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate All
                </button>
              </div>
            )}
          </div>
        </div>

        {guide?.processExplanation && (
          <p className="text-sm text-gray-600 mb-4">{guide.processExplanation}</p>
        )}

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {reviewedCount}/{totalCards} cards ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowCompanyResearch(!showCompanyResearch)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showCompanyResearch
              ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          🏢 Company Research
        </button>
        <button
          onClick={() => setShowQuestionsToAsk(!showQuestionsToAsk)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showQuestionsToAsk
              ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          ❓ Questions to Ask
        </button>
      </div>

      {/* Company Research Panel */}
      {showCompanyResearch && guide?.companyResearch && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">🏢 Company Research: {companyName}</h3>
          <div className="space-y-3 text-sm">
            {guide.companyResearch.overview && (
              <div>
                <span className="font-medium text-gray-700">Overview:</span>
                <p className="text-gray-600 mt-1">{guide.companyResearch.overview}</p>
              </div>
            )}
            {guide.companyResearch.culture && (
              <div>
                <span className="font-medium text-gray-700">Culture:</span>
                <p className="text-gray-600 mt-1">{guide.companyResearch.culture}</p>
              </div>
            )}
            {guide.companyResearch.recentNews && guide.companyResearch.recentNews.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Recent News:</span>
                <ul className="mt-1 space-y-1">
                  {guide.companyResearch.recentNews.map((news, idx) => (
                    <li key={idx} className="text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500">•</span> {news}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {guide.companyResearch.competitors && guide.companyResearch.competitors.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Competitors:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {guide.companyResearch.competitors.map((comp, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white rounded text-gray-600 text-xs">{comp}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Questions to Ask Panel */}
      {showQuestionsToAsk && guide?.questionsToAsk && guide.questionsToAsk.length > 0 && (
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <h3 className="font-semibold text-gray-900 mb-3">❓ Questions to Ask</h3>
          <div className="space-y-3">
            {guide.questionsToAsk.map((category, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-700 text-sm">{category.category}</span>
                  {category.bestAskedDuring && (
                    <span className="text-xs px-2 py-0.5 bg-white rounded text-indigo-600">
                      Best during: {category.bestAskedDuring}
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {category.questions.map((q, qIdx) => (
                    <li key={qIdx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-indigo-400">•</span> {q}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Stages */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Stage Tabs */}
        <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-2">
          {/* Scrollable tabs container */}
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {stages.map((stage) => {
              const stageReviewedCount = stage.prepCards.filter(c => reviewedCards.has(c.id)).length;
              const stageTotal = stage.prepCards.length;
              const isComplete = stageTotal > 0 && stageReviewedCount === stageTotal;
              const icon = STAGE_TYPE_ICONS[stage.type] || "📋";
              const isRefreshing = refreshingStageId === stage.id;

              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  disabled={isRefreshing}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeStageId === stage.id
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-100"
                  } ${isRefreshing ? "opacity-50" : ""}`}
                >
                  {isRefreshing ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span>{icon}</span>
                  )}
                  <span>{stage.name}</span>
                  {stageTotal > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isComplete ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {stageReviewedCount}/{stageTotal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add Stage Dropdown - outside scrollable area */}
          <div className="relative flex-shrink-0" ref={addStageRef}>
            <button
              onClick={() => setShowAddStageMenu(!showAddStageMenu)}
              disabled={!!addingStageType}
              className="flex items-center gap-1 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {addingStageType ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              <span>Add</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAddStageMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-56 z-[100] max-h-64 overflow-y-auto">
                {STAGE_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => addStageWithContent(opt.type, opt.name)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stage Content */}
        {activeStage && (
          <div className="p-4">
            {/* Stage Header with Actions */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{STAGE_TYPE_ICONS[activeStage.type] || "📋"}</span>
                  <h3 className="font-semibold text-gray-900">{activeStage.name}</h3>
                  <span className="text-sm text-gray-500">({activeStage.duration})</span>
                </div>
                <p className="text-sm text-gray-600">{activeStage.description}</p>
              </div>

              {/* Per-stage actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => refreshStageContent(activeStage.id)}
                  disabled={refreshingStageId === activeStage.id}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh content"
                >
                  <svg className={`w-4 h-4 ${refreshingStageId === activeStage.id ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => removeStage(activeStage.id)}
                  disabled={stages.length <= 1}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                  title="Remove stage"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tips */}
            {activeStage.tips && activeStage.tips.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">💡 Tips for this stage</h4>
                <ul className="space-y-1">
                  {activeStage.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-yellow-700 flex items-start gap-2">
                      <span>•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prep Cards Header with Add Button */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Prep Cards ({activeStage.prepCards.filter(c => reviewedCards.has(c.id)).length}/{activeStage.prepCards.length} reviewed)
              </h4>

              {/* Add Card Dropdown */}
              <div className="relative" ref={addCardRef}>
                <button
                  onClick={() => setShowAddCardMenu(!showAddCardMenu)}
                  disabled={generatingCards}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {generatingCards ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <span>Add Card</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAddCardMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48 z-50">
                    <button
                      onClick={() => addCustomCard("question")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      ❓ Question
                    </button>
                    <button
                      onClick={() => addCustomCard("star_story")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      ⭐ STAR Story
                    </button>
                    <button
                      onClick={() => addCustomCard("tip")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      💡 Tip
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Prep Cards */}
            {activeStage.prepCards.length > 0 ? (
              <div className="space-y-3">
                {activeStage.prepCards.map((card) => {
                  const isReviewed = reviewedCards.has(card.id);
                  const isExpanded = expandedCards.has(card.id);
                  const isEditing = editingCardId === card.id;
                  const cardStyle = CARD_TYPE_STYLES[card.type] || CARD_TYPE_STYLES.question;

                  return (
                    <div
                      key={card.id}
                      className={`rounded-lg border p-3 transition-all ${cardStyle.bg} ${isReviewed ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${cardStyle.labelColor}`}>
                              {cardStyle.icon} {cardStyle.label}
                            </span>
                            {card.category && (
                              <span className="text-xs text-gray-500">{card.category}</span>
                            )}
                          </div>

                          {isEditing ? (
                            <input
                              type="text"
                              value={card.front}
                              onChange={(e) => updateCard(card.id, "front", e.target.value)}
                              className="w-full font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Enter question or title..."
                              autoFocus
                            />
                          ) : (
                            <p
                              className={`font-medium text-gray-900 ${card.category === "custom" ? "cursor-pointer hover:text-purple-700" : ""}`}
                              onClick={() => card.category === "custom" && startEditingCard(card.id)}
                            >
                              {card.front}
                            </p>
                          )}

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              {isEditing ? (
                                <textarea
                                  value={card.back}
                                  onChange={(e) => updateCard(card.id, "back", e.target.value)}
                                  className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                                  placeholder="Enter answer or notes..."
                                />
                              ) : (
                                <p
                                  className={`text-sm text-gray-700 whitespace-pre-line ${card.category === "custom" ? "cursor-pointer hover:text-purple-700" : ""}`}
                                  onClick={() => card.category === "custom" && startEditingCard(card.id)}
                                >
                                  {card.back}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <button
                              onClick={stopEditingCard}
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                              title="Done editing"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleCardExpanded(card.id)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded"
                              >
                                <svg
                                  className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => toggleCardReviewed(card.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  isReviewed
                                    ? "bg-green-100 text-green-600"
                                    : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                }`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => removeCard(card.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No prep cards for this stage yet.</p>
                <button
                  onClick={() => setShowAddCardMenu(true)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Add some cards to get started
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* General Tips */}
      {guide?.generalTips && guide.generalTips.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">💡 General Tips</h3>
          <ul className="space-y-2">
            {guide.generalTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
