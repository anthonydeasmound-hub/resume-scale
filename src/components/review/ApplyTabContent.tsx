"use client";

import { useState, useEffect } from "react";

interface Contact {
  id: number;
  name: string;
  email: string | null;
  title: string | null;
  is_primary: boolean;
}

interface FollowUpData {
  id: number;
  job_id: number;
  contact_id: number | null;
  enabled: boolean;
  email_1_subject: string | null;
  email_1_body: string | null;
  email_1_scheduled: string | null;
  email_1_sent_at: string | null;
  email_2_subject: string | null;
  email_2_body: string | null;
  email_2_scheduled: string | null;
  email_2_sent_at: string | null;
  email_3_subject: string | null;
  email_3_body: string | null;
  email_3_scheduled: string | null;
  email_3_sent_at: string | null;
  auto_archive_date: string | null;
  archived_at: string | null;
}

interface EmailTemplate {
  id: number;
  name: string;
  template_type: string;
  subject: string;
  body: string;
  is_default: boolean;
}

interface ApplyTabContentProps {
  jobId: number;
  companyName: string;
  jobTitle: string;
  applicationUrl: string;
  onApplicationUrlChange: (url: string) => void;
  hasResume: boolean;
  hasCoverLetter: boolean;
  dateApplied: string | null;
  onDownloadResume: () => void;
  onDownloadCoverLetter: () => void;
  onCopyCoverLetter: () => void;
  onMarkAsApplied: () => void;
  onGoToCoverLetter: () => void;
  downloadDisabled: boolean;
  showToast: (type: "success" | "error", message: string) => void;
}

