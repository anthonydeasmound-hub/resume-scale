import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

const SCRAPINGDOG_API_KEY = process.env.SCRAPINGDOG_API_KEY;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SCRAPINGDOG_API_KEY) {
    return NextResponse.json({ error: "Scrapingdog API key not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { linkedin_url } = body;

    if (!linkedin_url) {
      return NextResponse.json({ error: "LinkedIn URL is required" }, { status: 400 });
    }

    // Extract username from LinkedIn URL
    const urlMatch = linkedin_url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (!urlMatch) {
      return NextResponse.json({ error: "Invalid LinkedIn URL" }, { status: 400 });
    }
    const username = urlMatch[1];

    // Call Scrapingdog LinkedIn scraper
    const response = await fetch(
      `https://api.scrapingdog.com/linkedin/?api_key=${SCRAPINGDOG_API_KEY}&type=profile&linkId=${username}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RapidAPI error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to fetch LinkedIn profile" }, { status: 500 });
    }

    const profileData = await response.json();
    console.log("LinkedIn API response:", JSON.stringify(profileData, null, 2));

    // Transform API response to our format
    const transformedData = transformLinkedInData(profileData, session.user.email);

    // Get or create user
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      const result = db.prepare("INSERT INTO users (email, name, image) VALUES (?, ?, ?)").run(
        session.user.email,
        session.user.name || null,
        session.user.image || null
      );
      user = { id: result.lastInsertRowid as number };
    }

    // Store the import data
    db.prepare(`
      INSERT OR REPLACE INTO linkedin_imports (user_id, profile_data, status)
      VALUES (?, ?, 'pending')
    `).run(user.id, JSON.stringify(transformedData));

    return NextResponse.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("LinkedIn scrape error:", error);
    return NextResponse.json({ error: "Failed to scrape LinkedIn profile" }, { status: 500 });
  }
}

function transformLinkedInData(apiData: any, userEmail: string) {
  // Handle the API response structure
  const data = apiData.data || apiData;

  const contactInfo = {
    name: data.full_name || data.first_name + " " + data.last_name || "",
    email: userEmail,
    phone: "",
    location: data.location || data.city || "",
    linkedin: data.linkedin_url || data.profile_url || "",
  };

  // Transform work experience
  const workExperience = (data.experiences || data.experience || []).map((exp: any) => ({
    company: exp.company || exp.company_name || "",
    title: exp.title || exp.position || "",
    start_date: exp.start_date || exp.starts_at?.month && exp.starts_at?.year
      ? `${exp.starts_at.month}/${exp.starts_at.year}`
      : "",
    end_date: exp.end_date || (exp.ends_at?.month && exp.ends_at?.year
      ? `${exp.ends_at.month}/${exp.ends_at.year}`
      : exp.ends_at === null ? "Present" : ""),
    description: Array.isArray(exp.description) ? exp.description : (exp.description ? [exp.description] : []),
  }));

  // Transform education
  const education = (data.education || []).map((edu: any) => ({
    institution: edu.school || edu.school_name || edu.institution || "",
    degree: edu.degree || edu.degree_name || "",
    field: edu.field_of_study || edu.field || "",
    graduation_date: edu.end_date || (edu.ends_at?.year ? String(edu.ends_at.year) : ""),
  }));

  // Extract skills
  const skills = data.skills || [];

  // Transform certifications
  const certifications = (data.certifications || []).map((cert: any) => ({
    name: cert.name || cert.title || "",
    issuer: cert.authority || cert.issuer || "",
    date: cert.start_date || "",
  }));

  // Extract languages
  const languages = (data.languages || []).map((lang: any) =>
    typeof lang === "string" ? lang : lang.name || lang.language || ""
  );

  // Transform honors
  const honors = (data.honors_awards || data.honors || []).map((honor: any) => ({
    title: honor.title || honor.name || "",
    issuer: honor.issuer || "",
    date: honor.date || "",
  }));

  return {
    contact_info: contactInfo,
    work_experience: workExperience,
    education,
    skills,
    certifications,
    languages,
    honors,
    profile_picture_url: data.profile_pic_url || data.profile_picture_url || "",
    about: data.summary || data.about || "",
  };
}
