"use client";

import { useState, useRef, useEffect } from "react";
import { Profile } from "./types";

interface ProfileSwitcherProps {
  profiles: Profile[];
  currentProfileId: number;
  onSelect: (id: number) => void;
  onCreateNew: () => void;
  onRename: (id: number, newName: string) => void;
  onDelete: (id: number) => void;
  onSetPrimary: (id: number) => void;
}

export default function ProfileSwitcher({
  profiles,
  currentProfileId,
  onSelect,
  onCreateNew,
  onRename,
  onDelete,
  onSetPrimary,
}: ProfileSwitcherProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const currentProfile = profiles.find((p) => p.id === currentProfileId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenFor(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus rename input when renaming starts
  useEffect(() => {
    if (renamingId !== null && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleStartRename = (profile: Profile) => {
    setRenamingId(profile.id);
    setRenameValue(profile.name);
    setMenuOpenFor(null);
  };

  const handleConfirmRename = () => {
    if (renamingId !== null && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirmRename();
    } else if (e.key === "Escape") {
      handleCancelRename();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-medium text-gray-600">Profile:</span>

          {/* Dropdown Trigger */}
          <div className="relative flex-1 max-w-xs" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="truncate font-medium text-gray-900">
                {currentProfile?.name || "Select Profile"}
                {currentProfile?.is_primary && (
                  <span className="ml-2 text-xs bg-brand-gold text-gray-900 px-2 py-0.5 rounded-full">
                    Primary
                  </span>
                )}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`relative flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                      profile.id === currentProfileId ? "bg-blue-50" : ""
                    }`}
                  >
                    {renamingId === profile.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleConfirmRename}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-2 py-1 border border-brand-blue rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        maxLength={100}
                      />
                    ) : (
                      <>
                        <div
                          className="flex-1 flex items-center gap-2"
                          onClick={() => {
                            onSelect(profile.id);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <span className="truncate text-gray-900">{profile.name}</span>
                          {profile.is_primary && (
                            <span className="text-xs bg-brand-gold text-gray-900 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Primary
                            </span>
                          )}
                        </div>

                        {/* Kebab Menu */}
                        <div className="relative" ref={menuOpenFor === profile.id ? menuRef : null}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenFor(menuOpenFor === profile.id ? null : profile.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>

                          {menuOpenFor === profile.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRename(profile);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Rename
                              </button>
                              {!profile.is_primary && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSetPrimary(profile.id);
                                      setMenuOpenFor(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Set as Primary
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(profile.id);
                                      setMenuOpenFor(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* New Profile Button */}
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Profile
        </button>
      </div>

      {/* Profile Description */}
      {currentProfile?.description && (
        <p className="mt-2 text-sm text-gray-500">{currentProfile.description}</p>
      )}
    </div>
  );
}
