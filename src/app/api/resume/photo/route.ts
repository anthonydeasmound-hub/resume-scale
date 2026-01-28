import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { put, del } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, or WebP" }, { status: 400 });
    }

    // Validate file size (max 4MB — Vercel serverless body limit is 4.5MB)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 4MB" }, { status: 400 });
    }

    // Get user
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get old photo URL before updating
    const oldResume = await queryOne<{ profile_photo_path: string | null }>("SELECT profile_photo_path FROM resumes WHERE user_id = $1", [user.id]);

    // Generate unique filename using validated MIME type
    const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
    const ext = extMap[file.type] || "jpg";

    // Upload to Vercel Blob
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const blob = await put(`photos/${user.id}_${Date.now()}.${ext}`, buffer, {
      access: "public",
      contentType: file.type,
    });

    // Update database with full blob URL
    await execute(`
      UPDATE resumes
      SET profile_photo_path = $1, updated_at = NOW()
      WHERE user_id = $2
    `, [blob.url, user.id]);

    // Delete old blob if it existed
    if (oldResume?.profile_photo_path) {
      try {
        await del(oldResume.profile_photo_path);
      } catch {
        // Old photo may have been a local path or already deleted — ignore
      }
    }

    return NextResponse.json({ success: true, path: blob.url });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current photo URL
    const resume = await queryOne<{ profile_photo_path: string | null }>("SELECT profile_photo_path FROM resumes WHERE user_id = $1", [user.id]);

    if (resume?.profile_photo_path) {
      // Delete from Vercel Blob
      await del(resume.profile_photo_path);

      // Update database
      await execute(`
        UPDATE resumes
        SET profile_photo_path = NULL, updated_at = NOW()
        WHERE user_id = $1
      `, [user.id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photo delete error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
