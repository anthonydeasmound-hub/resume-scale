import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

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
      `https://api.scrapingdog.com/linkedin/?api_key=${SCRAPINGDOG_API_KEY}&type=profile&linkId=${username}&premium=true`,
      {
        method: "GET",
      }
    );

    if (response.status === 202) {
      return NextResponse.json(
        { error: "LinkedIn profile is being fetched. Please wait a moment and try again." },
        { status: 202 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Scrapingdog error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to fetch LinkedIn profile" }, { status: 500 });
    }

    const rawData = await response.json();

    // Scrapingdog returns an array — use the first element
    const profileData = Array.isArray(rawData) ? rawData[0] : rawData;

    // Transform API response to our format
    const transformedData = transformLinkedInData(profileData, session.user.email);

    // Get or create user
    let user = await queryOne<{ id: number }>("SELECT * FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      const result = await execute("INSERT INTO users (email, name, image) VALUES ($1, $2, $3) RETURNING id", [
        session.user.email,
        session.user.name || null,
        session.user.image || null
      ]);
      user = { id: result.rows[0].id as number };
    }

    // Store the import data
    await execute(`
      INSERT INTO linkedin_imports (user_id, profile_data, status)
      VALUES ($1, $2, 'pending')
      ON CONFLICT (user_id) DO UPDATE SET profile_data = $2, status = 'pending'
    `, [user.id, JSON.stringify(transformedData)]);

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
  const data = apiData.data || apiData;

  const contactInfo = {
    name: data.fullName || data.full_name || [data.first_name, data.last_name].filter(Boolean).join(" ") || "",
    email: userEmail,
    phone: "",
    location: data.location || data.city || "",
    linkedin: data.linkedin_url || data.profile_url || (data.public_identifier
      ? `https://www.linkedin.com/in/${data.public_identifier}`
      : ""),
  };

  // Transform work experience
  // Scrapingdog fields: position, company_name, starts_at, ends_at, summary, duration
  const rawExperience = data.experiences || data.experience || [];
  const workExperience = rawExperience.map((exp: any) => {
    // starts_at / ends_at can be plain strings ("2000", "Present") or objects ({month, year})
    let startDate = exp.start_date || "";
    if (!startDate && exp.starts_at) {
      startDate = typeof exp.starts_at === "string"
        ? exp.starts_at
        : (exp.starts_at.month && exp.starts_at.year ? `${exp.starts_at.month}/${exp.starts_at.year}` : String(exp.starts_at.year || ""));
    }

    let endDate = exp.end_date || "";
    if (!endDate && exp.ends_at) {
      endDate = typeof exp.ends_at === "string"
        ? exp.ends_at
        : (exp.ends_at.month && exp.ends_at.year ? `${exp.ends_at.month}/${exp.ends_at.year}` : String(exp.ends_at.year || ""));
    } else if (!endDate && exp.ends_at === null) {
      endDate = "Present";
    }

    // Description can be in summary or description fields
    const rawDesc = exp.summary || exp.description;
    const description = Array.isArray(rawDesc)
      ? rawDesc
      : rawDesc ? [rawDesc] : [];

    return {
      company: exp.company || exp.company_name || "",
      title: exp.title || exp.position || "",
      start_date: startDate,
      end_date: endDate,
      description,
    };
  });

  // Transform education
  // Scrapingdog fields: college_name, college_degree, college_degree_field, college_duration
  let education = (data.education || []).map((edu: any) => {
    // Parse graduation date from college_duration ("1973 - 1975") or ends_at
    let gradDate = edu.graduation_date || edu.end_date || "";
    if (!gradDate && edu.college_duration) {
      const parts = edu.college_duration.split(" - ");
      gradDate = (parts[1] || "").trim();
    }
    if (!gradDate && edu.ends_at) {
      gradDate = typeof edu.ends_at === "string" ? edu.ends_at : String(edu.ends_at.year || "");
    }

    return {
      institution: edu.school || edu.school_name || edu.institution || edu.college_name || "",
      degree: edu.degree || edu.degree_name || edu.college_degree || "",
      field: edu.field_of_study || edu.field || edu.college_degree_field || "",
      graduation_date: gradDate,
    };
  });

  // Fallback: extract education from the top-card description fields if education array is empty
  if (education.length === 0 && data.description) {
    const desc = data.description;
    // description2 typically contains the education institution on public profiles
    const schoolName = desc.description2 || "";
    if (schoolName && desc.description2_link && desc.description2_link.includes("/school/")) {
      education = [{
        institution: schoolName,
        degree: "",
        field: "",
        graduation_date: "",
      }];
    }
  }

  // Extract skills — may be strings or objects
  const rawSkills = data.skills || [];
  const skills = rawSkills.map((s: any) => (typeof s === "string" ? s : s.name || s.skill || "")).filter(Boolean);

  // Transform certifications (Scrapingdog may use "certification")
  const certifications = (data.certifications || data.certification || []).map((cert: any) => ({
    name: cert.name || cert.title || "",
    issuer: cert.authority || cert.issuer || "",
    date: cert.start_date || "",
  }));

  // Extract languages — may be strings or objects
  const languages = (data.languages || []).map((lang: any) =>
    typeof lang === "string" ? lang : lang.name || lang.language || ""
  ).filter(Boolean);

  // Transform honors/awards
  const honors = (data.honors_awards || data.honors || data.awards || []).map((honor: any) => ({
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
    profile_picture_url: data.profile_photo || data.profile_pic_url || data.profile_picture_url || "",
    about: data.about || data.summary || "",
  };
}
