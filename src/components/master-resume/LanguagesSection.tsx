"use client";

interface LanguagesSectionProps {
  languages: string[];
  newLanguage: string;
  onNewLanguageChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (language: string) => void;
}

export default function LanguagesSection({ languages, newLanguage, onNewLanguageChange, onAdd, onRemove }: LanguagesSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Languages</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newLanguage}
          onChange={(e) => onNewLanguageChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-gray-900"
          placeholder="Add a language..."
        />
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-brand-gold text-gray-900 rounded-lg hover:bg-brand-gold-dark transition-colors"
        >
          Add
        </button>
      </div>

      {languages.length === 0 ? (
        <p className="text-gray-500 text-sm">No languages added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {languages.map((language, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
            >
              {language}
              <button onClick={() => onRemove(language)} className="hover:text-indigo-900">
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
