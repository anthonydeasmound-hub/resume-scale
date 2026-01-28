"use client";

interface SkillsSectionProps {
  expandedSection: "summary" | "experience" | "skills" | null;
  toggleSection: (section: "summary" | "experience" | "skills") => void;
  loadingSkills: boolean;
  selectedSkills: string[];
  skillsFromResume: string[];
  skillsFromJobDescription: string[];
  recommendedSkills: string[];
  onToggleSkill: (skill: string) => void;
}

export default function SkillsSection({
  expandedSection,
  toggleSection,
  loadingSkills,
  selectedSkills,
  skillsFromResume,
  skillsFromJobDescription,
  recommendedSkills,
  onToggleSkill,
}: SkillsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={() => toggleSection("skills")}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
            selectedSkills.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {selectedSkills.length > 0 ? "\u2713" : "3"}
          </div>
          <span className="font-medium text-gray-900">Skills</span>
          {selectedSkills.length > 0 && (
            <span className="text-sm text-gray-500">({selectedSkills.length} selected)</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === "skills" ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expandedSection === "skills" && (
        <div className="px-4 pb-4 border-t">
          {loadingSkills ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-500">Analyzing skills for this role...</p>
            </div>
          ) : (
            <div className="pt-3">
              {/* Selected skills at top */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Selected ({selectedSkills.length}) - click to remove:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No skills selected yet</p>
                  ) : (
                    selectedSkills.map((skill) => {
                      const isFromResume = skillsFromResume.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => onToggleSkill(skill)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            isFromResume
                              ? "bg-blue-100 text-brand-blue border-2 border-blue-400"
                              : "bg-purple-100 text-purple-700 border-2 border-purple-400"
                          }`}
                        >
                          {skill} {"\u2715"}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Skills from Job Description - Most Important */}
              {skillsFromJobDescription.filter(s => !selectedSkills.includes(s)).length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-xs font-medium text-amber-700">Required in Job Description - click to add:</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillsFromJobDescription
                      .filter(skill => !selectedSkills.includes(skill))
                      .map((skill) => (
                        <button
                          key={skill}
                          onClick={() => onToggleSkill(skill)}
                          className="px-3 py-1 rounded-full text-sm transition-colors bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 font-medium"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Unselected skills from resume */}
              {skillsFromResume.filter(s => !selectedSkills.includes(s)).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">From your resume - click to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {skillsFromResume
                      .filter(skill => !selectedSkills.includes(skill))
                      .map((skill) => (
                        <button
                          key={skill}
                          onClick={() => onToggleSkill(skill)}
                          className="px-3 py-1 rounded-full text-sm transition-colors bg-gray-100 text-gray-600 border border-gray-200 hover:border-blue-300 hover:bg-brand-blue-light"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* AI recommended skills */}
              {recommendedSkills.filter(s => !selectedSkills.includes(s)).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-purple-600 mb-2">AI Suggestions - click to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendedSkills
                      .filter(skill => !selectedSkills.includes(skill))
                      .map((skill) => (
                        <button
                          key={skill}
                          onClick={() => onToggleSkill(skill)}
                          className="px-3 py-1 rounded-full text-sm transition-colors bg-gray-100 text-gray-600 border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                        >
                          + {skill}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
