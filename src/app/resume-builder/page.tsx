"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Resume-builder specific testimonials
const testimonials = [
  {
    name: "Marcus T.",
    role: "Frontend Developer",
    initials: "MT",
    color: "bg-blue-100 text-brand-blue",
    quote: "I was spending hours tweaking my resume for each application. Now I paste the job description and get a perfectly tailored resume in under 2 minutes.",
  },
  {
    name: "Jennifer H.",
    role: "Project Manager",
    initials: "JH",
    color: "bg-green-100 text-green-600",
    quote: "The ATS score feature is a game-changer. I went from a 54% to 91% match score on my target role. Got the interview the next week.",
  },
  {
    name: "Alex K.",
    role: "Data Analyst",
    initials: "AK",
    color: "bg-purple-100 text-purple-600",
    quote: "I love that I can maintain one master resume and generate unlimited tailored versions. No more juggling 20 different resume files.",
  },
  {
    name: "Samantha R.",
    role: "Marketing Manager",
    initials: "SR",
    color: "bg-amber-100 text-amber-600",
    quote: "The AI bullet point rewriter helped me quantify my achievements in ways I never thought of. My resume sounds so much more impactful now.",
  },
  {
    name: "David L.",
    role: "Software Engineer",
    initials: "DL",
    color: "bg-rose-100 text-rose-600",
    quote: "Finally, a resume builder that understands ATS systems. I stopped getting ghosted and started getting callbacks within the first week.",
  },
  {
    name: "Michelle P.",
    role: "Product Designer",
    initials: "MP",
    color: "bg-teal-100 text-teal-600",
    quote: "The template designs are clean and professional. I've gotten compliments on how polished my resume looks from multiple recruiters.",
  },
];

// Resume-builder specific FAQs
const faqs = [
  {
    q: "Is the resume builder really free?",
    a: "Yes! Our free plan includes unlimited resume creation and editing, access to our Horizon template, and ATS score checking. Premium unlocks all 6 templates, unlimited AI generations, and advanced features.",
  },
  {
    q: "What is an ATS and why does it matter?",
    a: "An Applicant Tracking System (ATS) is software that 90% of Fortune 500 companies use to filter resumes before a human ever sees them. Our builder optimizes your resume with the right keywords and formatting to pass these systems.",
  },
  {
    q: "How does AI tailoring work?",
    a: "Paste any job description and our AI analyzes the required skills, keywords, and qualifications. It then rewrites your resume bullet points to highlight matching experience, using language that resonates with both ATS systems and hiring managers.",
  },
  {
    q: "What file formats can I export?",
    a: "You can export your resume as a PDF optimized for ATS systems. The PDF preserves all formatting and is designed to be machine-readable while looking professional to human reviewers.",
  },
  {
    q: "Can I save multiple versions of my resume?",
    a: "Absolutely! Create unlimited tailored resumes for different roles and companies. Each version is saved separately so you can track which resume you sent to which employer.",
  },
  {
    q: "How do I import my existing resume?",
    a: "During onboarding, you can paste your existing resume content and our AI will parse it into structured sections. You can also manually enter your information or import from LinkedIn.",
  },
  {
    q: "Are the templates ATS-friendly?",
    a: "Yes, all 6 templates are designed with ATS compatibility in mind. We avoid graphics in the main content area, use standard section headings, and ensure proper text parsing.",
  },
  {
    q: "Is my resume data secure?",
    a: "Your data is encrypted at rest and in transit. We never share your personal information with third parties, and you can delete your account and all data at any time.",
  },
];

// Template data
const templates = [
  { name: "Executive", style: "Classic serif layout", accent: "border-gray-800" },
  { name: "Horizon", style: "Modern sidebar design", accent: "border-brand-blue" },
  { name: "Canvas", style: "Creative two-column", accent: "border-brand-cyan" },
  { name: "Terminal", style: "Minimal monospace", accent: "border-gray-600" },
  { name: "Summit", style: "Bold header layout", accent: "border-brand-gold" },
  { name: "Cornerstone", style: "Clean professional", accent: "border-green-600" },
];

