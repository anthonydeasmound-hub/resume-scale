import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  is_primary: z.boolean().optional(),
});

// PATCH - Update profile metadata (rename, set primary, update description)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const profileId = parseInt(id);

    if (isNaN(profileId)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, is_primary } = parsed.data;

    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify profile belongs to user
    const profile = await queryOne<{ id: number; is_primary: boolean; profile_name: string }>(
      "SELECT id, is_primary, profile_name FROM resumes WHERE id = $1 AND user_id = $2",
      [profileId, user.id]
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check for duplicate name if renaming
    if (name && name !== profile.profile_name) {
      const existingName = await queryOne<{ id: number }>(
        "SELECT id FROM resumes WHERE user_id = $1 AND profile_name = $2 AND id != $3",
        [user.id, name, profileId]
      );

      if (existingName) {
        return NextResponse.json(
          { error: "A profile with this name already exists" },
          { status: 400 }
        );
      }
    }

    // If setting this profile as primary, unset other primaries first
    if (is_primary === true && !profile.is_primary) {
      await execute(
        "UPDATE resumes SET is_primary = FALSE WHERE user_id = $1 AND is_primary = TRUE",
        [user.id]
      );
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`profile_name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`profile_description = $${paramIndex++}`);
      values.push(description);
    }

    if (is_primary !== undefined) {
      updates.push(`is_primary = $${paramIndex++}`);
      values.push(is_primary);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(profileId);

      await execute(
        `UPDATE resumes SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
        values
      );
    }

    // Fetch updated profile
    const updatedProfile = await queryOne<{
      id: number;
      profile_name: string;
      is_primary: boolean;
      profile_description: string | null;
      created_at: string;
      updated_at: string;
    }>(
      "SELECT id, profile_name, is_primary, profile_description, created_at, updated_at FROM resumes WHERE id = $1",
      [profileId]
    );

    return NextResponse.json({
      profile: {
        id: updatedProfile?.id,
        name: updatedProfile?.profile_name,
        is_primary: updatedProfile?.is_primary,
        description: updatedProfile?.profile_description,
        created_at: updatedProfile?.created_at,
        updated_at: updatedProfile?.updated_at,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// DELETE - Delete profile (cannot delete primary)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const profileId = parseInt(id);

    if (isNaN(profileId)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 });
    }

    const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify profile belongs to user and check if primary
    const profile = await queryOne<{ id: number; is_primary: boolean }>(
      "SELECT id, is_primary FROM resumes WHERE id = $1 AND user_id = $2",
      [profileId, user.id]
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.is_primary) {
      return NextResponse.json(
        { error: "Cannot delete primary profile. Set another profile as primary first." },
        { status: 400 }
      );
    }

    // Delete the profile
    await execute("DELETE FROM resumes WHERE id = $1", [profileId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete profile error:", error);
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}
