import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { queryOne, execute } from "@/lib/db";
import Groq from "groq-sdk";
import { z } from "zod";

const inputSchema = z.object({
  html: z.string().min(1).max(500000),
  profile_url: z.string().max(2000).optional(),
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

// CORS headers for Chrome extension
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  // Check for token auth (from Chrome extension)
  const authHeader = request.headers.get("Authorization");
  let userEmail: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    // Validate token from database
    const tokenRecord = await queryOne<{ email: string }>(
      "SELECT u.email FROM extension_tokens t JOIN users u ON t.user_id = u.id WHERE t.token = $1",
      [token]
    );

    if (tokenRecord) {
      userEmail = tokenRecord.email;
    }
  }

  // Fall back to session auth
  if (!userEmail) {
    const session = await getServerSession(authOptions);
    userEmail = session?.user?.email || null;
  }

  if (!userEmail) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  const rateLimited = await checkRateLimit(userEmail);
  if (rateLimited) return rateLimited;

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Groq API key not configured" },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400, headers: corsHeaders });
    }
    const { html, profile_url } = parsed.data;


    // Extract text content from HTML to reduce size
    // Remove script, style, and other non-content tags, but preserve text
    let cleanedHtml = html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove style tags and their content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      // Remove noscript tags
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
      // Remove SVG tags
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, "")
      // Add space before closing tags to separate words
      .replace(/<\//g, " </")
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Truncate if too long (LLM has token limits)
    const maxLength = 50000;
    const textContent = cleanedHtml.length > maxLength
      ? cleanedHtml.substring(0, maxLength)
      : cleanedHtml;


    // Log samples of the text to debug what we're sending to the AI

    const prompt = `You are parsing a LinkedIn profile page. Extract the following information from this text content and return it as valid JSON only (no markdown, no explanation, no code blocks).

The JSON structure should be exactly:
{
  "name": "Full Name",
  "headline": "Professional headline/title",
  "location": "City, State/Country",
  "about": "About section summary",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "start_date": "Month Year (e.g., Jan 2020)",
      "end_date": "Month Year or Present",
      "description": "Job description if available"
    }
  ],
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "graduation_date": "Year or Date Range"
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date"
    }
  ],
  "languages": ["Language 1", "Language 2"],
  "honors": [
    {
      "title": "Award Name",
      "issuer": "Organization",
      "date": "Date"
    }
  ]
}

Important:
- Extract ALL work experience entries you can find
- Extract ALL skills mentioned anywhere in the profile - look for skill names, technologies, methodologies, tools, certifications mentioned
- Skills are often listed as endorsements or in bullet points - include ALL of them
- Common skill patterns: "X skills", "Endorsed for X", skill names followed by endorsement counts
- For dates, use the format shown (e.g., "Jan 2020", "Present")
- If a field is not found, use an empty string or empty array
- Return ONLY valid JSON, no markdown code blocks, no explanation

LinkedIn Profile Text Content:
${textContent}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    let responseText = completion.choices[0]?.message?.content || "";

    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();


    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[parse-html] Failed to parse AI response:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Transform to our standard format
    const transformedData = {
      contact_info: {
        name: parsedData.name || "",
        email: userEmail,
        phone: "",
        location: parsedData.location || "",
        linkedin: profile_url || "",
      },
      work_experience: (parsedData.experience || []).map((exp: any) => ({
        company: exp.company || "",
        title: exp.title || "",
        start_date: exp.start_date || "",
        end_date: exp.end_date || "",
        description: exp.description
          ? (Array.isArray(exp.description) ? exp.description : [exp.description])
          : [],
      })),
      education: (parsedData.education || []).map((edu: any) => ({
        institution: edu.institution || "",
        degree: edu.degree || "",
        field: edu.field || "",
        graduation_date: edu.graduation_date || "",
      })),
      skills: parsedData.skills || [],
      certifications: (parsedData.certifications || []).map((cert: any) => ({
        name: cert.name || "",
        issuer: cert.issuer || "",
        date: cert.date || "",
      })),
      languages: parsedData.languages || [],
      honors: (parsedData.honors || []).map((honor: any) => ({
        title: honor.title || "",
        issuer: honor.issuer || "",
        date: honor.date || "",
      })),
      profile_picture_url: "",
      about: parsedData.about || "",
    };

    // Get or create user
    let user = await queryOne<{ id: number }>("SELECT * FROM users WHERE email = $1", [userEmail]);

    if (!user) {
      const result = await execute("INSERT INTO users (email) VALUES ($1) RETURNING id", [userEmail]);
      user = { id: result.rows[0].id as number };
    }

    // Store the import data
    await execute(`
      INSERT INTO linkedin_imports (user_id, profile_data, status)
      VALUES ($1, $2, 'pending')
      ON CONFLICT (user_id) DO UPDATE SET profile_data = $2, status = 'pending'
    `, [user.id, JSON.stringify(transformedData)]);

    return NextResponse.json(
      { success: true, data: transformedData },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[parse-html] Error:", error);
    return NextResponse.json(
      { error: "Failed to parse LinkedIn profile" },
      { status: 500, headers: corsHeaders }
    );
  }
}