// Feature sections data
const featureSections = [
  {
    label: "AI Resume Builder",
    headline: "Quickly Create and Edit Resumes",
    description:
      "Paste any job description and watch our AI transform your experience into a tailored resume. It matches your skills to the role's requirements, highlights the right keywords, and formats everything for ATS systems — all in under 2 minutes.",
  },
  {
    label: "AI Resume Analyzer",
    headline: "Analyze Your Resume for Instant Improvements",
    description:
      "Get an instant ATS compatibility score with detailed breakdowns. See exactly which keywords you're matching, which skills are missing, and receive actionable suggestions to boost your score before you apply.",
  },
  {
    label: "Job Matching",
    headline: "Match Your Resume to Any Role",
    description:
      "Keep one master resume with all your experience. When you find a job you want, our AI creates a tailored version that emphasizes the most relevant skills and achievements for that specific role.",
  },
  {
    label: "Resume Design",
    headline: "Design a Professional, ATS-Friendly Resume",
    description:
      "Choose from 6 professionally designed templates that balance visual appeal with ATS compatibility. Each template is optimized for machine parsing while looking polished to human reviewers.",
  },
  {
    label: "AI Resume Writer",
    headline: "Speed Up Resume Writing with AI",
    description:
      "Transform bland bullet points into impactful achievement statements. Our AI helps you quantify results, use action verbs, and highlight the metrics that matter most to hiring managers.",
  },
  {
    label: "Multiple Resumes",
    headline: "Create & Export Resumes Without Limits",
    description:
      "Create unlimited resume versions for different roles and companies. Export as ATS-optimized PDFs whenever you need them. Track which version you sent to each employer.",
  },
];

// Tabbed section data
const tabbedContent = [
  {
    label: "Write",
    title: "AI-Powered Writing Assistant",
    description:
      "Our AI helps you craft compelling bullet points, professional summaries, and skill descriptions. Just describe what you did, and we'll transform it into resume-ready language.",
    features: ["Achievement-focused bullets", "Action verb suggestions", "Quantified results", "Industry-specific language"],
  },
  {
    label: "Analyze",
    title: "Smart Resume Analysis",
    description:
      "Get instant feedback on your resume's ATS compatibility. Our analyzer checks keyword density, formatting, skill alignment, and more — giving you a clear score and improvement tips.",
    features: ["ATS score breakdown", "Keyword matching", "Skills gap analysis", "Format verification"],
  },
  {
    label: "Design",
    title: "Professional Templates",
    description:
      "Choose from 6 expertly designed templates that look great and parse perfectly. Each template is tested against major ATS systems to ensure your content gets through.",
    features: ["6 ATS-tested templates", "Clean, modern designs", "Consistent formatting", "Print-ready PDFs"],
  },
  {
    label: "Export",
    title: "One-Click Export",
    description:
      "Download your resume as an ATS-optimized PDF in one click. Our export engine preserves formatting while ensuring machine readability.",
    features: ["PDF export", "ATS-optimized format", "Instant download", "No watermarks"],
  },
];

