import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import fs from "fs";
import path from "path";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "public", "uploads", "photos");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB" }, { status: 400 });
    }

    // Get user
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${user.id}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filepath, buffer);

    // Update database with relative path
    const relativePath = `/uploads/photos/${filename}`;
    db.prepare(`
      UPDATE resumes
      SET profile_photo_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(relativePath, user.id);

    // Delete old photo if exists
    const oldResume = db.prepare("SELECT profile_photo_path FROM resumes WHERE user_id = ?").get(user.id) as { profile_photo_path: string | null } | undefined;
    if (oldResume?.profile_photo_path && oldResume.profile_photo_path !== relativePath) {
      const oldPath = path.join(process.cwd(), "public", oldResume.profile_photo_path);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    return NextResponse.json({ success: true, path: relativePath });
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
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current photo path
    const resume = db.prepare("SELECT profile_photo_path FROM resumes WHERE user_id = ?").get(user.id) as { profile_photo_path: string | null } | undefined;

    if (resume?.profile_photo_path) {
      // Delete file
      const filepath = path.join(process.cwd(), "public", resume.profile_photo_path);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      // Update database
      db.prepare(`
        UPDATE resumes
        SET profile_photo_path = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photo delete error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
