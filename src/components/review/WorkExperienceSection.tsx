"use client";

import React from "react";
import { MasterResume, SelectedRole } from "./types";

interface WorkExperienceSectionProps {
  expandedSection: "summary" | "experience" | "skills" | null;
  toggleSection: (section: "summary" | "experience" | "skills") => void;
  masterResume: MasterResume;
  selectedRoles: SelectedRole[];
  totalSelectedBullets: number;
  maxTotalBullets: number;
  initialSuggestionsShown: number;
  expandedBulletOptions: Record<number, boolean>;
  editingBulletKey: string | null;
  editingBulletText: string;
  editedBullets: Record<string, string>;
  draggedBullet: { roleIndex: number; selectedIndex: number } | null;
  dragOverIndex: number | null;
  getBulletText: (roleIndex: number, bulletIndex: number, bulletOptions: string[]) => string;
  onToggleBullet: (roleIndex: number, bulletIndex: number) => void;
  onStartEditingBullet: (roleIndex: number, bulletIndex: number, currentText: string) => void;
  onSaveEditedBullet: () => void;
  onCancelEditingBullet: () => void;
  onSetEditingBulletText: (text: string) => void;
  onSetExpandedBulletOptions: (updater: (prev: Record<number, boolean>) => Record<number, boolean>) => void;
  onDragStart: (roleIndex: number, selectedIndex: number) => void;
  onDragOver: (e: React.DragEvent, targetIndex: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, roleIndex: number, targetIndex: number) => void;
  onDragEnd: () => void;
}