// Mini-features grid
const miniFeatures = [
  {
    title: "Smart Keywords",
    description: "AI extracts and matches job-specific keywords automatically",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    title: "ATS Compatibility",
    description: "Every resume is optimized for applicant tracking systems",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "One-Click Export",
    description: "Download professional PDFs instantly, no formatting hassle",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
  {
    title: "Version History",
    description: "Track all your resume versions and updates over time",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Real-Time Preview",
    description: "See changes instantly as you edit your resume content",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    title: "Mobile Friendly",
    description: "Edit and manage your resumes from any device",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Privacy First",
    description: "Your data is encrypted and never shared with third parties",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: "No Watermarks",
    description: "Clean, professional exports without any branding",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    title: "Unlimited Storage",
    description: "Save as many resume versions as you need",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
];

export default function ResumeBuilderLandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    document.title = "Free AI Resume Builder - Resume Genie";
  }, []);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleCTA = () => {
    signIn("google", { callbackUrl: "/onboarding" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 scroll-smooth">
      {/* ===== 1. STICKY NAV ===== */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="font-dm-serif text-xl font-bold text-gray-900">
              Resume Genie
            </a>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#templates" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Templates
              </a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                How It Works
              </a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                FAQ
              </a>
              <button onClick={() => signIn("google")} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">
                Log In
              </button>
              <button
                onClick={handleCTA}
                className="bg-brand-blue text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-blue-dark transition-colors"
              >
                Build My Resume Free
              </button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a>
                <a href="#templates" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>
                  Templates
                </a>
                <a href="#how-it-works" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>
                  How It Works
                </a>
                <a href="#faq" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>
                  FAQ
                </a>
                <button onClick={() => signIn("google")} className="text-sm text-gray-600 text-left font-medium">
                  Log In
                </button>
                <button
                  onClick={handleCTA}
                  className="bg-brand-blue text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-blue-dark transition-colors w-full"
                >
                  Build My Resume Free
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ===== 2. HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-warm to-white pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left side - Copy */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                The Free AI Resume Builder That Gets You{" "}
                <span className="text-brand-blue">Hired</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Create ATS-optimized resumes tailored to every job description. Our AI matches your experience to role requirements, highlights the right keywords, and formats everything perfectly.
              </p>

              {/* 3 benefit icons */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">AI-Powered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">ATS-Optimized</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Unlimited Edits</span>
                </div>
              </div>

              <button
                onClick={handleCTA}
                className="inline-flex items-center gap-3 bg-brand-blue text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-blue-dark transition-all hover:shadow-lg text-base"
              >
                Build My Resume Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <p className="mt-4 text-sm text-gray-400">100% free to start. No credit card required.</p>
            </div>

            {/* Right side - Resume Preview Mockup (Horizon-style) */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Resume mockup */}
                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-1/3 bg-brand-blue p-6">
                    <div className="w-16 h-16 rounded-full bg-white/20 mb-4"></div>
                    <div className="h-3 bg-white/40 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-white/30 rounded w-1/2 mb-6"></div>

                    <div className="h-2 bg-white/50 rounded w-1/2 mb-3"></div>
                    <div className="space-y-2 mb-6">
                      <div className="h-1.5 bg-white/30 rounded w-full"></div>
                      <div className="h-1.5 bg-white/30 rounded w-5/6"></div>
                      <div className="h-1.5 bg-white/30 rounded w-4/5"></div>
                    </div>

                    <div className="h-2 bg-white/50 rounded w-1/2 mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-1.5 bg-white/30 rounded w-full"></div>
                      <div className="h-1.5 bg-white/30 rounded w-3/4"></div>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 p-6">
                    <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2 mb-6"></div>

                    <div className="h-2 bg-brand-blue/30 rounded w-1/3 mb-3"></div>
                    <div className="space-y-1.5 mb-5">
                      <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                    </div>

                    <div className="h-2 bg-brand-blue/30 rounded w-1/3 mb-3"></div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <div className="h-2 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-1.5 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="space-y-1">
                        <div className="h-1.5 bg-gray-100 rounded w-full"></div>
                        <div className="h-1.5 bg-gray-100 rounded w-5/6"></div>
                        <div className="h-1.5 bg-gray-100 rounded w-full"></div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <div className="h-2 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-1.5 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="space-y-1">
                        <div className="h-1.5 bg-gray-100 rounded w-full"></div>
                        <div className="h-1.5 bg-gray-100 rounded w-4/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating ATS score badge */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600">87%</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">ATS Score</div>
                    <div className="text-xs text-gray-500">Optimized for success</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 3. SOCIAL PROOF STATS BAR ===== */}
      <section className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "50K+", label: "Resumes Created" },
              { number: "87%", label: "Avg ATS Score" },
              { number: "6", label: "Templates" },
              { number: "2 min", label: "Build Time" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-brand-gold">{stat.number}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4-9. FEATURE SECTIONS (6 alternating) ===== */}
      <div id="features">
        {featureSections.map((feature, i) => {
          const isReversed = i % 2 === 1;
          return (
            <section key={feature.label} className={`py-20 lg:py-28 ${i % 2 === 1 ? "bg-brand-gray" : "bg-white"}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center`}>
                  <div className={isReversed ? "lg:order-2" : ""}>
                    <div className="inline-flex items-center gap-2 bg-brand-blue/10 text-brand-blue text-sm font-medium px-3 py-1 rounded-full mb-4">
                      {feature.label}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{feature.headline}</h2>
                    <p className="text-lg text-gray-600 leading-relaxed mb-6">{feature.description}</p>
                    <button
                      onClick={handleCTA}
                      className="inline-flex items-center gap-2 bg-brand-blue text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-blue-dark transition-colors"
                    >
                      Build My Resume Free
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                  <div className={isReversed ? "lg:order-1" : ""}>
                    {/* Mockup for each feature */}
                    {i === 0 && (
                      /* AI Resume Builder - Split view: job input → resume output */
                      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="grid grid-cols-2">
                          {/* Left: Job Input */}
                          <div className="p-5 border-r border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-gray-500">Job Description</span>
                            </div>
                            <div className="space-y-2">
                              <div className="h-2 bg-gray-200 rounded w-full"></div>
                              <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                              <div className="h-2 bg-gray-200 rounded w-full"></div>
                              <div className="h-2 bg-brand-blue/20 rounded w-3/4"></div>
                              <div className="h-2 bg-gray-200 rounded w-full"></div>
                              <div className="h-2 bg-brand-blue/20 rounded w-2/3"></div>
                            </div>
                          </div>
                          {/* Right: Resume Output */}
                          <div className="p-5 bg-gray-50">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded bg-brand-blue/10 flex items-center justify-center">
                                <svg className="w-3 h-3 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium text-brand-blue">Tailored Resume</span>
                            </div>
                            <div className="space-y-2">
                              <div className="h-2 bg-brand-blue/30 rounded w-1/2"></div>
                              <div className="h-1.5 bg-gray-300 rounded w-full"></div>
                              <div className="h-1.5 bg-gray-300 rounded w-5/6"></div>
                              <div className="h-1.5 bg-green-300 rounded w-full"></div>
                              <div className="h-1.5 bg-gray-300 rounded w-3/4"></div>
                              <div className="h-1.5 bg-green-300 rounded w-5/6"></div>
                            </div>
                          </div>
                        </div>
                        {/* Arrow indicator */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                          <svg className="w-4 h-4 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {i === 1 && (
                      /* AI Resume Analyzer - ATS Score card with breakdowns */
                      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="text-center mb-5">
                          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 ring-4 ring-green-200 mb-3">
                            <span className="text-3xl font-bold text-green-600">87%</span>
                          </div>
                          <div className="text-sm text-gray-500">ATS Compatibility Score</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-5">
                          <div className="bg-green-500 h-3 rounded-full" style={{ width: "87%" }}></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <div className="font-semibold text-green-700">12/14</div>
                            <div className="text-xs text-green-600">Keywords</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <div className="font-semibold text-green-700">Pass</div>
                            <div className="text-xs text-green-600">Formatting</div>
                          </div>
                          <div className="bg-brand-blue-light rounded-lg p-3 text-center">
                            <div className="font-semibold text-brand-blue">9/11</div>
                            <div className="text-xs text-brand-blue">Skills</div>
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <div className="text-xs font-medium text-brand-blue mb-2">Suggestions</div>
                          <div className="space-y-1">
                            <div className="flex items-start gap-2 text-xs text-gray-600">
                              <svg className="w-3 h-3 text-brand-blue mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Add &quot;project management&quot; to skills section
                            </div>
                            <div className="flex items-start gap-2 text-xs text-gray-600">
                              <svg className="w-3 h-3 text-brand-blue mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Quantify your achievement in bullet point 3
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {i === 2 && (
                      /* Job Matching - Master resume → multiple tailored cards */
                      <div className="space-y-4">
                        {/* Master resume */}
                        <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-brand-blue">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                              <svg className="w-4 h-4 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">Master Resume</div>
                              <div className="text-xs text-gray-500">All your experience in one place</div>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                            <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="flex justify-center">
                          <svg className="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                        {/* Tailored versions */}
                        <div className="grid grid-cols-3 gap-3">
                          {["Senior Dev @ Google", "Lead Eng @ Stripe", "Staff @ Meta"].map((role, idx) => (
                            <div key={idx} className="bg-white rounded-lg shadow p-3 border border-gray-100">
                              <div className="h-2 bg-brand-blue/30 rounded w-2/3 mb-2"></div>
                              <div className="text-xs text-gray-600 font-medium mb-2">{role}</div>
                              <div className="space-y-1">
                                <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                                <div className="h-1.5 bg-green-200 rounded w-5/6"></div>
                                <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                              </div>
                              <div className="mt-2 text-xs font-medium text-green-600">92% Match</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {i === 3 && (
                      /* Resume Design - 2x3 template gallery grid */
                      <div className="grid grid-cols-3 gap-3">
                        {templates.map((t) => (
                          <div key={t.name} className={`bg-white border-2 ${t.accent} rounded-lg p-3 hover:shadow-md transition-shadow`}>
                            <div className="bg-gray-50 rounded p-2 mb-2 aspect-[8.5/11]">
                              <div className="h-2 bg-gray-300 rounded w-1/2 mb-1.5"></div>
                              <div className="h-1 bg-gray-200 rounded w-3/4 mb-1"></div>
                              <div className="h-1 bg-gray-200 rounded w-2/3 mb-2"></div>
                              <div className="h-1.5 bg-gray-300 rounded w-1/3 mb-1"></div>
                              <div className="space-y-0.5">
                                <div className="h-0.5 bg-gray-200 rounded w-full"></div>
                                <div className="h-0.5 bg-gray-200 rounded w-5/6"></div>
                                <div className="h-0.5 bg-gray-200 rounded w-full"></div>
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-gray-900">{t.name}</div>
                            <div className="text-[10px] text-gray-500">{t.style}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {i === 4 && (
                      /* AI Resume Writer - Before/after bullet comparison */
                      <div className="space-y-4">
                        {/* Before */}
                        <div className="bg-white rounded-xl shadow p-5 border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">Before</span>
                          </div>
                          <div className="text-sm text-gray-600 leading-relaxed">
                            &quot;Responsible for managing projects and working with team members on various initiatives.&quot;
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="flex justify-center">
                          <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        </div>
                        {/* After */}
                        <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">After</span>
                          </div>
                          <div className="text-sm text-gray-900 leading-relaxed font-medium">
                            &quot;Led cross-functional team of 8 engineers to deliver $2.4M product launch 3 weeks ahead of schedule, improving customer acquisition by 34%.&quot;
                          </div>
                        </div>
                      </div>
                    )}
                    {i === 5 && (
                      /* Multiple Resumes - Dashboard list with PDF buttons */
                      <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-semibold text-gray-900">Your Resumes</div>
                          <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-full">5 versions</span>
                        </div>
                        <div className="space-y-3">
                          {[
                            { role: "Frontend Engineer - Google", date: "Today", score: 94 },
                            { role: "Senior Developer - Stripe", date: "Yesterday", score: 89 },
                            { role: "Full Stack - Vercel", date: "Jan 15", score: 92 },
                            { role: "React Developer - Meta", date: "Jan 12", score: 87 },
                          ].map((resume, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{resume.role}</div>
                                <div className="text-xs text-gray-500">{resume.date}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                  {resume.score}%
                                </span>
                                <button className="text-xs bg-brand-blue text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-blue-dark transition-colors">
                                  PDF
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ===== 10. TABBED SECTION ===== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Create and Optimize Your Resumes with AI
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From writing to exporting, our AI helps at every step of the resume building process.
            </p>
          </div>

          {/* Tabs */}
          <div className="max-w-3xl mx-auto">
            <div className="flex border-b border-gray-200 mb-8">
              {tabbedContent.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 text-sm font-medium py-3 border-b-2 transition-colors ${
                    activeTab === i ? "border-brand-blue text-brand-blue" : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-brand-gray rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{tabbedContent[activeTab].title}</h3>
              <p className="text-gray-600 mb-6">{tabbedContent[activeTab].description}</p>
              <div className="grid grid-cols-2 gap-4">
                {tabbedContent[activeTab].features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 11. TESTIMONIALS ===== */}
      <section id="testimonials" className="py-20 lg:py-28 bg-brand-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What job seekers are saying</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-5 h-5 text-brand-gold" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 12. HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-brand-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Go from job listing to tailored resume in 4 simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
            {[
              { num: 1, title: "Import Info", desc: "Upload your existing resume or enter your experience. Our AI parses everything automatically." },
              { num: 2, title: "Paste Job Post", desc: "Copy and paste any job description. We analyze the requirements and keywords instantly." },
              { num: 3, title: "AI Tailors Resume", desc: "Our AI rewrites your bullets, highlights matching skills, and optimizes for ATS systems." },
              { num: 4, title: "Export & Apply", desc: "Download your ATS-optimized PDF and apply with confidence. Track every application." },
            ].map((step, i) => (
              <div key={step.num} className="relative text-center">
                <div className="w-16 h-16 bg-brand-blue text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-brand-blue/30" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 13. FEATURES GRID ===== */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything you need to land the job</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to maximize your interview chances.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {miniFeatures.map((feature) => (
              <div key={feature.title} className="bg-brand-gray rounded-xl p-6">
                <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center mb-4 text-brand-blue">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 14. TEMPLATES GRID ===== */}
      <section id="templates" className="py-20 lg:py-28 bg-brand-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Professionally designed templates</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from 6 ATS-friendly templates designed for different industries and roles.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t) => (
              <div key={t.name} className={`bg-white border-2 ${t.accent} rounded-xl p-6 hover:shadow-lg transition-shadow`}>
                <div className="bg-gray-50 rounded-lg p-4 mb-4 aspect-[8.5/11]">
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                    <div className="h-1.5 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                  </div>
                  <div className="mt-3 h-3 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                    <div className="h-1.5 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-1.5 bg-gray-200 rounded w-full"></div>
                    <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
                <div className="font-semibold text-gray-900">{t.name}</div>
                <div className="text-sm text-gray-500">{t.style}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 15. FAQ ACCORDION ===== */}
      <section id="faq" className="py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frequently asked questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-brand-gray rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div id={`faq-answer-${i}`} role="region" className="px-5 pb-5 text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 16. FINAL CTA ===== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-blue rounded-3xl px-8 py-16 sm:px-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Build a Resume That Gets Results?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Stop sending generic resumes. Start tailoring to every job and watch the interview requests roll in.
            </p>
            <button
              onClick={handleCTA}
              className="inline-flex items-center gap-3 bg-white text-brand-blue font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-all text-base shadow-lg"
            >
              Build My Resume Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <p className="mt-4 text-white/60 text-sm">Free forever. No credit card needed.</p>
          </div>
        </div>
      </section>

      {/* ===== 17. FOOTER ===== */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="font-dm-serif text-lg font-bold text-gray-900">Resume Genie</span>
              <p className="text-sm text-gray-500 mt-3 max-w-xs">
                AI-powered resumes tailored to every job description. ATS-optimized, professionally designed, and uniquely yours.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-sm text-gray-500 hover:text-gray-700">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#templates" className="text-sm text-gray-500 hover:text-gray-700">
                    Templates
                  </a>
                </li>
                <li>
                  <a href="/#pricing" className="text-sm text-gray-500 hover:text-gray-700">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-700">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-sm text-gray-500 hover:text-gray-700">
                    Testimonials
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-sm text-gray-500 hover:text-gray-700">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Get Started</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => signIn("google")} className="text-sm text-gray-500 hover:text-gray-700">
                    Log In
                  </button>
                </li>
                <li>
                  <button onClick={handleCTA} className="text-sm text-gray-500 hover:text-gray-700">
                    Build My Resume Free
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Resume Genie. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="text-sm text-gray-400 hover:text-gray-600">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm text-gray-400 hover:text-gray-600">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
