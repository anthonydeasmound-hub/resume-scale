import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { queryOne, execute } from "@/lib/db";
import Groq from "groq-sdk";
import { z } from "zod";

// Increase body size limit to handle large LinkedIn page HTML
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const inputSchema = z.object({
  // Allow up to 5MB of raw HTML - we clean and truncate it to 50KB before sending to AI
  html: z.string().min(1).max(5000000),
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
  console.log("[parse-html] === NEW REQUEST ===");
  console.log("[parse-html] Request received at:", new Date().toISOString());

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
    const { html } = parsed.data;
    let { profile_url } = parsed.data;

    // If URL is /in/me/, try to extract the real profile URL from the HTML
    if (!profile_url || profile_url.includes("/in/me")) {
      // Try canonical link
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      if (canonicalMatch && canonicalMatch[1] && canonicalMatch[1].includes("/in/")) {
        profile_url = canonicalMatch[1];
        console.log("[parse-html] Extracted canonical URL:", profile_url);
      }

      // Try og:url meta tag
      if (!profile_url || profile_url.includes("/in/me")) {
        const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
        if (ogUrlMatch && ogUrlMatch[1] && ogUrlMatch[1].includes("/in/")) {
          profile_url = ogUrlMatch[1];
          console.log("[parse-html] Extracted og:url:", profile_url);
        }
      }
    }

    // Clean the LinkedIn URL to only include the base profile URL
    // e.g., https://www.linkedin.com/in/username/opportunities/... -> https://www.linkedin.com/in/username/
    if (profile_url && profile_url.includes("/in/")) {
      const linkedinMatch = profile_url.match(/(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\/\?]+)/i);
      if (linkedinMatch) {
        profile_url = linkedinMatch[1] + "/";
        console.log("[parse-html] Cleaned LinkedIn URL:", profile_url);
      }
    }

    // Extract text content from HTML to reduce size
    // Remove script, style, and other non-content tags, but preserve text
    let cleanedHtml = html
      // Remove ALL script tags (including application/json, application/ld+json, etc.)
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      // Remove style tags and their content
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      // Remove noscript tags
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      // Remove SVG tags
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      // Remove head section entirely
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      // Remove nav sections
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      // Remove footer sections
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      // Remove aside sections (typically ads/sidebar)
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      // Remove code/pre tags (often contain JSON data)
      .replace(/<code[\s\S]*?<\/code>/gi, "")
      .replace(/<pre[\s\S]*?<\/pre>/gi, "")
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
      .replace(/&#x27;/g, "'")
      .replace(/&#\d+;/g, " ")
      // Remove LinkedIn internal JSON/tracking data patterns
      .replace(/\{"[\w$]+":[\s\S]*?\}/g, " ")
      .replace(/urn:li:\w+:[^\s]+/g, " ")
      .replace(/\$type"?:\s*"[^"]+"/g, " ")
      .replace(/entityUrn/g, " ")
      .replace(/trackingId/g, " ")
      .replace(/chameleon\w*/gi, " ")
      .replace(/voyager\w*/gi, " ")
      .replace(/lixTracking/g, " ")
      // Remove common LinkedIn navigation text
      .replace(/Home\s+My Network\s+Jobs\s+Messaging\s+Notifications\s+Me/gi, "")
      .replace(/Skip to main content/gi, "")
      .replace(/Try Premium Free/gi, "")
      .replace(/Add profile section/gi, "")
      .replace(/Show all \d+ \w+/gi, "")
      .replace(/\d+ connections?/gi, "")
      .replace(/\d+ followers?/gi, "")
      .replace(/\d+ notifications? total/gi, "")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Truncate if too long (LLM has token limits)
    // Use 12KB - enough for profile content without navigation noise
    const maxLength = 12000;
    const textContent = cleanedHtml.length > maxLength
      ? cleanedHtml.substring(0, maxLength)
      : cleanedHtml;


    // Log samples of the text to debug what we're sending to the AI
    console.log("[parse-html] Cleaned text length:", textContent.length);
    console.log("[parse-html] Text start (first 500 chars):", textContent.substring(0, 500));
    console.log("[parse-html] Text middle (chars 3000-3500):", textContent.substring(3000, 3500));
    console.log("[parse-html] Calling GROQ API...");

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

CRITICAL RULES:
- ONLY extract information that is EXPLICITLY stated in the text below
- NEVER fabricate, invent, or make up any data
- If you cannot find a person's name, use empty string - do NOT use "John Doe" or similar
- If you cannot find work experience, return empty array - do NOT invent companies like "ABC Corp" or "XYZ Inc"
- If information is not found, use empty string "" or empty array []
- Extract up to 10 work experiences and 20 skills
- Return ONLY valid JSON, no markdown, no explanation

LinkedIn Profile Text Content:
${textContent}`;

    // Helper function to call GROQ and get response with rate limit retry
    async function callGroq(): Promise<string> {
      const maxRetries = 3;
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          console.log("[parse-html] Calling GROQ with model: llama-3.1-8b-instant" + (retry > 0 ? ` (retry ${retry})` : ""));
          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: "system",
                content: "You extract LinkedIn profile data into valid JSON. Output ONLY a JSON object, no other text. Keep skills list to max 20 items. Be concise."
              },
              { role: "user", content: prompt }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0,
            max_tokens: 4000,
          });
          console.log("[parse-html] GROQ API call successful");
          return completion.choices[0]?.message?.content || "";
        } catch (error: unknown) {
          const err = error as { status?: number; message?: string };
          if (err.status === 429 && retry < maxRetries - 1) {
            // Rate limited - wait and retry
            const waitTime = 15 + (retry * 5); // 15s, 20s, 25s
            console.log(`[parse-html] Rate limited, waiting ${waitTime}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          } else {
            throw error;
          }
        }
      }
      throw new Error("Max retries exceeded");
    }

    // Try up to 2 attempts to get valid JSON
    let responseText = "";
    let parsedData: unknown = null;
    const maxAttempts = 2;

    // Helper function to try parsing JSON with various fixes
    function tryParseJSON(text: string): unknown | null {
      // Try direct parse first
      try {
        return JSON.parse(text);
      } catch {
        // Continue to fixes
      }

      // Fix 1: Remove trailing commas before } or ]
      let fixed = text.replace(/,(\s*[}\]])/g, "$1");
      try {
        return JSON.parse(fixed);
      } catch {
        // Continue
      }

      // Fix 2: Try to find JSON object boundaries more carefully
      // Find the first { and match to its closing }
      const startIdx = text.indexOf("{");
      if (startIdx === -1) return null;

      let depth = 0;
      let endIdx = -1;
      let inString = false;
      let escapeNext = false;

      for (let i = startIdx; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "{") depth++;
          else if (char === "}") {
            depth--;
            if (depth === 0) {
              endIdx = i;
              break;
            }
          }
        }
      }

      if (endIdx === -1) return null;

      const extracted = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(extracted);
      } catch {
        // Try with trailing comma fix on extracted
        const fixedExtracted = extracted.replace(/,(\s*[}\]])/g, "$1");
        try {
          return JSON.parse(fixedExtracted);
        } catch {
          return null;
        }
      }
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[parse-html] Attempt ${attempt}/${maxAttempts}`);
        responseText = await callGroq();
        console.log("[parse-html] GROQ API responded, response length:", responseText.length);

        // Clean up response - remove markdown code blocks if present
        responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        console.log("[parse-html] Cleaned response (first 500 chars):", responseText.substring(0, 500));

        parsedData = tryParseJSON(responseText);

        if (parsedData) {
          console.log(`[parse-html] Successfully parsed JSON on attempt ${attempt}`);
          break;
        }

        console.log(`[parse-html] Attempt ${attempt} failed to produce valid JSON`);
      } catch (groqError) {
        console.error(`[parse-html] GROQ API error on attempt ${attempt}:`, groqError);
        if (attempt === maxAttempts) {
          throw groqError;
        }
      }
    }

    if (!parsedData) {
      console.error("[parse-html] All JSON parsing attempts failed after retries");
      console.error("[parse-html] Last response text (first 1000 chars):", responseText.substring(0, 1000));
      return NextResponse.json(
        { error: "Failed to parse AI response", details: "Could not extract valid JSON from AI response after multiple attempts" },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("[parse-html] Successfully parsed JSON response");

    // Transform to our standard format
    interface ParsedExperience { company?: string; title?: string; start_date?: string; end_date?: string; description?: string | string[]; }
    interface ParsedEducation { institution?: string; degree?: string; field?: string; graduation_date?: string; }
    interface ParsedCertification { name?: string; issuer?: string; date?: string; }
    interface ParsedHonor { title?: string; issuer?: string; date?: string; }
    interface ParsedProfile {
      name?: string;
      location?: string;
      about?: string;
      experience?: ParsedExperience[];
      education?: ParsedEducation[];
      skills?: string[];
      certifications?: ParsedCertification[];
      languages?: string[];
      honors?: ParsedHonor[];
    }

    const profile = parsedData as ParsedProfile;

    // Check for hallucinated/fake data patterns
    const fakeNames = ["john doe", "jane doe", "john smith", "jane smith", "test user", "sample user"];
    const fakeCompanies = ["abc corp", "abc corporation", "xyz inc", "xyz corp", "acme", "company name", "example corp"];

    const nameLower = (profile.name || "").toLowerCase();
    const hasHallucinatedName = fakeNames.some(fake => nameLower.includes(fake));

    const hasHallucinatedCompany = (profile.experience || []).some(exp => {
      const companyLower = (exp.company || "").toLowerCase();
      return fakeCompanies.some(fake => companyLower.includes(fake));
    });

    if (hasHallucinatedName || hasHallucinatedCompany) {
      console.error("[parse-html] Detected hallucinated/fake data - AI made up content instead of extracting");
      console.error("[parse-html] Name:", profile.name, "Companies:", profile.experience?.map(e => e.company));
      return NextResponse.json(
        { error: "Failed to extract profile data", details: "Could not find real profile content in the page. Please make sure you are on your LinkedIn profile page and try again." },
        { status: 400, headers: corsHeaders }
      );
    }

    const transformedData = {
      contact_info: {
        name: profile.name || "",
        email: userEmail,
        phone: "",
        location: profile.location || "",
        linkedin: profile_url || "",
      },
      work_experience: (profile.experience || []).map((exp: ParsedExperience) => ({
        company: exp.company || "",
        title: exp.title || "",
        start_date: exp.start_date || "",
        end_date: exp.end_date || "",
        description: exp.description
          ? (Array.isArray(exp.description) ? exp.description : [exp.description])
          : [],
      })),
      education: (profile.education || []).map((edu: ParsedEducation) => ({
        institution: edu.institution || "",
        degree: edu.degree || "",
        field: edu.field || "",
        graduation_date: edu.graduation_date || "",
      })),
      skills: profile.skills || [],
      certifications: (profile.certifications || []).map((cert: ParsedCertification) => ({
        name: cert.name || "",
        issuer: cert.issuer || "",
        date: cert.date || "",
      })),
      languages: profile.languages || [],
      honors: (profile.honors || []).map((honor: ParsedHonor) => ({
        title: honor.title || "",
        issuer: honor.issuer || "",
        date: honor.date || "",
      })),
      profile_picture_url: "",
      about: profile.about || "",
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[parse-html] Error message:", errorMessage);
    return NextResponse.json(
      { error: "Failed to parse LinkedIn profile", details: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