export default function WorkExperienceSection({
  expandedSection,
  toggleSection,
  masterResume,
  selectedRoles,
  totalSelectedBullets,
  maxTotalBullets,
  initialSuggestionsShown,
  expandedBulletOptions,
  editingBulletKey,
  editingBulletText,
  editedBullets,
  draggedBullet,
  dragOverIndex,
  getBulletText,
  onToggleBullet,
  onStartEditingBullet,
  onSaveEditedBullet,
  onCancelEditingBullet,
  onSetEditingBulletText,
  onSetExpandedBulletOptions,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: WorkExperienceSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={() => toggleSection("experience")}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
            selectedRoles.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {selectedRoles.length > 0 ? "\u2713" : "2"}
          </div>
          <span className="font-medium text-gray-900">Work Experience</span>
          {selectedRoles.length > 0 && (
            <span className="text-sm text-gray-500">({selectedRoles.length} role{selectedRoles.length > 1 ? "s" : ""} selected)</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === "experience" ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expandedSection === "experience" && masterResume && (
        <div className="px-4 pb-4 border-t">
          <p className="text-sm text-gray-600 py-3">
            Select bullets for your resume ({totalSelectedBullets}/{maxTotalBullets} selected):
          </p>

          <div className="space-y-3">
            {selectedRoles.length === 0 ? (
              <div className="py-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-gray-500">Generating bullet options for your roles...</p>
              </div>
            ) : (
              selectedRoles.map((selectedRole) => {
                const role = masterResume.work_experience[selectedRole.roleIndex];
                if (!role) return null;

                // Get unselected bullets (AI alternatives not yet selected)
                const unselectedBullets = selectedRole.bulletOptions
                  .map((bullet, idx) => ({ bullet, idx }))
                  .filter(({ idx }) => !selectedRole.selectedBullets.includes(idx));

                return (
                  <div key={selectedRole.roleIndex} className="rounded-lg border border-blue-500">
                    <div className="px-3 py-2 bg-brand-blue-light border-b border-brand-blue">
                      <div className="font-medium text-gray-900">{role.title}</div>
                      <div className="text-sm text-gray-500">{role.company} | {role.start_date} - {role.end_date}</div>
                    </div>

                    <div className="px-3 pb-3 bg-gray-50">
                      {selectedRole.loadingBullets ? (
                        <div className="py-4 text-center">
                          <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                          <p className="text-xs text-gray-500">Loading AI alternatives...</p>
                        </div>
                      ) : (
                        <div className="pt-3">
                          {/* Selected bullets at top */}
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-600 mb-2">
                              Selected ({selectedRole.selectedBullets.length}) - drag to reorder, click edit to modify:
                            </p>
                            <div className="space-y-2">
                              {selectedRole.selectedBullets.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No bullets selected yet</p>
                              ) : (
                                selectedRole.selectedBullets.map((bulletIdx, selectedIndex) => {
                                  const bulletText = getBulletText(selectedRole.roleIndex, bulletIdx, selectedRole.bulletOptions);
                                  const isFromMaster = bulletIdx < selectedRole.masterBullets.length;
                                  const editKey = `${selectedRole.roleIndex}-${bulletIdx}`;
                                  const isEditing = editingBulletKey === editKey;
                                  const isEdited = editedBullets[editKey] !== undefined;
                                  const isDragging = draggedBullet?.roleIndex === selectedRole.roleIndex && draggedBullet?.selectedIndex === selectedIndex;
                                  const isDragOver = draggedBullet?.roleIndex === selectedRole.roleIndex && dragOverIndex === selectedIndex;

                                  return (
                                    <div
                                      key={bulletIdx}
                                      draggable={!isEditing}
                                      onDragStart={() => onDragStart(selectedRole.roleIndex, selectedIndex)}
                                      onDragOver={(e) => onDragOver(e, selectedIndex)}
                                      onDragLeave={onDragLeave}
                                      onDrop={(e) => onDrop(e, selectedRole.roleIndex, selectedIndex)}
                                      onDragEnd={onDragEnd}
                                      className={`p-2 rounded border-2 text-sm transition-all ${
                                        isFromMaster ? "border-blue-400 bg-brand-blue-light" : "border-purple-400 bg-purple-50"
                                      } ${isEdited ? "ring-2 ring-green-300" : ""} ${
                                        isDragging ? "opacity-50 scale-95" : ""
                                      } ${isDragOver ? "border-dashed border-gray-500 bg-gray-100" : ""}`}
                                    >
                                      {isEditing ? (
                                        /* Editing mode */
                                        <div className="space-y-2">
                                          <textarea
                                            value={editingBulletText}
                                            onChange={(e) => onSetEditingBulletText(e.target.value)}
                                            className="w-full p-2 border rounded text-sm resize-none"
                                            rows={3}
                                            autoFocus
                                          />
                                          <div className="flex justify-end gap-2">
                                            <button
                                              onClick={onCancelEditingBullet}
                                              className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              onClick={onSaveEditedBullet}
                                              className="px-2 py-1 text-xs bg-brand-gold text-gray-900 rounded hover:bg-brand-gold-dark"
                                            >
                                              Save
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        /* Display mode */
                                        <div className="flex items-start gap-2">
                                          {/* Drag handle */}
                                          <div
                                            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-0.5"
                                            title="Drag to reorder"
                                          >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                                            </svg>
                                          </div>
                                          {/* Checkbox */}
                                          <div
                                            onClick={() => onToggleBullet(selectedRole.roleIndex, bulletIdx)}
                                            className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer ${
                                              isFromMaster ? "bg-brand-blue-light0" : "bg-purple-500"
                                            }`}
                                            title="Click to remove"
                                          >
                                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          {/* Bullet text */}
                                          <span className="text-gray-700 flex-1">{bulletText}</span>
                                          {/* Labels and edit button */}
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            {isEdited && (
                                              <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-600">
                                                Edited
                                              </span>
                                            )}
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${isFromMaster ? "bg-blue-100 text-brand-blue" : "bg-purple-100 text-purple-600"}`}>
                                              {isFromMaster ? "Resume" : "AI"}
                                            </span>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); onStartEditingBullet(selectedRole.roleIndex, bulletIdx, bulletText); }}
                                              className="p-1 text-gray-500 hover:text-brand-blue hover:bg-brand-blue-light rounded"
                                              title="Edit bullet"
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Unselected bullets below */}
                          {unselectedBullets.length > 0 && (
                            <div>
                              {(() => {
                                const isMaxReached = totalSelectedBullets >= maxTotalBullets;
                                const isExpanded = expandedBulletOptions[selectedRole.roleIndex];
                                const bulletsToShow = isExpanded
                                  ? unselectedBullets
                                  : unselectedBullets.slice(0, initialSuggestionsShown);
                                const hasMoreOptions = unselectedBullets.length > initialSuggestionsShown;

                                return (
                                  <>
                                    <p className="text-xs font-medium text-purple-600 mb-2">
                                      Available options - click to add:
                                    </p>
                                    {isMaxReached && (
                                      <p className="text-xs text-amber-600 mb-2">
                                        Maximum {maxTotalBullets} bullets reached - remove one to add more
                                      </p>
                                    )}
                                    <div className="space-y-2">
                                      {bulletsToShow.map(({ bullet, idx }) => {
                                        const isFromMaster = idx < selectedRole.masterBullets.length;
                                        return (
                                          <div
                                            key={idx}
                                            onClick={() => !isMaxReached && onToggleBullet(selectedRole.roleIndex, idx)}
                                            className={`p-2 rounded border cursor-pointer text-sm transition-colors ${
                                              isMaxReached
                                                ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                                                : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                                            }`}
                                          >
                                            <div className="flex items-start gap-2">
                                              <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                                              <span className="text-gray-700 flex-1">{bullet}</span>
                                              <span className={`text-xs px-1.5 py-0.5 rounded ${isFromMaster ? "bg-gray-100 text-gray-500" : "bg-purple-50 text-purple-500"}`}>
                                                {isFromMaster ? "Resume" : "AI"}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {hasMoreOptions && !isExpanded && (
                                      <button
                                        onClick={() => onSetExpandedBulletOptions(prev => ({ ...prev, [selectedRole.roleIndex]: true }))}
                                        className="w-full py-2 mt-2 text-sm text-purple-600 hover:text-purple-700 flex items-center justify-center gap-1"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        Load more options ({unselectedBullets.length - initialSuggestionsShown} more)
                                      </button>
                                    )}
                                    {isExpanded && hasMoreOptions && (
                                      <button
                                        onClick={() => onSetExpandedBulletOptions(prev => ({ ...prev, [selectedRole.roleIndex]: false }))}
                                        className="w-full py-2 mt-2 text-sm text-gray-500 hover:text-gray-600 flex items-center justify-center gap-1"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                        Show less
                                      </button>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
