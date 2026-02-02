import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, queryAll, execute } from "@/lib/db";

export interface EmailTemplate {
  id: number;
  user_id: number;
  name: string;
  template_type: string;
  subject: string;
  body: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// GET /api/email-templates - List user's saved templates
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get optional template_type filter from query params
  const { searchParams } = new URL(request.url);
  const templateType = searchParams.get("type");

  let templates: EmailTemplate[];
  if (templateType) {
    templates = await queryAll<EmailTemplate>(
      "SELECT * FROM email_templates WHERE user_id = $1 AND template_type = $2 ORDER BY is_default DESC, created_at DESC",
      [user.id, templateType]
    );
  } else {
    templates = await queryAll<EmailTemplate>(
      "SELECT * FROM email_templates WHERE user_id = $1 ORDER BY template_type, is_default DESC, created_at DESC",
      [user.id]
    );
  }

  return NextResponse.json(templates);
}

// POST /api/email-templates - Save a new template
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, template_type, subject, body: templateBody, is_default } = body;

  if (!name || !template_type || !subject || !templateBody) {
    return NextResponse.json(
      { error: "Name, template_type, subject, and body are required" },
      { status: 400 }
    );
  }

  try {
    // If setting as default, unset any existing default for this type
    if (is_default) {
      await execute(
        "UPDATE email_templates SET is_default = FALSE WHERE user_id = $1 AND template_type = $2",
        [user.id, template_type]
      );
    }

    const result = await execute(
      `INSERT INTO email_templates (user_id, name, template_type, subject, body, is_default)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user.id, name, template_type, subject, templateBody, is_default || false]
    );

    const template = await queryOne<EmailTemplate>(
      "SELECT * FROM email_templates WHERE id = $1",
      [result.rows[0].id]
    );

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Save template error:", error);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}

// DELETE /api/email-templates?id=123 - Delete a template
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await queryOne<{ id: number }>("SELECT id FROM users WHERE email = $1", [session.user.email]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("id");

  if (!templateId) {
    return NextResponse.json({ error: "Template ID required" }, { status: 400 });
  }

  try {
    // Verify template belongs to user
    const template = await queryOne<{ id: number }>(
      "SELECT id FROM email_templates WHERE id = $1 AND user_id = $2",
      [templateId, user.id]
    );

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await execute("DELETE FROM email_templates WHERE id = $1", [templateId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
