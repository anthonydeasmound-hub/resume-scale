import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ResumeGenie - Terms of Service",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-brand-gray">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <Link href="/" className="text-xl font-bold text-gray-900">
          ResumeGenie
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Last updated: January 28, 2025
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using ResumeGenie (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree to
              these terms, do not use the Service. The Service is operated by
              ResumeGenie (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              2. Description of Service
            </h2>
            <p>
              ResumeGenie provides AI-powered tools for building resumes,
              generating tailored resume variations for specific job
              descriptions, creating cover letters, tracking job applications,
              and preparing for interviews. The Service integrates with Google
              accounts for authentication and optional email and calendar
              features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              3. Account Registration
            </h2>
            <p>
              You must sign in with a valid Google account to use the Service.
              You are responsible for maintaining the security of your Google
              account. You agree to provide accurate information and to notify us
              of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              4. User Content
            </h2>
            <p>
              You retain ownership of all content you submit to the Service,
              including resume information, job descriptions, and notes
              (&quot;User Content&quot;). By using the Service, you grant us a
              limited license to process, store, and display your User Content
              solely for the purpose of providing the Service to you.
            </p>
            <p className="mt-2">You represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                You have the right to submit all User Content you provide
              </li>
              <li>
                Your User Content does not infringe the rights of any third
                party
              </li>
              <li>
                Your User Content is accurate and not misleading
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              5. AI-Generated Content
            </h2>
            <p>
              The Service uses artificial intelligence to generate tailored
              resumes, cover letters, interview guides, and other content. You
              acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                AI-generated content is provided as suggestions and should be
                reviewed for accuracy before use
              </li>
              <li>
                We do not guarantee that AI-generated content will result in job
                interviews or employment
              </li>
              <li>
                You are responsible for reviewing and editing all AI-generated
                content before submitting it to potential employers
              </li>
              <li>
                AI outputs may occasionally contain errors, inaccuracies, or
                inappropriate content
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              6. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                Use the Service for any unlawful purpose or in violation of
                these Terms
              </li>
              <li>
                Submit false, misleading, or fraudulent information in your
                resume or job applications
              </li>
              <li>
                Attempt to gain unauthorized access to the Service or its
                systems
              </li>
              <li>
                Use automated scripts or bots to access the Service
              </li>
              <li>
                Interfere with or disrupt the Service or its infrastructure
              </li>
              <li>
                Resell, redistribute, or commercially exploit the Service
                without our permission
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              7. Chrome Extension
            </h2>
            <p>
              The ResumeGenie Chrome Extension is an optional component of the
              Service that allows you to save job listings from third-party
              websites. The extension operates under these same Terms of Service.
              We are not affiliated with or endorsed by any third-party job board
              or website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              8. Google API Services
            </h2>
            <p>
              The Service&apos;s use of Google API data is limited to providing
              the features described in the Service. Our use and transfer of
              information received from Google APIs adheres to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue hover:text-brand-blue-dark underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. You may revoke access to
              your Google data at any time through your Google Account settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              9. Intellectual Property
            </h2>
            <p>
              The Service, including its design, features, code, and branding,
              is owned by ResumeGenie and protected by applicable intellectual
              property laws. You may not copy, modify, distribute, or create
              derivative works based on the Service without our prior written
              consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              10. Disclaimers
            </h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
              IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
              ERROR-FREE, OR SECURE. WE MAKE NO GUARANTEES REGARDING EMPLOYMENT
              OUTCOMES, INTERVIEW SUCCESS, OR THE ACCURACY OF AI-GENERATED
              CONTENT.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              11. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RESUMEGENIE SHALL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS
              OF EMPLOYMENT OPPORTUNITIES, OR LOSS OF REVENUE, ARISING OUT OF OR
              RELATED TO YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              12. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your access to the
              Service at any time, with or without cause and with or without
              notice. You may stop using the Service at any time. Upon
              termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              13. Changes to Terms
            </h2>
            <p>
              We may modify these Terms at any time. We will notify you of
              material changes by posting the updated Terms on this page and
              updating the &quot;Last updated&quot; date. Continued use of the
              Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              14. Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the
              laws of the United States. Any disputes arising from these Terms or
              your use of the Service shall be resolved in the appropriate courts
              of the United States.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
              15. Contact Us
            </h2>
            <p>
              If you have questions about these Terms of Service, please contact
              us at{" "}
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
