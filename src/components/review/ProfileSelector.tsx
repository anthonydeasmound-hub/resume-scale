"use client";

import { useState, useRef, useEffect } from "react";
import { Profile } from "@/components/master-resume/types";

interface ProfileSelectorProps {
  profiles: Profile[];
  selectedProfileId: number | null;
  onSelect: (profileId: number) => void;
  disabled?: boolean;
}

export default function ProfileSelector({
  profiles,
  selectedProfileId,
  onSelect,
  disabled = false,
}: ProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (profiles.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Source Profile:</span>

        <div className="relative flex-1" ref={dropdownRef}>
          <button
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full flex items-center justify-between gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg transition-colors ${
              disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
          >
            <span className="truncate font-medium text-gray-900">
              {selectedProfile?.name || "Select Profile"}
              {selectedProfile?.is_primary && (
                <span className="ml-2 text-xs bg-brand-gold text-gray-900 px-2 py-0.5 rounded-full">
                  Primary
                </span>
              )}
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && !disabled && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => {
                    onSelect(profile.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                    profile.id === selectedProfileId ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="truncate text-gray-900">{profile.name}</span>
                  {profile.is_primary && (
                    <span className="text-xs bg-brand-gold text-gray-900 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Primary
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProfile?.description && (
        <p className="mt-2 text-sm text-gray-500 pl-24">{selectedProfile.description}</p>
      )}

      <p className="mt-2 text-xs text-gray-400 pl-24">
        Using &quot;{selectedProfile?.name || "selected"}&quot; profile for tailoring
      </p>
    </div>
  );
}
