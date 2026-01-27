# ResumeGenie Architecture

## Overview

ResumeGenie is a local-first application that helps users create ATS-optimized resumes and cover letters tailored to specific job applications. It uses AI (Gemini) to parse resumes, research companies, and generate personalized documents.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 + React | Server-side rendering, routing |
| Styling | Tailwind CSS | Utility-first CSS |
| Auth | NextAuth.js | Google OAuth + Gmail API access |
| Database | SQLite (better-sqlite3) | Local data persistence |
| AI | Google Gemini API | Resume parsing, cover letter generation |
| PDF | TBD | Document generation |

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/
│   │   ├── auth/[...nextauth]/  # Auth API routes
│   │   ├── jobs/           # Job application CRUD
│   │   ├── resume/
│   │   │   ├── parse/      # Gemini resume parsing
│   │   │   └── save/       # Save parsed resume
│   │   └── stats/          # Dashboard statistics
│   ├── dashboard/          # Main dashboard (Tab 1)
│   │   └── page.tsx        # Stats + job input form
│   ├── review/             # Review tab (Tab 2)
│   │   └── page.tsx
│   ├── applied/            # Applied tab (Tab 3)
│   │   └── page.tsx
│   ├── onboarding/         # Resume upload flow
│   │   └── page.tsx
│   ├── layout.tsx          # Root layout with SessionProvider
│   ├── page.tsx            # Landing page
│   └── globals.css
├── components/             # Reusable React components
│   ├── SessionProvider.tsx
│   └── TabsNav.tsx         # Tab navigation with badge
├── lib/                    # Utilities and configuration
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # SQLite database setup
│   └── gemini.ts           # Gemini AI integration
└── types/                  # TypeScript type definitions
    └── next-auth.d.ts      # NextAuth type extensions
```

## Database Schema

### users
- `id`: Primary key
- `email`: User's Google email
- `name`: Display name
- `image`: Profile picture URL
- `created_at`: Timestamp

### resumes
- `id`: Primary key
- `user_id`: Foreign key to users
- `contact_info`: JSON - name, email, phone, location
- `work_experience`: JSON - array of jobs
- `skills`: JSON - array of skills
- `education`: JSON - array of degrees
- `raw_text`: Original resume text

### job_applications
- `id`: Primary key
- `user_id`: Foreign key to users
- `company_name`: Target company
- `job_title`: Position applied for
- `job_description`: Full JD text
- `tailored_resume`: JSON - customized resume
- `cover_letter`: Generated cover letter
- `resume_style`: Template style name
- `resume_color`: Hex color code
- `status`: draft | review | applied | interview | rejected | offer
- `date_applied`: When application was submitted
- `interview_1-5`: Interview stage notes

## Authentication Flow

1. User clicks "Sign in with Google" on landing page
2. NextAuth redirects to Google OAuth
3. User grants access to profile + Gmail (readonly)
4. Callback stores access token for Gmail API
5. User redirected to onboarding (first time) or dashboard

## Application Flow

### Onboarding
1. User uploads existing resume (PDF/DOCX)
2. Gemini AI extracts structured data (contact, experience, skills, education)
3. User reviews and confirms extracted data
4. Data saved to `resumes` table

### Creating a Job Application
1. User pastes job description in dashboard
2. System creates new `job_application` with status "review"
3. Gemini researches company (website, mission, goals)
4. Gemini tailors resume to match JD
5. Gemini generates cover letter connecting user experience to company

### Review Tab
- Shows all applications with status "review"
- Red badge shows count of unreviewed
- User can edit tailored resume/cover letter
- User can change style/color
- Download PDF when ready
- Submit moves status to "applied"

### Applied Tab
- Grid view of all "applied" applications
- Columns: Company, Date, Interview Progress (1-5)
- Color coding: Red (rejected), Yellow (waiting), Green (in progress)

### Gmail Integration
- Polls Gmail API for emails from known company domains
- Detects confirmation emails → updates status
- Detects rejection emails → marks red
- Detects interview invites → updates interview stages

## Environment Variables

```
GOOGLE_CLIENT_ID      # OAuth client ID
GOOGLE_CLIENT_SECRET  # OAuth client secret
NEXTAUTH_URL          # App URL (http://localhost:3000)
NEXTAUTH_SECRET       # Random secret for JWT
GEMINI_API_KEY        # Google Gemini API key
```

## Status

### Phase 1: Foundation (Complete)
- [x] Next.js project setup
- [x] Tailwind CSS
- [x] NextAuth with Google OAuth
- [x] SQLite database schema
- [x] Landing page with sign-in

### Phase 2: Onboarding (Complete)
- [x] Resume upload page (paste text)
- [x] Gemini resume parsing (gemini-1.5-flash)
- [x] Data review/confirm UI
- [x] Save to database

### Phase 3: Dashboard (Complete)
- [x] Stats display (resumes, cover letters, applied, interviews, rejections, offers)
- [x] Job description input form
- [x] Tab navigation (Dashboard, Review, Applied)
- [x] API routes for stats and job creation

### Phase 4: Review Tab (Complete)
- [x] AI-generated tailored resume (Gemini)
- [x] AI-generated cover letter (Gemini)
- [x] Resume/cover letter preview
- [x] Style customization (Classic, Modern, Minimal)
- [x] Color customization (5 colors)
- [x] PDF download (html2pdf.js)
- [x] Mark as Applied workflow

### Phase 5: Applied Tab (Complete)
- [x] Table view with company, position, date applied
- [x] Clickable status badges (applied, interview, rejected, offer)
- [x] Interview progress tracking (5 stages)
- [x] Color-coded status (gray=pending, yellow=scheduled, green=completed, red=rejected)
- [x] Row highlighting (red for rejected, green for offers)

### Phase 6: Gmail Integration (Complete)
- [x] Gmail API service for fetching recent job-related emails
- [x] Gemini-powered email classification (confirmation, rejection, interview, offer)
- [x] Auto-update job statuses based on email content
- [x] Dashboard "Check Emails" button with update notifications
- [x] Color-coded update messages