export default function ApplyTabContent({
  jobId,
  companyName,
  jobTitle,
  applicationUrl,
  onApplicationUrlChange,
  hasResume,
  hasCoverLetter,
  dateApplied,
  onDownloadResume,
  onDownloadCoverLetter,
  onCopyCoverLetter,
  onMarkAsApplied,
  onGoToCoverLetter,
  downloadDisabled,
  showToast,
}: ApplyTabContentProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpData, setFollowUpData] = useState<FollowUpData | null>(null);
  const [generatingEmails, setGeneratingEmails] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState<number | null>(null);

  // Email editing state
  const [emails, setEmails] = useState<{
    [key: number]: { subject: string; body: string };
  }>({
    1: { subject: "", body: "" },
    2: { subject: "", body: "" },
    3: { subject: "", body: "" },
  });

  // Add contact form state
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactTitle, setNewContactTitle] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  // Email templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState<number | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const hasApplicationUrl = applicationUrl && applicationUrl.trim().length > 0;
  const isApplied = !!dateApplied;

  // Calculate follow-up dates based on application date
  const getFollowUpDates = () => {
    const baseDate = dateApplied ? new Date(dateApplied) : new Date();
    const week1 = new Date(baseDate);
    week1.setDate(week1.getDate() + 7);
    const week2 = new Date(baseDate);
    week2.setDate(week2.getDate() + 14);
    const week3 = new Date(baseDate);
    week3.setDate(week3.getDate() + 21);
    const week4 = new Date(baseDate);
    week4.setDate(week4.getDate() + 28);

    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return {
      week1: formatDate(week1),
      week2: formatDate(week2),
      week3: formatDate(week3),
      week4: formatDate(week4),
    };
  };

  const followUpDates = getFollowUpDates();

  // Fetch contacts, follow-up data, and templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contacts
        const contactsRes = await fetch(`/api/jobs/${jobId}/contacts`);
        if (contactsRes.ok) {
          const contactsData = await contactsRes.json();
          setContacts(contactsData);
          const primaryContact = contactsData.find((c: Contact) => c.is_primary && c.email);
          const firstWithEmail = contactsData.find((c: Contact) => c.email);
          if (primaryContact) {
            setSelectedContactId(primaryContact.id);
          } else if (firstWithEmail) {
            setSelectedContactId(firstWithEmail.id);
          }
        }

        // Fetch existing follow-up data
        const followUpRes = await fetch(`/api/jobs/${jobId}/follow-ups`);
        if (followUpRes.ok) {
          const data = await followUpRes.json();
          if (data) {
            setFollowUpData(data);
            setFollowUpEnabled(data.enabled);
            if (data.contact_id) {
              setSelectedContactId(data.contact_id);
            }
            // Populate email state
            setEmails({
              1: { subject: data.email_1_subject || "", body: data.email_1_body || "" },
              2: { subject: data.email_2_subject || "", body: data.email_2_body || "" },
              3: { subject: data.email_3_subject || "", body: data.email_3_body || "" },
            });
          }
        }

        // Fetch saved templates
        const templatesRes = await fetch(`/api/email-templates?type=follow_up`);
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingContacts(false);
      }
    };
    fetchData();
  }, [jobId]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId);
  const contactsWithEmail = contacts.filter((c) => c.email);
  const canEnableFollowUp = contactsWithEmail.length > 0;

  const handleApply = () => {
    if (!hasApplicationUrl) {
      showToast("error", "Please add an application URL first");
      return;
    }
    window.open(applicationUrl, "_blank");
  };

  const generateEmails = async () => {
    if (!selectedContactId) {
      showToast("error", "Please select a contact first");
      return;
    }

    setGeneratingEmails(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/follow-ups/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: selectedContactId }),
      });

      if (res.ok) {
        const data = await res.json();
        setEmails({
          1: { subject: data.emails.email_1.subject, body: data.emails.email_1.body },
          2: { subject: data.emails.email_2.subject, body: data.emails.email_2.body },
          3: { subject: data.emails.email_3.subject, body: data.emails.email_3.body },
        });
        showToast("success", "Follow-up emails generated");
      } else {
        showToast("error", "Failed to generate emails");
      }
    } catch (error) {
      console.error("Generate emails error:", error);
      showToast("error", "Failed to generate emails");
    } finally {
      setGeneratingEmails(false);
    }
  };

  const saveFollowUp = async (enabled: boolean) => {
    setSavingFollowUp(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: selectedContactId,
          enabled,
          email_1_subject: emails[1].subject,
          email_1_body: emails[1].body,
          email_2_subject: emails[2].subject,
          email_2_body: emails[2].body,
          email_3_subject: emails[3].subject,
          email_3_body: emails[3].body,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFollowUpData(data);
        setFollowUpEnabled(enabled);
        showToast("success", enabled ? "Follow-up emails scheduled" : "Follow-up emails disabled");
      } else {
        showToast("error", "Failed to save settings");
      }
    } catch (error) {
      console.error("Save follow-up error:", error);
      showToast("error", "Failed to save settings");
    } finally {
      setSavingFollowUp(false);
    }
  };

  const handleToggleFollowUp = async () => {
    if (!canEnableFollowUp) {
      showToast("error", "Add a contact with an email address to enable follow-ups");
      return;
    }

    const newState = !followUpEnabled;

    // If enabling and no emails generated yet, generate them first
    if (newState && !emails[1].subject) {
      await generateEmails();
    }

    await saveFollowUp(newState);
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !newContactEmail.trim()) {
      showToast("error", "Name and email are required");
      return;
    }

    setSavingContact(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newContactName.trim(),
          email: newContactEmail.trim(),
          title: newContactTitle.trim() || null,
          is_primary: true,
          source: "manual",
        }),
      });

      if (res.ok) {
        const newContact = await res.json();
        setContacts([...contacts, newContact]);
        setSelectedContactId(newContact.id);
        setShowAddContact(false);
        setNewContactName("");
        setNewContactEmail("");
        setNewContactTitle("");
        showToast("success", "Contact added successfully");
      } else {
        showToast("error", "Failed to add contact");
      }
    } catch (error) {
      console.error("Failed to add contact:", error);
      showToast("error", "Failed to add contact");
    } finally {
      setSavingContact(false);
    }
  };

  const saveAsTemplate = async (emailNum: number) => {
    if (!newTemplateName.trim()) {
      showToast("error", "Please enter a template name");
      return;
    }

    setSavingTemplate(true);
    try {
      const res = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          template_type: "follow_up",
          subject: emails[emailNum].subject,
          body: emails[emailNum].body,
          is_default: false,
        }),
      });

      if (res.ok) {
        const newTemplate = await res.json();
        setTemplates([...templates, newTemplate]);
        setShowSaveTemplate(null);
        setNewTemplateName("");
        showToast("success", "Template saved");
      } else {
        showToast("error", "Failed to save template");
      }
    } catch (error) {
      console.error("Save template error:", error);
      showToast("error", "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const loadTemplate = (templateId: number, emailNum: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Replace placeholders with actual values
    let subject = template.subject;
    let body = template.body;

    // Common placeholder replacements
    const replacements: { [key: string]: string } = {
      "{{company}}": companyName,
      "{{company_name}}": companyName,
      "{{position}}": jobTitle,
      "{{job_title}}": jobTitle,
      "{{recruiter}}": selectedContact?.name || "Hiring Team",
      "{{recruiter_name}}": selectedContact?.name || "Hiring Team",
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      subject = subject.replace(new RegExp(placeholder, "gi"), value);
      body = body.replace(new RegExp(placeholder, "gi"), value);
    });

    setEmails({
      ...emails,
      [emailNum]: { subject, body },
    });
    showToast("success", "Template loaded");
  };

  const getEmailStatus = (emailNum: number) => {
    if (!followUpData) return "pending";
    const sentAt = followUpData[`email_${emailNum}_sent_at` as keyof FollowUpData];
    if (sentAt) return "sent";
    return "pending";
  };

  const formatScheduledDate = (emailNum: number) => {
    if (emailNum === 1) return followUpDates.week1;
    if (emailNum === 2) return followUpDates.week2;
    if (emailNum === 3) return followUpDates.week3;
    return "";
  };

  return (
    <div className="space-y-4">
      {/* Unified Action Card */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue to-blue-600 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">Application Checklist</h3>
          <p className="text-blue-100 text-sm mt-1">
            {companyName} - {jobTitle}
          </p>
        </div>

        <div className="p-6">
          {/* Readiness Indicators */}
          <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {hasResume ? (
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
              )}
              <span className={`text-sm ${hasResume ? "text-green-700 font-medium" : "text-gray-500"}`}>
                Resume ready
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasCoverLetter ? (
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
              )}
              <span className={`text-sm ${hasCoverLetter ? "text-green-700 font-medium" : "text-gray-500"}`}>
                Cover letter ready
              </span>
            </div>
          </div>

          {/* Application Materials */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Application Materials</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onDownloadResume}
                disabled={downloadDisabled}
                className="bg-brand-gold text-gray-900 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Download</span> Resume
              </button>

              <button
                onClick={onDownloadCoverLetter}
                disabled={!hasCoverLetter}
                className="bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Download</span> Cover
              </button>

              <button
                onClick={onCopyCoverLetter}
                disabled={!hasCoverLetter}
                className="bg-gray-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Cover
              </button>
            </div>

            {!hasCoverLetter && (
              <p className="text-xs text-gray-500 text-center mt-2">
                <button onClick={onGoToCoverLetter} className="text-brand-blue hover:underline">
                  Generate a cover letter first
                </button>
              </p>
            )}
          </div>

          {/* Application URL & Apply Button */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application URL
            </label>
            <input
              type="url"
              value={applicationUrl}
              onChange={(e) => onApplicationUrlChange(e.target.value)}
              placeholder="https://company.com/careers/apply"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent mb-3"
            />

            <button
              onClick={handleApply}
              disabled={!hasApplicationUrl}
              className="w-full bg-brand-blue text-white py-3 rounded-xl text-base font-semibold hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Application
            </button>

            {!hasApplicationUrl && (
              <p className="text-xs text-amber-600 mt-2 text-center">
                Paste the application page URL to continue
              </p>
            )}
          </div>

          {/* Follow-up Automation Section */}
          <div className={`rounded-xl border-2 transition-colors ${
            followUpEnabled ? "border-brand-blue bg-blue-50" : "border-gray-200 bg-gray-50"
          }`}>
            <div className="p-4">
              {/* Toggle Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    followUpEnabled ? "bg-brand-blue" : "bg-gray-300"
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Auto Follow-up Emails</p>
                    <p className="text-xs text-gray-500">Automatically sent from your Gmail</p>
                  </div>
                </div>

                <button
                  onClick={handleToggleFollowUp}
                  disabled={!canEnableFollowUp || savingFollowUp || generatingEmails}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    followUpEnabled ? "bg-brand-blue" : "bg-gray-300"
                  } ${!canEnableFollowUp ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      followUpEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Contact Selection or Warning */}
              {loadingContacts ? (
                <div className="text-sm text-gray-500 py-2">Loading contacts...</div>
              ) : !canEnableFollowUp ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">No contact available</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Add a recruiter or hiring manager contact to enable auto follow-ups.
                      </p>
                    </div>
                  </div>

                  {!showAddContact ? (
                    <button
                      onClick={() => setShowAddContact(true)}
                      className="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-brand-blue hover:text-brand-blue transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Contact
                    </button>
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                        <input
                          type="text"
                          value={newContactName}
                          onChange={(e) => setNewContactName(e.target.value)}
                          placeholder="e.g., Sarah Chen"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                        <input
                          type="email"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          placeholder="e.g., sarah@company.com"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Title (optional)</label>
                        <input
                          type="text"
                          value={newContactTitle}
                          onChange={(e) => setNewContactTitle(e.target.value)}
                          placeholder="e.g., Recruiter, Hiring Manager"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowAddContact(false);
                            setNewContactName("");
                            setNewContactEmail("");
                            setNewContactTitle("");
                          }}
                          className="flex-1 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddContact}
                          disabled={savingContact || !newContactName.trim() || !newContactEmail.trim()}
                          className="flex-1 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {savingContact ? "Saving..." : "Save Contact"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Contact Dropdown */}
                  {contactsWithEmail.length > 1 && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Send follow-ups to:</label>
                      <select
                        value={selectedContactId || ""}
                        onChange={(e) => setSelectedContactId(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      >
                        {contactsWithEmail.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name} {contact.title ? `(${contact.title})` : ""} - {contact.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Selected Contact Display */}
                  {selectedContact && contactsWithEmail.length === 1 && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-white rounded-lg border border-gray-200">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedContact.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {selectedContact.title && `${selectedContact.title} • `}
                          {selectedContact.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email Schedule with Expandable Editors */}
                  {followUpEnabled && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-600">Scheduled emails:</p>
                        <button
                          onClick={generateEmails}
                          disabled={generatingEmails}
                          className="text-xs text-brand-blue hover:underline flex items-center gap-1"
                        >
                          <svg className={`w-3 h-3 ${generatingEmails ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {generatingEmails ? "Generating..." : "Regenerate All"}
                        </button>
                      </div>

                      {[1, 2, 3].map((emailNum) => {
                        const status = getEmailStatus(emailNum);
                        const isExpanded = expandedEmail === emailNum;

                        return (
                          <div key={emailNum} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <button
                              onClick={() => setExpandedEmail(isExpanded ? null : emailNum)}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  status === "sent" ? "bg-green-500" : "bg-blue-400"
                                }`} />
                                <span className="text-sm text-gray-700">
                                  {emailNum === 1 ? "1st" : emailNum === 2 ? "2nd" : "3rd"} follow-up
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatScheduledDate(emailNum)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {status === "sent" && (
                                  <span className="text-xs text-green-600 font-medium">Sent</span>
                                )}
                                <svg
                                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-3 pt-0 border-t border-gray-100">
                                <div className="space-y-3">
                                  {/* Template selector */}
                                  {templates.length > 0 && status !== "sent" && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Load from template</label>
                                      <select
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            loadTemplate(Number(e.target.value), emailNum);
                                            e.target.value = "";
                                          }
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                        defaultValue=""
                                      >
                                        <option value="">Select a saved template...</option>
                                        {templates.map((template) => (
                                          <option key={template.id} value={template.id}>
                                            {template.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                                    <input
                                      type="text"
                                      value={emails[emailNum].subject}
                                      onChange={(e) =>
                                        setEmails({
                                          ...emails,
                                          [emailNum]: { ...emails[emailNum], subject: e.target.value },
                                        })
                                      }
                                      disabled={status === "sent"}
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-gray-100"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Body</label>
                                    <textarea
                                      value={emails[emailNum].body}
                                      onChange={(e) =>
                                        setEmails({
                                          ...emails,
                                          [emailNum]: { ...emails[emailNum], body: e.target.value },
                                        })
                                      }
                                      disabled={status === "sent"}
                                      rows={6}
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-gray-100 resize-none"
                                    />
                                  </div>

                                  {status !== "sent" && (
                                    <div className="flex gap-2">
                                      {/* Save as Template toggle */}
                                      {showSaveTemplate === emailNum ? (
                                        <div className="flex-1 flex gap-2">
                                          <input
                                            type="text"
                                            value={newTemplateName}
                                            onChange={(e) => setNewTemplateName(e.target.value)}
                                            placeholder="Template name..."
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                          />
                                          <button
                                            onClick={() => saveAsTemplate(emailNum)}
                                            disabled={savingTemplate || !newTemplateName.trim()}
                                            className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                                          >
                                            {savingTemplate ? "..." : "Save"}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setShowSaveTemplate(null);
                                              setNewTemplateName("");
                                            }}
                                            className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setShowSaveTemplate(emailNum)}
                                          className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                          </svg>
                                          Save as Template
                                        </button>
                                      )}

                                      <button
                                        onClick={() => saveFollowUp(true)}
                                        disabled={savingFollowUp}
                                        className="flex-1 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
                                      >
                                        {savingFollowUp ? "Saving..." : "Save Changes"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Auto-archive indicator */}
                      <div className="flex items-center gap-2 text-sm p-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-gray-600">Auto-archive</span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium text-gray-900">{followUpDates.week4}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mark as Applied */}
          {!isApplied && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2 text-center">Already applied manually?</p>
              <button
                onClick={onMarkAsApplied}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Mark as Applied
              </button>
            </div>
          )}

          {/* Applied Badge */}
          {isApplied && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 py-3 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  Applied on {new Date(dateApplied).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
