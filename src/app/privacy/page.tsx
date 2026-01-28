import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ResumeGenie - Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-gray">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          ResumeGenie
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: January 28, 2025
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              1. Introduction
            </h2>
            <p>
              ResumeGenie (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
              operates the website at resumegenie.careers and provides
              AI-powered resume building, job application tracking, and related
              services (the &quot;Service&quot;). This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when
              you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              2. Information We Collect
            </h2>
            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">
              2.1 Account Information
            </h3>
            <p>
              When you sign in with Google, we receive your name, email address,
              and profile photo from your Google account. We do not receive or
              store your Google password.
            </p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">
              2.2 Resume Data
            </h3>
            <p>
              You provide us with resume content including your work history,
              education, skills, contact information, and optionally a profile
              photo. This data is stored to provide the Service.
            </p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">
              2.3 Job Application Data
            </h3>
            <p>
              When you submit job descriptions, we store the job details, any
              AI-generated tailored resumes, cover letters, interview guides,
              and application tracking information.
            </p>

            <h3 className="text-base font-medium text-gray-800 mt-4 mb-2">
              2.4 Google API Data
            </h3>
            <p>
              With your permission, we access your Gmail (read-only) to detect
              job-related email updates such as interview invitations,
              rejections, and offers. We also access your Google Calendar
              (read-only) to display upcoming interview schedules. We do not
              read, store, or share the full content of your emails or calendar
              events beyond what is necessary to provide job tracking features.
            </p>
            <p>
              Our use and transfer of information received from Google APIs
              adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue hover:text-brand-blue-dark underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              3. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Create and manage your account</li>
              <li>
                Generate and store your master resume and tailored resume
                variations
              </li>
              <li>
                Process job descriptions through AI to create tailored resumes
                and cover letters
              </li>
              <li>
                Track your job applications, interview stages, and related
                communications
              </li>
              <li>Provide ATS compatibility scoring for your resumes</li>
              <li>Generate interview preparation guides</li>
              <li>
                Check your email for job-related updates (with your permission)
              </li>
              <li>Improve and maintain the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              4. Third-Party Services
            </h2>
            <p>We use the following third-party services to operate:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Google OAuth</strong> &mdash; for authentication and
                account sign-in
              </li>
              <li>
                <strong>Google Gemini / Groq AI</strong> &mdash; to generate
                tailored resumes, cover letters, and interview guides. Your
                resume data and job descriptions are sent to these services for
                processing.
              </li>
              <li>
                <strong>Google Gmail API</strong> &mdash; to read job-related
                emails (with your permission)
              </li>
              <li>
                <strong>Google Calendar API</strong> &mdash; to read interview
                events (with your permission)
              </li>
            </ul>
            <p className="mt-2">
              Each third-party service is subject to its own privacy policy. We
              encourage you to review their policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              5. Data Storage and Security
            </h2>
            <p>
              Your data is stored on secure servers. We implement reasonable
              technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or
              destruction. However, no method of transmission over the Internet
              or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              6. Data Retention
            </h2>
            <p>
              We retain your data for as long as your account is active or as
              needed to provide the Service. You may request deletion of your
              account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              7. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>
                Revoke Google permissions at any time through your Google Account
                settings
              </li>
              <li>Export your resume data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              8. Cookies
            </h2>
            <p>
              We use essential cookies for authentication and session management.
              These cookies are necessary for the Service to function and cannot
              be disabled. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              9. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not intended for individuals under the age of 16.
              We do not knowingly collect personal information from children
              under 16.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              11. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
              at{" "}
              <a
                href="mailto:support@resumegenie.careers"
                className="text-brand-blue hover:text-brand-blue-dark underline"
              >
                support@resumegenie.careers
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <Link
            href="/"
            className="text-brand-blue hover:text-brand-blue-dark text-sm font-medium"
          >
            &larr; Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
