import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

// CORS headers for Chrome extension
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function getUserFromToken(request: NextRequest): Promise<{ id: number; email: string } | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  const tokenRecord = await queryOne<{ user_id: number; email: string }>(
    "SELECT et.user_id, u.email FROM extension_tokens et JOIN users u ON et.user_id = u.id WHERE et.token = $1 AND (et.expires_at IS NULL OR et.expires_at > NOW())",
    [token]
  );

  if (!tokenRecord) {
    return null;
  }

  return { id: tokenRecord.user_id, email: tokenRecord.email };
}

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { name, headline, location, about, experience, education, skills, certifications, languages, honors, profile_picture_url, linkedin_username, profile_url } = body;

    // Convert LinkedIn data to resume format
    const contactInfo = {
      name: name || "",
      email: user.email,
      phone: "",
      location: location || "",
      linkedin: profile_url || `https://linkedin.com/in/${linkedin_username}`,
    };

    const workExperience = (experience || []).map((exp: {
      title?: string;
      company?: string;
      start_date?: string;
      end_date?: string;
      description?: string;
    }) => {
      // Filter out LinkedIn skill badges that look like "Quota Achievement, Sales and +5 skills"
      // These are not actual job descriptions/bullets
      let description: string[] = [];
      if (exp.description) {
        const descText = exp.description.trim();
        // Skip if it looks like a LinkedIn skills badge:
        // - Contains "+X skills" pattern
        // - Is very short and comma-separated (likely just skill names)
        // - Contains "skills" at the end
        const isSkillsBadge =
          /\+\d+\s*skills?/i.test(descText) ||
          /skills?$/i.test(descText) ||
          (descText.length < 100 && descText.split(',').length >= 2 && !descText.includes('.'));

        if (!isSkillsBadge) {
          description = [descText];
        }
      }

      return {
        company: exp.company || "",
        title: exp.title || "",
        start_date: exp.start_date || "",
        end_date: exp.end_date || "",
        description,
      };
    });

    const educationData = (education || []).map((edu: {
      institution?: string;
      degree?: string;
      field?: string;
      graduation_date?: string;
    }) => ({
      institution: edu.institution || "",
      degree: edu.degree || "",
      field: edu.field || "",
      graduation_date: edu.graduation_date || "",
    }));

    const skillsData = skills || [];

    // Process certifications (name, issuer, date)
    const certificationsData = (certifications || []).map((cert: {
      name?: string;
      issuer?: string;
      date?: string;
    }) => ({
      name: cert.name || "",
      issuer: cert.issuer || "",
      date: cert.date || "",
    }));

    // Languages are just strings
    const languagesData = languages || [];

    // Process honors (title, issuer, date)
    const honorsData = (honors || []).map((honor: {
      title?: string;
      issuer?: string;
      date?: string;
    }) => ({
      title: honor.title || "",
      issuer: honor.issuer || "",
      date: honor.date || "",
    }));

    // Store the import data temporarily
    await execute(`
      INSERT INTO linkedin_imports (user_id, profile_data, status)
      VALUES ($1, $2, 'pending')
      ON CONFLICT (user_id) DO UPDATE SET profile_data = $2, status = 'pending'
    `, [user.id, JSON.stringify({
      contact_info: contactInfo,
      work_experience: workExperience,
      education: educationData,
      skills: skillsData,
      certifications: certificationsData,
      languages: languagesData,
      honors: honorsData,
      profile_picture_url: profile_picture_url || "",
      about: about || "",
    })]);

    return NextResponse.json({
      success: true,
      data: {
        contact_info: contactInfo,
        work_experience: workExperience,
        education: educationData,
        skills: skillsData,
        certifications: certificationsData,
        languages: languagesData,
        honors: honorsData,
        profile_picture_url: profile_picture_url || "",
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("LinkedIn parse error:", error);
    return NextResponse.json({ error: "Failed to parse LinkedIn data" }, { status: 500, headers: corsHeaders });
  }
}

// Get pending LinkedIn import data (supports both token and session auth)
export async function GET(request: NextRequest) {

  // Try token auth first (for extension)
  let user = await getUserFromToken(request);

  // Fall back to session auth (for web app)
  if (!user) {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const dbUser = await queryOne<{ id: number; email: string }>("SELECT id, email FROM users WHERE email = $1", [session.user.email]);
      if (dbUser) {
        user = { id: dbUser.id, email: dbUser.email };
      }
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }


  const importData = await queryOne<{ profile_data: string }>(
    "SELECT profile_data FROM linkedin_imports WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
    [user.id]
  );

  if (!importData) {
    return NextResponse.json({ error: "No pending import" }, { status: 404, headers: corsHeaders });
  }

  return NextResponse.json({
    data: JSON.parse(importData.profile_data),
  }, { headers: corsHeaders });
}
