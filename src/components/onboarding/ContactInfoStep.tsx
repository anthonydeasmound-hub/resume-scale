"use client";

import { LinkedInData, Step } from "./types";

interface ContactInfoStepProps {
  editableData: LinkedInData;
  setEditableData: (data: LinkedInData) => void;
  setStep: (step: Step) => void;
}

export default function ContactInfoStep({
  editableData,
  setEditableData,
  setStep,
}: ContactInfoStepProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Contact Information</h2>
          <p className="text-gray-600 text-sm">How can employers reach you?</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            id="contact-name"
            type="text"
            value={editableData.contact_info.name}
            onChange={(e) => {
              const updated = { ...editableData };
              updated.contact_info.name = e.target.value;
              setEditableData(updated);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="John Doe"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="contact-email"
              type="email"
              value={editableData.contact_info.email}
              onChange={(e) => {
                const updated = { ...editableData };
                updated.contact_info.email = e.target.value;
                setEditableData(updated);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              id="contact-phone"
              type="tel"
              value={editableData.contact_info.phone}
              onChange={(e) => {
                const updated = { ...editableData };
                updated.contact_info.phone = e.target.value;
                setEditableData(updated);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        <div>
          <label htmlFor="contact-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            id="contact-location"
            type="text"
            value={editableData.contact_info.location}
            onChange={(e) => {
              const updated = { ...editableData };
              updated.contact_info.location = e.target.value;
              setEditableData(updated);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="San Francisco, CA"
          />
        </div>
        <div>
          <label htmlFor="contact-linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn (optional)</label>
          <input
            id="contact-linkedin"
            type="url"
            value={editableData.contact_info.linkedin}
            onChange={(e) => {
              const updated = { ...editableData };
              updated.contact_info.linkedin = e.target.value;
              setEditableData(updated);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            placeholder="linkedin.com/in/johndoe"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep("template")}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep("work-experience")}
          className="flex-1 bg-brand-gold text-gray-900 py-3 rounded-lg font-medium hover:bg-brand-gold-dark transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
