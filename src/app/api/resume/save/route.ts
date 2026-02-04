import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { put } from "@vercel/blob";
import { z } from "zod";

const contactInfoSchema = z.object({
  name: z.string().max(200),
  email: z.string().max(200),
  phone: z.string().max(50),
  location: z.string().max(200),
  linkedin: z.string().max(500).optional().default(""),
});

const workExperienceSchema = z.array(z.object({
  company: z.string().max(200),
  title: z.string().max(200),
  start_date: z.string().max(50),
  end_date: z.string().max(50),
  description: z.array(z.string().max(2000)),
})).max(50);

const educationSchema = z.array(z.object({
  institution: z.string().max(200),
  degree: z.string().max(200),
  field: z.string().max(200),
  graduation_date: z.string().max(50),
})).max(20);

const certificationSchema = z.array(z.object({
  name: z.string().max(200),
  issuer: z.string().max(200),
  date: z.string().max(50),
})).max(50);

const honorSchema = z.array(z.object({
  title: z.string().max(200),
  issuer: z.string().max(200),
  date: z.string().max(50),
})).max(50);

// Helper function to process base64 data URL and upload to Vercel Blob
async function processBase64Photo(dataUrl: string, identifier: string): Promise<string | null> {
  try {
    console.log("[resume/save] Processing base64 photo, length:", dataUrl.length);

    // Parse the data URL
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error("[resume/save] Invalid base64 data URL format");
      return null;
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate it's actually an image
    if (!contentType.startsWith('image/')) {
      console.error("[resume/save] Base64 content is not an image:", contentType);
      return null;
    }

    // Determine file extension
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extMap[contentType] || 'jpg';

    // Upload to Vercel Blob
    const blob = await put(`photos/${identifier}_${Date.now()}.${ext}`, buffer, {
      access: 'public',
      contentType,
    });

    console.log("[resume/save] Uploaded base64 photo to Vercel Blob:", blob.url);
    return blob.url;
  } catch (error) {
    console.error("[resume/save] Error processing base64 photo:", error);
    return null;
  }
}

