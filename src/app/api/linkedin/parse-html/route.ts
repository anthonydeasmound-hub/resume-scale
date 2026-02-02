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
  // Profile photo captured from browser as base64 (bypasses LinkedIn auth requirements)
  profile_photo_base64: z.string().max(2000000).optional(),
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

// Filter out invalid skills that are LinkedIn navigation/section items, not actual skills
function filterValidSkills(skills: string[]): string[] {
  const invalidSkillPatterns = [
    // LinkedIn section names and navigation
    /^schools?$/i,
    /^companies$/i,
    /^groups?$/i,
    /^interests?$/i,
    /^newsletters?$/i,
    /^top voices?$/i,
    /^followers?$/i,
    /^following$/i,
    /^connections?$/i,
    /^posts?$/i,
    /^articles?$/i,
    /^activity$/i,
    /^experience$/i,
    /^education$/i,
    /^licenses?$/i,
    /^certifications?$/i,
    /^volunteer/i,
    /^publications?$/i,
    /^patents?$/i,
    /^courses?$/i,
    /^projects?$/i,
    /^honors?$/i,
    /^awards?$/i,
    /^languages?$/i,
    /^organizations?$/i,
    // Job titles with "at" (these are work experience, not skills)
    / at /i,
    // LinkedIn badge patterns
    /and \+\d+ skills?$/i,
    /^\+\d+ skills?$/i,
    // Too short to be a real skill
    /^.{1,2}$/,
    // Contains only special characters or numbers
    /^[\d\s\W]+$/,
  ];

  return skills.filter(skill => {
    if (!skill || typeof skill !== 'string') return false;
    const trimmed = skill.trim();
    if (!trimmed) return false;

    // Check against invalid patterns
    for (const pattern of invalidSkillPatterns) {
      if (pattern.test(trimmed)) {
        console.log(`[parse-html] Filtered out invalid skill: "${trimmed}"`);
        return false;
      }
    }

    return true;
  });
}

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

  if (!process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "No AI API keys configured" },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400, headers: corsHeaders });
    }
    const { html, profile_photo_base64 } = parsed.data;
    let { profile_url } = parsed.data;

    // Use photo from extension if provided (most reliable since it's captured from the browser)
    console.log("[parse-html] Profile photo from extension:", profile_photo_base64 ? `${profile_photo_base64.length} chars` : "NOT PROVIDED");

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

    // Extract profile photo URL before stripping HTML
    let profilePhotoUrl = "";

    // Method 1: Look for profile photo in URL (most reliable - contains "profile-displayphoto")
    const profilePhotoMatch = html.match(/https:\/\/media\.licdn\.com\/dms\/image\/[^"'\s]*profile-displayphoto[^"'\s]*/i);
    if (profilePhotoMatch) {
      profilePhotoUrl = profilePhotoMatch[0].replace(/&amp;/g, '&');
      console.log("[parse-html] Found profile photo via displayphoto pattern:", profilePhotoUrl.substring(0, 100));
    }

    // Method 2: Try og:image meta tag (often contains profile photo)
    if (!profilePhotoUrl) {
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (ogImageMatch && ogImageMatch[1] && ogImageMatch[1].includes("licdn.com")) {
        profilePhotoUrl = ogImageMatch[1].replace(/&amp;/g, '&');
        console.log("[parse-html] Found profile photo via og:image:", profilePhotoUrl.substring(0, 100));
      }
    }

    // Method 3: Look for any LinkedIn profile image URL patterns
    if (!profilePhotoUrl) {
      // Try various LinkedIn image URL patterns
      const patterns = [
        /https:\/\/media\.licdn\.com\/dms\/image\/[A-Za-z0-9_-]+\/[^"'\s]+/i,
        /https:\/\/media\.licdn\.com\/dms\/image\/v2\/[^"'\s]+/i,
        /https:\/\/media-exp\d*\.licdn\.com\/dms\/image\/[^"'\s]+/i,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          // Prefer larger images (profile photos are usually 400x400 or 800x800)
          const url = match[0].replace(/&amp;/g, '&');
          if (url.includes('400') || url.includes('800') || url.includes('profile')) {
            profilePhotoUrl = url;
            console.log("[parse-html] Found profile photo via pattern match:", profilePhotoUrl.substring(0, 100));
            break;
          }
        }
      }
    }

    // Method 4: Last resort - find any licdn.com image
    if (!profilePhotoUrl) {
      const anyLinkedInImg = html.match(/https:\/\/media\.licdn\.com\/dms\/image\/[^"'\s]+/i);
      if (anyLinkedInImg) {
        profilePhotoUrl = anyLinkedInImg[0].replace(/&amp;/g, '&');
        console.log("[parse-html] Found profile photo via fallback:", profilePhotoUrl.substring(0, 100));
      }
    }

    console.log("[parse-html] Final profile photo URL:", profilePhotoUrl ? profilePhotoUrl.substring(0, 100) : "NONE FOUND");

    // Try to download the photo and convert to base64 (LinkedIn URLs often expire or require auth)
    let profilePhotoBase64 = "";
    if (profilePhotoUrl) {
      try {
        console.log("[parse-html] Attempting to download profile photo...");
        const photoResponse = await fetch(profilePhotoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Referer': 'https://www.linkedin.com/',
          },
        });

        if (photoResponse.ok) {
          const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';
          const buffer = await photoResponse.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          profilePhotoBase64 = `data:${contentType};base64,${base64}`;
          console.log("[parse-html] Successfully downloaded profile photo, size:", buffer.byteLength);
        } else {
          console.log("[parse-html] Failed to download photo, status:", photoResponse.status);
        }
      } catch (photoError) {
        console.error("[parse-html] Error downloading profile photo:", photoError);
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
      "company": "Company Name (REQUIRED - never leave empty)",
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
- IMPORTANT: For each work experience, the "company" field is REQUIRED. On LinkedIn, when a person has multiple roles at the same company, the company name appears ONCE above all those roles. Make sure to assign that company name to EACH role/position listed under it.
- Look for company names that appear before job titles - they often appear as "Company Name" followed by "Full-time" or employment type, then the job titles below
- If information is not found, use empty string "" or empty array []
- Extract up to 10 work experiences and 20 skills
- Return ONLY valid JSON, no markdown, no explanation

LinkedIn Profile Text Content:
${textContent}`;

    // Helper function to call OpenRouter API (fallback)
    async function callOpenRouter(): Promise<string> {
      if (!openRouterApiKey) {
        throw new Error("OPENROUTER_API_KEY is not configured");
      }
      console.log("[parse-html] Using OpenRouter fallback (Kimi K2)");

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
          "X-Title": "ResumeGenie",
        },
        body: JSON.stringify({
          model: "moonshotai/kimi-k2",
          messages: [
            {
              role: "system",
              content: "You extract LinkedIn profile data into valid JSON. Output ONLY a JSON object, no other text. Keep skills list to max 20 items. Be concise."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("[parse-html] OpenRouter error:", response.status, errorData);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log("[parse-html] OpenRouter API call successful");
      return data.choices?.[0]?.message?.content || "";
    }

    // Helper function to call GROQ with OpenRouter fallback
    async function callGroq(): Promise<string> {
      // Try GROQ first if available
      if (process.env.GROQ_API_KEY) {
        try {
          console.log("[parse-html] Calling GROQ with model: llama-3.1-8b-instant");
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
          // Rate limited - fall back to OpenRouter instead of retrying
          if (err.status === 429 && openRouterApiKey) {
            console.log("[parse-html] GROQ rate limited, falling back to OpenRouter");
            return await callOpenRouter();
          }
          throw error;
        }
      }

      // No GROQ key, try OpenRouter
      if (openRouterApiKey) {
        return await callOpenRouter();
      }

      throw new Error("No AI API keys configured");
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
      skills: filterValidSkills(profile.skills || []),
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
      // Prefer extension-captured photo (most reliable), then server-downloaded, then URL
      profile_picture_url: profile_photo_base64 || profilePhotoBase64 || profilePhotoUrl,
      about: profile.about || "",
    };

    console.log("[parse-html] Profile photo source:",
      profile_photo_base64 ? "EXTENSION" :
      profilePhotoBase64 ? "SERVER_DOWNLOAD" :
      profilePhotoUrl ? "URL_ONLY" : "NONE");
    console.log("[parse-html] Profile photo in transformed data:", transformedData.profile_picture_url ? transformedData.profile_picture_url.substring(0, 50) + "..." : "NONE");

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
