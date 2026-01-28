import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import Groq from "groq-sdk";
import { z } from "zod";

const workExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  description: z.array(z.string()).optional().default([]),
});

const inputSchema = z.object({
  resume: z.object({
    work_experience: z.array(workExperienceSchema).min(1),
    skills: z.array(z.string()),
    education: z.array(z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string(),
    })).optional(),
  }),
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

async function callAI(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
  });
  return completion.choices[0]?.message?.content || "";
}

// Parse date string like "Apr 2023" or "Present" into a Date
function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  const lower = dateStr.toLowerCase().trim();
  if (lower === "present" || lower === "current" || lower === "") return new Date();

  const months: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11
  };

  const parts = dateStr.trim().split(/[\s,]+/);
  let month = 0;
  let year = new Date().getFullYear();

  for (const part of parts) {
    const monthNum = months[part.toLowerCase()];
    if (monthNum !== undefined) {
      month = monthNum;
    } else if (/^\d{4}$/.test(part)) {
      year = parseInt(part);
    }
  }

  return new Date(year, month, 1);
}

// Calculate total years of experience from work history
function calculateYearsOfExperience(workExperience: Array<{ start_date: string; end_date: string }>): number {
  if (!workExperience || workExperience.length === 0) return 0;

  let earliestStart = new Date();
  let latestEnd = new Date(0);

  for (const exp of workExperience) {
    const startDate = parseDateString(exp.start_date);
    const endDate = parseDateString(exp.end_date);

    if (startDate < earliestStart) {
      earliestStart = startDate;
    }
    if (endDate > latestEnd) {
      latestEnd = endDate;
    }
  }

  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const years = Math.floor((latestEnd.getTime() - earliestStart.getTime()) / msPerYear);

  return Math.max(1, years);
}

interface WorkExperience {
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string[];
}

interface ResumeData {
  work_experience: WorkExperience[];
  skills: string[];
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(session.user.email);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { resume } = parsed.data as { resume: ResumeData };

    // Calculate years of experience
    const totalYears = calculateYearsOfExperience(resume.work_experience);

    // Get most recent role
    const mostRecent = resume.work_experience[0];

    // Extract key achievements (bullets with metrics)
    const allBullets = resume.work_experience.flatMap(exp => exp.description || []);
    const achievementBullets = allBullets
      .filter(b => /\d+%|\$[\d.,]+[KMB]?|\d+\+/.test(b))
      .slice(0, 3);

    // Get unique job titles for career identity
    const uniqueTitles = [...new Set(resume.work_experience.map(exp => exp.title))].slice(0, 3);

    // Get top skills
    const topSkills = resume.skills.slice(0, 8);

    const prompt = `Generate 3 professional resume summaries for someone with the following background:

**Career Overview:**
- Years of Experience: ${totalYears}+ years
- Most Recent Role: ${mostRecent.title} at ${mostRecent.company}
- Career Progression: ${uniqueTitles.join(" → ")}
- Core Skills: ${topSkills.join(", ")}
${achievementBullets.length > 0 ? `- Key Achievements: ${achievementBullets.join("; ")}` : ""}
${resume.education && resume.education.length > 0 ? `- Education: ${resume.education[0].degree} in ${resume.education[0].field} from ${resume.education[0].institution}` : ""}

**Requirements:**
- Each summary should be 2-3 sentences (40-60 words)
- Start with professional identity and years of experience
- Highlight 3-4 key skills or areas of expertise
- Include a quantifiable achievement if available (use ONLY the metrics provided above)
- Use confident, active language
- Make it versatile enough to apply to various roles in their field
- Do NOT invent metrics or achievements not listed above

**Generate 3 different summaries with varying emphasis:**
1. First summary: Focus on technical skills and expertise
2. Second summary: Focus on leadership and impact
3. Third summary: Focus on versatility and adaptability

RESPOND WITH ONLY A JSON ARRAY OF 3 STRINGS, NO OTHER TEXT:
["summary1", "summary2", "summary3"]`;

    const response = await callAI(prompt);

    // Parse the JSON response
    let summaries: string[] = [];
    try {
      // Find JSON array in response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        summaries = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse summaries:", parseError);
      // Fallback: try to extract quoted strings
      const matches = response.match(/"([^"]+)"/g);
      if (matches) {
        summaries = matches.map(m => m.replace(/^"|"$/g, ''));
      }
    }

    if (summaries.length === 0) {
      return NextResponse.json({ error: "Failed to generate summaries" }, { status: 500 });
    }

    return NextResponse.json({ summaries });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