// Helper function to download OAuth/LinkedIn photo and upload to Vercel Blob
async function processExternalPhoto(photoUrl: string, userId: number): Promise<string | null> {
  // Check if it's an external URL that needs to be downloaded and stored
  const externalDomains = [
    'licdn.com',           // LinkedIn CDN
    'linkedin.com',        // LinkedIn
    'googleusercontent.com', // Google OAuth profile photos
    'lh3.googleusercontent.com', // Google user content
    'platform-lookaside.fbsbx.com', // Facebook
    'graph.facebook.com',  // Facebook Graph API
  ];

  const isExternalUrl = externalDomains.some(domain => photoUrl.includes(domain));

  if (!isExternalUrl) {
    // Check if it's already a Vercel Blob URL (already processed)
    if (photoUrl.includes('vercel-storage.com') || photoUrl.includes('blob.vercel-storage.com')) {
      return photoUrl; // Already a blob URL, return as-is
    }
    // Unknown URL, try to process it anyway
    if (!photoUrl.startsWith('http')) {
      return photoUrl; // Not a URL, return as-is
    }
  }

  try {
    console.log("[resume/save] Downloading external photo:", photoUrl.substring(0, 100));

    // Download the image
    const response = await fetch(photoUrl, {
      headers: {
        // Some LinkedIn URLs need a user-agent
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error("[resume/save] Failed to download external photo:", response.status);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    // Validate it's actually an image
    if (!contentType.startsWith('image/')) {
      console.error("[resume/save] Downloaded content is not an image:", contentType);
      return null;
    }

    // Determine file extension
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extMap[contentType] || 'jpg';

    // Upload to Vercel Blob
    const blob = await put(`photos/${userId}_${Date.now()}.${ext}`, buffer, {
      access: 'public',
      contentType,
    });

    console.log("[resume/save] Uploaded external photo to Vercel Blob:", blob.url);
    return blob.url;
  } catch (error) {
    console.error("[resume/save] Error processing external photo:", error);
    return null;
  }
}

const inputSchema = z.object({
  profile_id: z.number().optional(),
  contact_info: contactInfoSchema,
  work_experience: workExperienceSchema,
  skills: z.array(z.string().max(200)).max(100),
  education: educationSchema,
  certifications: certificationSchema.optional(),
  languages: z.array(z.string().max(100)).max(50).optional(),
  honors: honorSchema.optional(),
  profile_photo_path: z.string().max(1000).optional().nullable(),
  raw_text: z.string().max(100000).optional(),
  summary: z.string().max(50000).optional().nullable(),
  resume_style: z.string().max(100).optional(),
  accent_color: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Process base64 photo BEFORE validation (base64 strings are too long for validation)
    if (body.profile_photo_path && typeof body.profile_photo_path === 'string') {
      if (body.profile_photo_path.startsWith('data:image/')) {
        console.log("[resume/save] Detected base64 photo, processing before validation...");
        const processedUrl = await processBase64Photo(body.profile_photo_path, session.user.email.replace(/[^a-zA-Z0-9]/g, '_'));
        body.profile_photo_path = processedUrl;
      }
    }

    console.log("Resume save request body (photo processed):", JSON.stringify({
      ...body,
      profile_photo_path: body.profile_photo_path ? body.profile_photo_path.substring(0, 100) + '...' : null
    }, null, 2));

    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation errors:", parsed.error.flatten());
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { profile_id, contact_info, work_experience, skills, education, certifications, languages, honors, profile_photo_path, raw_text, summary, resume_style, accent_color } = parsed.data;

    // Get or create user first (needed for photo processing)
    let user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      const result = await execute(
        "INSERT INTO users (email, name, image) VALUES ($1, $2, $3) RETURNING id",
        [session.user.email, session.user.name, session.user.image]
      );
      user = { id: result.rows[0].id as number };
    }

    // Process external photo URLs (OAuth, LinkedIn) - download and upload to Vercel Blob
    let finalPhotoPath = profile_photo_path || null;
    if (profile_photo_path && profile_photo_path.startsWith('http')) {
      // Check if it's an external URL that needs processing (not already a blob URL)
      const needsProcessing = !profile_photo_path.includes('vercel-storage.com') &&
                               !profile_photo_path.includes('blob.vercel-storage.com');
      if (needsProcessing) {
        const processedUrl = await processExternalPhoto(profile_photo_path, user.id);
        finalPhotoPath = processedUrl;
      }
    }

    // Check if resume exists - either by profile_id or primary profile
    let existingResume: { id: number } | undefined;

    if (profile_id) {
      // Update specific profile (ensure it belongs to this user)
      existingResume = await queryOne<{ id: number }>(
        "SELECT id FROM resumes WHERE id = $1 AND user_id = $2",
        [profile_id, user.id]
      );
    } else {
      // Get primary profile
      existingResume = await queryOne<{ id: number }>(
        "SELECT id FROM resumes WHERE user_id = $1 AND is_primary = TRUE",
        [user.id]
      );

      // Fallback for existing users without is_primary set
      if (!existingResume) {
        existingResume = await queryOne<{ id: number }>(
          "SELECT id FROM resumes WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1",
          [user.id]
        );
      }
    }

    if (existingResume) {
      // Update existing resume
      await execute(`
        UPDATE resumes
        SET contact_info = $1, work_experience = $2, skills = $3, education = $4,
            certifications = $5, languages = $6, honors = $7, profile_photo_path = $8,
            raw_text = $9, summary = $10, resume_style = $11, accent_color = $12, updated_at = NOW()
        WHERE id = $13
      `, [
        JSON.stringify(contact_info),
        JSON.stringify(work_experience),
        JSON.stringify(skills),
        JSON.stringify(education),
        certifications ? JSON.stringify(certifications) : null,
        languages ? JSON.stringify(languages) : null,
        honors ? JSON.stringify(honors) : null,
        finalPhotoPath,
        raw_text || null,
        summary || null,
        resume_style || 'basic',
        accent_color || '#2563eb',
        existingResume.id
      ]);
    } else {
      // Insert new resume (as primary profile)
      await execute(`
        INSERT INTO resumes (user_id, profile_name, is_primary, contact_info, work_experience, skills, education, certifications, languages, honors, profile_photo_path, raw_text, summary, resume_style, accent_color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        user.id,
        'Master Resume',
        true,
        JSON.stringify(contact_info),
        JSON.stringify(work_experience),
        JSON.stringify(skills),
        JSON.stringify(education),
        certifications ? JSON.stringify(certifications) : null,
        languages ? JSON.stringify(languages) : null,
        honors ? JSON.stringify(honors) : null,
        finalPhotoPath,
        raw_text || null,
        summary || null,
        resume_style || 'basic',
        accent_color || '#2563eb'
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume save error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to save resume", details: errorMessage },
      { status: 500 }
    );
  }
}
