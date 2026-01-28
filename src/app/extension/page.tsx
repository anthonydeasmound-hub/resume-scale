"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import TabsNav from "@/components/TabsNav";

export default function ExtensionPage() {
  const { data: session, status } = useSession();

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    document.title = "ResumeGenie - Extension";
  }, []);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch("/api/extension/token");
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
      }
    } catch (err) {
      console.error("Failed to fetch token:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setReviewCount(data.review_count || 0);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchToken();
      fetchStats();
    }
  }, [session, fetchToken, fetchStats]);

  const handleCopy = async () => {
    if (token) {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      const res = await fetch("/api/extension/token", { method: "DELETE" });
      if (res.ok) {
        setToken(null);
        // Fetch a new token
        await fetchToken();
      }
    } catch (err) {
      console.error("Failed to revoke token:", err);
    } finally {
      setRevoking(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const features = [
    {
      title: "One-Click Save",
      description:
        "Save job listings instantly from LinkedIn, Indeed, or any job board",
      icon: (
        <svg
          className="w-8 h-8 text-brand-blue"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      ),
    },
    {
      title: "Auto-Tailor",
      description:
        "Automatically generates a tailored resume when you save a job",
      icon: (
        <svg
          className="w-8 h-8 text-brand-blue"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      title: "Track Everything",
      description:
        "All saved jobs appear in your Applied tracker automatically",
      icon: (
        <svg
          className="w-8 h-8 text-brand-blue"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-brand-gray">
      <TabsNav reviewCount={reviewCount} />

      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chrome Extension</h1>
          <p className="text-gray-500 mt-1">
            Save jobs from any job board with one click
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="w-14 h-14 bg-brand-blue-light rounded-xl flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Install / Connect Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Setup Instructions
          </h2>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <span className="animate-spin w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full" />
              Loading...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-gold text-gray-900 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Install from Chrome Web Store
                  </p>
                  <p className="text-sm text-gray-500 mt-1 mb-3">
                    Add the ResumeGenie extension to your Chrome browser.
                  </p>
                  <a
                    href="https://chromewebstore.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-gray-900 px-5 py-2.5 rounded-lg font-medium transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Open Chrome Web Store
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-gold text-gray-900 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Open extension settings and enter your connection token
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click the extension icon in your browser toolbar, then paste
                    the token below into the settings.
                  </p>
                </div>
              </div>

              {/* Step 3 - Token */}
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-gold text-gray-900 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-3">
                    Your connection token
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-700 break-all select-all">
                      {token || "No token available"}
                    </div>
                    <button
                      onClick={handleCopy}
                      disabled={!token}
                      className="flex-shrink-0 bg-brand-blue hover:bg-brand-blue-dark text-white px-4 py-3 rounded-lg font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {copied ? (
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Copied
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleRevoke}
                      disabled={revoking || !token}
                      className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {revoking ? "Revoking..." : "Revoke & regenerate token"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
