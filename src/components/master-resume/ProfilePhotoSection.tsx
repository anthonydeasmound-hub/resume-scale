"use client";

import Image from "next/image";

interface ProfilePhotoSectionProps {
  profilePhotoPath: string | null;
  uploadingPhoto: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
}

export default function ProfilePhotoSection({ profilePhotoPath, uploadingPhoto, onUpload, onDelete }: ProfilePhotoSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Photo</h2>
      <p className="text-gray-500 text-sm mb-4">This photo is displayed in your dashboard only, not on generated resumes.</p>

      <div className="flex items-center gap-6">
        {profilePhotoPath ? (
          <div className="relative">
            <Image
              src={profilePhotoPath}
              alt="Profile"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
            <button
              onClick={onDelete}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

        <div>
          <label className="cursor-pointer">
            <span className="px-4 py-2 bg-brand-gold text-gray-900 rounded-lg hover:bg-brand-gold-dark transition-colors inline-block">
              {uploadingPhoto ? "Uploading..." : profilePhotoPath ? "Change Photo" : "Upload Photo"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onUpload}
              disabled={uploadingPhoto}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-400 mt-2">JPEG, PNG, or WebP. Max 5MB.</p>
        </div>
      </div>
    </div>
  );
}
