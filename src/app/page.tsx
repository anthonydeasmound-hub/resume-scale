"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const features = [
  {
    title: "AI Resume Builder",
    desc: "Generate resumes tailored to each job description. Our AI matches your experience to the role\u2019s requirements, highlighting the right keywords for ATS systems.",
    color: "blue",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    mockup: (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-brand-blue/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div><div className="font-semibold text-sm text-gray-900">Resume Builder</div><div className="text-xs text-gray-500">AI-powered generation</div></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          <div className="h-3 bg-brand-blue/30 rounded w-3/5"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-full">JavaScript</span>
          <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-full">React</span>
          <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-full">Node.js</span>
        </div>
      </div>
    ),
  },
  {
    title: "ATS Score Checker",
    desc: "Check how well your resume matches each job before you apply. Get keyword suggestions and formatting tips to boost your ATS compatibility score.",
    color: "rose",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    mockup: (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-brand-blue">87%</div>
          <div className="text-sm text-gray-500 mt-1">ATS Match Score</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div className="bg-brand-blue h-3 rounded-full" style={{ width: "87%" }}></div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Keywords matched</span><span className="font-medium text-green-600">12/14</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Formatting</span><span className="font-medium text-green-600">Pass</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Skills alignment</span><span className="font-medium text-brand-gold">9/11</span></div>
        </div>
      </div>
    ),
  },
  {
    title: "Application Tracker",
    desc: "Track every application from saved to offer. Gmail integration automatically detects responses, interview invites, and rejections in real time.",
    color: "amber",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    mockup: (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="text-sm font-semibold text-gray-900 mb-3">Application Pipeline</div>
        <div className="space-y-2">
          {[
            { stage: "Applied", count: 12, color: "bg-gray-300" },
            { stage: "Screening", count: 5, color: "bg-brand-cyan" },
            { stage: "Interview", count: 3, color: "bg-brand-blue" },
            { stage: "Offer", count: 1, color: "bg-green-500" },
          ].map((s) => (
            <div key={s.stage} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20">{s.stage}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div className={`${s.color} h-2.5 rounded-full`} style={{ width: `${(s.count / 12) * 100}%` }}></div>
              </div>
              <span className="text-xs font-medium text-gray-700 w-6 text-right">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "AI Cover Letters",
    desc: "Generate targeted cover letters that match the job description and company culture. Each letter is unique, professional, and ready to send.",
    color: "purple",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    mockup: (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Cover Letter Preview</div>
        <div className="space-y-2">
          <div className="h-2.5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-2.5 bg-gray-200 rounded w-full"></div>
          <div className="h-2.5 bg-gray-200 rounded w-5/6"></div>
          <div className="h-2.5 bg-gray-200 rounded w-full"></div>
          <div className="h-2.5 bg-brand-blue/20 rounded w-2/3"></div>
          <div className="h-6"></div>
          <div className="h-2.5 bg-gray-200 rounded w-full"></div>
          <div className="h-2.5 bg-gray-200 rounded w-4/5"></div>
          <div className="h-2.5 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    ),
  },
  {
    title: "Chrome Extension",
    desc: "Save jobs from LinkedIn, Indeed, and Glassdoor without leaving the page. Our side panel auto-detects listings and extracts all the details.",
    color: "green",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    mockup: (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 max-w-xs mx-auto">
        <div className="bg-brand-blue px-4 py-3 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">Resume Genie</span>
          <span className="flex items-center gap-1.5 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            Connected
          </span>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Current Page</div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="font-semibold text-sm text-gray-900">Senior Software Engineer</div>
            <div className="text-xs text-gray-500 mt-1">Acme Corp &middot; San Francisco, CA</div>
            <div className="text-xs text-gray-500">$150k - $200k</div>
          </div>
          <div className="bg-green-500 text-white text-sm font-medium py-2.5 rounded-lg text-center">Save to Resume Genie</div>
        </div>
      </div>
    ),
  },
  {
    title: "Interview Prep",
    desc: "Get AI-generated interview questions based on the job description and your resume. Practice with tailored questions so you walk in confident.",
    color: "teal",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    mockup: (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="text-sm font-semibold text-gray-900 mb-3">Practice Questions</div>
        <div className="space-y-3">
          {["Tell me about a challenging project you led.", "How do you prioritize competing deadlines?", "Describe your experience with React and TypeScript."].map((q, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-blue/10 text-brand-blue text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-sm text-gray-700">{q}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const colorMap: Record<string, { bg: string; text: string; bgLight: string }> = {
  blue: { bg: "bg-brand-gold", text: "text-brand-blue", bgLight: "bg-blue-100" },
  rose: { bg: "bg-rose-600", text: "text-rose-600", bgLight: "bg-rose-100" },
  amber: { bg: "bg-amber-600", text: "text-amber-600", bgLight: "bg-amber-100" },
  purple: { bg: "bg-purple-600", text: "text-purple-600", bgLight: "bg-purple-100" },
  green: { bg: "bg-green-600", text: "text-green-600", bgLight: "bg-green-100" },
  teal: { bg: "bg-teal-600", text: "text-teal-600", bgLight: "bg-teal-100" },
};

const templates = [
  { name: "Executive", style: "Classic serif layout", accent: "border-gray-800" },
  { name: "Horizon", style: "Modern sidebar design", accent: "border-brand-blue" },
  { name: "Canvas", style: "Creative two-column", accent: "border-brand-cyan" },
  { name: "Terminal", style: "Minimal monospace", accent: "border-gray-600" },
  { name: "Summit", style: "Bold header layout", accent: "border-brand-gold" },
  { name: "Cornerstone", style: "Clean professional", accent: "border-green-600" },
];

const testimonials = [
  { name: "Jordan K.", role: "Software Engineer", initials: "JK", color: "bg-blue-100 text-brand-blue", quote: "Being able to tailor my resume to each job description has been a game changer. I went from getting ghosted to landing 3 interviews in one week." },
  { name: "Sarah M.", role: "Product Manager", initials: "SM", color: "bg-green-100 text-green-600", quote: "The Chrome extension is so smooth. I browse LinkedIn, see a job I like, and save it in one click. Then I have a tailored resume ready in minutes." },
  { name: "Rachel L.", role: "Marketing Analyst", initials: "RL", color: "bg-purple-100 text-purple-600", quote: "The Gmail integration tracking my applications automatically is something I didn\u2019t know I needed. No more spreadsheets. Everything is in one place." },
  { name: "Michael P.", role: "Data Scientist", initials: "MP", color: "bg-amber-100 text-amber-600", quote: "I was skeptical about AI-generated resumes, but the quality blew me away. Each one is uniquely tailored and reads like I wrote it myself." },
  { name: "Emily T.", role: "UX Designer", initials: "ET", color: "bg-rose-100 text-rose-600", quote: "The ATS score checker gave me confidence that my resume would actually get seen. I improved my score from 62% to 94% in minutes." },
  { name: "David C.", role: "Financial Analyst", initials: "DC", color: "bg-teal-100 text-teal-600", quote: "Interview prep questions based on the actual job description? That\u2019s next level. I felt so prepared walking into my final round." },
];

const faqs = [
  { q: "What is Resume Genie?", a: "Resume Genie is an AI-powered job application platform that helps you create tailored resumes, cover letters, and track your applications \u2014 all in one place." },
  { q: "How does the AI resume builder work?", a: "Our AI analyzes the job description and your master resume, then generates a version optimized for the specific role. It highlights relevant keywords, skills, and experience that match what the employer is looking for." },
  { q: "What is an ATS score?", a: "An ATS (Applicant Tracking System) score indicates how well your resume matches a job description. Many companies use ATS software to filter resumes before a human ever sees them. Our score checker helps you optimize for these systems." },
  { q: "Is Resume Genie free to use?", a: "Yes! Our free plan includes essential features like resume building, ATS scoring, and application tracking. Premium unlocks unlimited AI generations, all templates, and priority support." },
  { q: "How does the Chrome extension work?", a: "Install the extension, and it opens as a side panel when you visit LinkedIn, Indeed, or Glassdoor. It auto-detects job listings and lets you save them to Resume Genie with one click \u2014 no copy-pasting needed." },
  { q: "Can I customize the resume templates?", a: "Each template can be customized with your own content, and the AI handles formatting and optimization. Choose from 6 professionally designed templates suited for different industries." },
  { q: "How does Gmail integration work?", a: "After connecting your Gmail, Resume Genie automatically detects application responses, interview invitations, and rejection emails. Your application status updates automatically." },
  { q: "Is my data secure?", a: "Absolutely. We use industry-standard encryption, never share your data with third parties, and you can delete your account and all associated data at any time." },
  { q: "What job boards are supported?", a: "Currently, our Chrome extension supports LinkedIn, Indeed, and Glassdoor. You can also manually add jobs from any source." },
  { q: "How is this different from other resume builders?", a: "Resume Genie is a complete job search platform \u2014 not just a resume builder. We combine AI tailoring, ATS optimization, job saving, application tracking, cover letter generation, and interview prep into one seamless workflow." },
];

const heroTabs = [
  {
    label: "AI Resume Builder",
    content: (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded bg-brand-blue/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div className="text-sm font-semibold text-gray-900">Tailored Resume</div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-2 bg-gray-100 rounded w-full"></div>
            <div className="h-2 bg-gray-100 rounded w-5/6"></div>
            <div className="h-2 bg-gray-100 rounded w-full"></div>
            <div className="h-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-100 rounded w-full"></div>
            <div className="h-2 bg-gray-100 rounded w-4/5"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-brand-blue/30 rounded w-full"></div>
            <div className="h-2 bg-brand-blue/10 rounded w-full"></div>
            <div className="h-2 bg-brand-blue/10 rounded w-3/4"></div>
            <div className="h-4"></div>
            <div className="h-3 bg-brand-blue/30 rounded w-full"></div>
            <div className="h-2 bg-brand-blue/10 rounded w-full"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "Application Tracker",
    content: (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-900">Your Applications</div>
          <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-full">21 Active</span>
        </div>
        <div className="space-y-3">
          {[
            { company: "Google", role: "Senior SWE", status: "Interview", statusColor: "bg-brand-blue text-white" },
            { company: "Stripe", role: "Frontend Eng", status: "Applied", statusColor: "bg-gray-200 text-gray-600" },
            { company: "Vercel", role: "Full Stack", status: "Screening", statusColor: "bg-brand-cyan/20 text-brand-cyan" },
            { company: "Notion", role: "React Dev", status: "Offer", statusColor: "bg-green-100 text-green-700" },
          ].map((app) => (
            <div key={app.company} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">{app.company}</div>
                <div className="text-xs text-gray-500">{app.role}</div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${app.statusColor}`}>{app.status}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: "ATS Matching",
    content: (
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="text-center mb-5">
          <div className="text-5xl font-bold text-brand-blue">92%</div>
          <div className="text-sm text-gray-500 mt-1">ATS Compatibility Score</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-5">
          <div className="bg-brand-blue h-3 rounded-full transition-all" style={{ width: "92%" }}></div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="font-semibold text-green-700">13/14</div>
            <div className="text-xs text-green-600">Keywords</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="font-semibold text-green-700">Pass</div>
            <div className="text-xs text-green-600">Formatting</div>
          </div>
          <div className="bg-brand-blue-light rounded-lg p-3 text-center">
            <div className="font-semibold text-brand-blue">9/10</div>
            <div className="text-xs text-brand-blue">Skills</div>
          </div>
          <div className="bg-brand-blue-light rounded-lg p-3 text-center">
            <div className="font-semibold text-brand-blue">Strong</div>
            <div className="text-xs text-brand-blue">Experience</div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.title = "ResumeGenie - AI-Powered Job Applications";
  }, []);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

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
            <span className="font-dm-serif text-xl font-bold text-gray-900">Resume Genie</span>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#templates" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Templates</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <button
                onClick={() => signIn("google")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Log In
              </button>
              <button
                onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                className="bg-brand-blue text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-blue-dark transition-colors"
              >
                Sign Up Free
              </button>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
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
                <a href="#features" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#how-it-works" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#templates" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>Templates</a>
                <a href="#pricing" className="text-sm text-gray-600" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                <button
                  onClick={() => signIn("google")}
                  className="text-sm text-gray-600 text-left font-medium"
                >
                  Log In
                </button>
                <button
                  onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                  className="bg-brand-blue text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-blue-dark transition-colors w-full"
                >
                  Sign Up Free
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ===== 2. HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-warm to-white pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-24">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-blue/10 text-brand-blue text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI-Powered Job Search Platform
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
              Land your dream job{" "}
              <span className="text-brand-blue">faster</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create ATS-optimized resumes and cover letters tailored to every job.
              Save listings, track applications, and prep for interviews \u2014 all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                className="flex items-center justify-center gap-3 bg-brand-blue text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-blue-dark transition-all hover:shadow-lg text-base"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Get Started with Google
              </button>
              <a
                href="#how-it-works"
                className="flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-all border border-gray-200 text-base"
              >
                See How It Works
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-400">100% free to start. No credit card required.</p>
          </div>

          {/* Hero Tab Preview */}
          <div className="max-w-xl mx-auto">
            <div className="flex border-b border-gray-200 mb-6">
              {heroTabs.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 text-sm font-medium py-3 border-b-2 transition-colors ${
                    activeTab === i
                      ? "border-brand-blue text-brand-blue"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {heroTabs[activeTab].content}
          </div>
        </div>
      </section>

      {/* ===== 3. SOCIAL PROOF BAR ===== */}
      <section className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "15+", label: "ATS Factors Analyzed" },
              { number: "6", label: "Resume Templates" },
              { number: "5", label: "Interview Stages" },
              { number: "3", label: "Job Boards Supported" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-brand-gold">{stat.number}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. FEATURE SECTIONS (x6) ===== */}
      <div id="features">
        {features.map((feature, i) => {
          const isReversed = i % 2 === 1;
          const colors = colorMap[feature.color];
          return (
            <section
              key={feature.title}
              className={`py-20 lg:py-28 ${i % 2 === 1 ? "bg-brand-gray" : "bg-white"}`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${isReversed ? "lg:direction-rtl" : ""}`}>
                  <div className={isReversed ? "lg:order-2" : ""}>
                    <div className={`w-12 h-12 ${colors.bgLight} rounded-xl flex items-center justify-center mb-5`}>
                      <span className={colors.text}>{feature.icon}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                  <div className={isReversed ? "lg:order-1" : ""}>
                    {feature.mockup}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ===== 5. HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-brand-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Go from job listing to tailored application in minutes, not hours.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
            {[
              { num: 1, title: "Sign Up", desc: "Create your free account with Google. It takes seconds." },
              { num: 2, title: "Import Resume", desc: "Upload your existing resume or import from LinkedIn. Our AI builds your master profile." },
              { num: 3, title: "Tailor & Apply", desc: "Save a job listing, and get an ATS-optimized resume and cover letter tailored to it." },
              { num: 4, title: "Track & Land", desc: "Monitor every application from apply to offer. Get interview prep based on the role." },
            ].map((step, i) => (
              <div key={step.num} className="relative text-center">
                <div className="w-16 h-16 bg-brand-blue text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-brand-blue/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. TEMPLATES GRID ===== */}
      <section id="templates" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Professionally designed templates
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from 6 ATS-friendly templates designed for different industries and roles.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t) => (
              <div key={t.name} className={`bg-white border-2 ${t.accent} rounded-xl p-6 hover:shadow-lg transition-shadow`}>
                {/* CSS mockup of a resume */}
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

      {/* ===== 7. TESTIMONIALS ===== */}
      <section id="testimonials" className="py-20 lg:py-28 bg-brand-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What job seekers are saying
            </h2>
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
                <p className="text-gray-700 leading-relaxed mb-6">
                  &quot;{t.quote}&quot;
                </p>
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

      {/* ===== 8. PRICING ===== */}
      <section id="pricing" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start free and upgrade when you need more power.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <div className="text-lg font-semibold text-gray-900 mb-1">Free</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
              <div className="text-sm text-gray-500 mb-6">Forever free</div>
              <ul className="space-y-3 mb-8">
                {[
                  "3 AI resume generations/month",
                  "1 resume template",
                  "ATS score checker",
                  "Application tracker",
                  "Chrome extension",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                className="w-full py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-base"
              >
                Get Started Free
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white border-2 border-brand-blue rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-gray-900 text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">Premium</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">$12<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <div className="text-sm text-gray-500 mb-6">Billed monthly</div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited AI resume generations",
                  "All 6 resume templates",
                  "AI cover letter generation",
                  "Interview prep questions",
                  "Priority support",
                  "Gmail integration",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-brand-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                className="w-full py-3 px-6 rounded-xl bg-brand-blue text-white font-semibold hover:bg-brand-blue-dark transition-colors text-base"
              >
                Start Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 9. FAQ ACCORDION ===== */}
      <section id="faq" className="py-20 lg:py-28 bg-brand-gray">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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

      {/* ===== 10. FINAL CTA ===== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-blue rounded-3xl px-8 py-16 sm:px-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to land your next role?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Stop sending the same resume to every job. Start tailoring your applications and watch the interviews roll in.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
              className="inline-flex items-center gap-3 bg-white text-brand-blue font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-all text-base shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Get Started with Google
            </button>
            <p className="mt-4 text-white/60 text-sm">Free forever. No credit card needed.</p>
          </div>
        </div>
      </section>

      {/* ===== 11. FOOTER ===== */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="font-dm-serif text-lg font-bold text-gray-900">Resume Genie</span>
              <p className="text-sm text-gray-500 mt-3 max-w-xs">
                AI-powered resumes and cover letters tailored to every job. ATS-optimized, human-crafted, and uniquely yours.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-gray-500 hover:text-gray-700">Features</a></li>
                <li><a href="#templates" className="text-sm text-gray-500 hover:text-gray-700">Templates</a></li>
                <li><a href="#pricing" className="text-sm text-gray-500 hover:text-gray-700">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-700">How It Works</a></li>
                <li><a href="#testimonials" className="text-sm text-gray-500 hover:text-gray-700">Testimonials</a></li>
                <li><a href="#faq" className="text-sm text-gray-500 hover:text-gray-700">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Get Started</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => signIn("google")}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Log In
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign Up Free
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Resume Genie. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="text-sm text-gray-400 hover:text-gray-600">Privacy Policy</a>
              <a href="/terms" className="text-sm text-gray-400 hover:text-gray-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
