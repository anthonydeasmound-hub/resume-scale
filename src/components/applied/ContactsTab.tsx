"use client";

import React, { useState, useEffect } from "react";
import { showToast } from "@/components/Toast";

interface Contact {
  id: number;
  job_id: number;
  name: string;
  email: string | null;
  title: string | null;
  phone: string | null;
  linkedin: string | null;
  company: string | null;
  notes: string | null;
  is_primary: boolean;
  source: string | null;
  created_at: string;
}

interface ContactsTabProps {
  jobId: number;
  companyName: string;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  recruiterTitle?: string | null;
}

export default function ContactsTab({
  jobId,
  companyName,
  recruiterName,
  recruiterEmail,
  recruiterTitle,
}: ContactsTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    phone: "",
    linkedin: "",
    notes: "",
    is_primary: false,
  });

  useEffect(() => {
    fetchContacts();
  }, [jobId]);

  // If we have legacy recruiter info but no contacts, offer to import it
  useEffect(() => {
    if (!loading && contacts.length === 0 && recruiterName) {
      // Auto-create a contact from legacy recruiter info
      createContactFromRecruiter();
    }
  }, [loading, contacts.length, recruiterName]);

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/contacts`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const createContactFromRecruiter = async () => {
    if (!recruiterName) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recruiterName,
          email: recruiterEmail || "",
          title: recruiterTitle || "",
          company: companyName,
          is_primary: true,
          source: "job_posting",
        }),
      });
      if (res.ok) {
        const newContact = await res.json();
        setContacts([newContact]);
      }
    } catch (error) {
      console.error("Failed to create contact from recruiter:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingContact) {
        // Update existing contact
        const res = await fetch(`/api/jobs/${jobId}/contacts/${editingContact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setContacts(contacts.map((c) => (c.id === updated.id ? updated : c)));
          showToast("success", "Contact updated");
        }
      } else {
        // Create new contact
        const res = await fetch(`/api/jobs/${jobId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            company: companyName,
          }),
        });
        if (res.ok) {
          const newContact = await res.json();
          setContacts([...contacts, newContact]);
          showToast("success", "Contact added");
        }
      }
      resetForm();
    } catch (error) {
      console.error("Failed to save contact:", error);
      showToast("error", "Failed to save contact");
    }
  };

  const deleteContact = async (contactId: number) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setContacts(contacts.filter((c) => c.id !== contactId));
        showToast("success", "Contact deleted");
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
      showToast("error", "Failed to delete contact");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      title: "",
      phone: "",
      linkedin: "",
      notes: "",
      is_primary: false,
    });
    setShowAddForm(false);
    setEditingContact(null);
  };

  const startEditing = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || "",
      title: contact.title || "",
      phone: contact.phone || "",
      linkedin: contact.linkedin || "",
      notes: contact.notes || "",
      is_primary: contact.is_primary,
    });
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contacts</h3>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 text-sm text-brand-blue hover:text-brand-blue-dark"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name *"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                required
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Title (e.g., Recruiter)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <input
                type="url"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="LinkedIn URL"
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes..."
                rows={2}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                />
                Primary contact
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-sm bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark"
                >
                  {editingContact ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Contact List */}
        {contacts.length === 0 && !showAddForm ? (
          <p className="text-gray-500 text-sm">No contacts added yet.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  contact.is_primary ? "border-brand-blue bg-blue-50" : "border-gray-200 bg-white"
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 font-medium">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    {contact.is_primary && (
                      <span className="text-xs bg-brand-blue text-white px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  {contact.title && (
                    <p className="text-sm text-gray-600">{contact.title}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-1 text-sm">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-brand-blue hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {contact.phone}
                      </a>
                    )}
                    {contact.linkedin && (
                      <a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>
                    )}
                  </div>
                  {contact.notes && (
                    <p className="text-sm text-gray-500 mt-2 italic">{contact.notes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditing(contact)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
