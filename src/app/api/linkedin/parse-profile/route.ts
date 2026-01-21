import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

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

function getUserFromToken(request: NextRequest): { id: number; email: string } | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  const tokenRecord = db.prepare(
    "SELECT et.user_id, u.email FROM extension_tokens et JOIN users u ON et.user_id = u.id WHERE et.token = ? AND (et.expires_at IS NULL OR et.expires_at > datetime('now'))"
  ).get(token) as { user_id: number; email: string } | undefined;

  if (!tokenRecord) {
    return null;
  }

  return { id: tokenRecord.user_id, email: tokenRecord.email };
}

export async function POST(request: NextRequest) {
  const user = getUserFromToken(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { name, headline, location, about, experience, education, skills, linkedin_username, profile_url } = body;

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
    }) => ({
      company: exp.company || "",
      title: exp.title || "",
      start_date: exp.start_date || "",
      end_date: exp.end_date || "",
      description: exp.description ? [exp.description] : [],
    }));

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

    // Store the import data temporarily
    db.prepare(`
      INSERT OR REPLACE INTO linkedin_imports (user_id, profile_data, status)
      VALUES (?, ?, 'pending')
    `).run(user.id, JSON.stringify({
      contact_info: contactInfo,
      work_experience: workExperience,
      education: educationData,
      skills: skillsData,
      about: about || "",
    }));

    return NextResponse.json({
      success: true,
      data: {
        contact_info: contactInfo,
        work_experience: workExperience,
        education: educationData,
        skills: skillsData,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("LinkedIn parse error:", error);
    return NextResponse.json({ error: "Failed to parse LinkedIn data" }, { status: 500, headers: corsHeaders });
  }
}

// Get pending LinkedIn import data (supports both token and session auth)
export async function GET(request: NextRequest) {
  console.log("[LinkedIn API] GET request received");

  // Try token auth first (for extension)
  let user = getUserFromToken(request);
  console.log("[LinkedIn API] Token auth result:", user ? "found" : "not found");

  // Fall back to session auth (for web app)
  if (!user) {
    console.log("[LinkedIn API] Trying session auth...");
    const session = await getServerSession(authOptions);
    console.log("[LinkedIn API] Session:", session?.user?.email || "no session");
    if (session?.user?.email) {
      const dbUser = db.prepare("SELECT id, email FROM users WHERE email = ?").get(session.user.email) as { id: number; email: string } | undefined;
      console.log("[LinkedIn API] DB user:", dbUser ? "found" : "not found");
      if (dbUser) {
        user = { id: dbUser.id, email: dbUser.email };
      }
    }
  }

  if (!user) {
    console.log("[LinkedIn API] Unauthorized - no user found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  console.log("[LinkedIn API] User authenticated:", user.email);

  const importData = db.prepare(
    "SELECT profile_data FROM linkedin_imports WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1"
  ).get(user.id) as { profile_data: string } | undefined;

  if (!importData) {
    console.log("[LinkedIn API] No pending import found");
    return NextResponse.json({ error: "No pending import" }, { status: 404, headers: corsHeaders });
  }

  console.log("[LinkedIn API] Returning import data");
  return NextResponse.json({
    data: JSON.parse(importData.profile_data),
  }, { headers: corsHeaders });
}
