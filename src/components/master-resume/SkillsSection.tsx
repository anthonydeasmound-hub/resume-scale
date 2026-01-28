"use client";

interface SkillsSectionProps {
  skills: string[];
  newSkill: string;
  onNewSkillChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (skill: string) => void;
}

export default function SkillsSection({ skills, newSkill, onNewSkillChange, onAdd, onRemove }: SkillsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Skills</h2>

      {/* Add Skill Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => onNewSkillChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-gray-900"
          placeholder="Add a skill..."
        />
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-brand-gold text-gray-900 rounded-lg hover:bg-brand-gold-dark transition-colors"
        >
          Add
        </button>
      </div>

      {/* Skills Tags */}
      {skills.length === 0 ? (
        <p className="text-gray-500 text-sm">No skills added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-brand-blue rounded-full text-sm"
            >
              {skill}
              <button
                onClick={() => onRemove(skill)}
                className="hover:text-blue-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
