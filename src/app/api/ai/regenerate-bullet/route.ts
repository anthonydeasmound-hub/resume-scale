import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import db from "@/lib/db";
import Groq from "groq-sdk";
import { buildEnhancementContext, formatBulletsForPrompt } from "@/lib/resume-examples";
import { z } from "zod";

const inputSchema = z.object({
  role: z.object({
    company: z.string().min(1),
    title: z.string().min(1),
  }),
  rejectedBullet: z.string().min(1),
  existingBullets: z.array(z.string()).optional().default([]),
  feedback: z.enum(["up", "down"]),
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

async function callAI(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7, // Higher temperature for more variety
  });
  return completion.choices[0]?.message?.content || "";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimited = await checkRateLimit(session.user.email);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { role, rejectedBullet, existingBullets, feedback } = parsed.data;

    // Store feedback for future learning
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(session.user.email) as { id: number } | undefined;
    if (user) {
      db.prepare(`
        INSERT INTO bullet_feedback (user_id, role_title, company, bullet_text, feedback, was_user_written)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(user.id, role.title, role.company, rejectedBullet, feedback);
    }

    // If feedback is "up", no need to regenerate
    if (feedback === 'up') {
      return NextResponse.json({ bullet: null, message: "Feedback recorded" });
    }

    // Get context for better generation
    const context = buildEnhancementContext(role.title);
    const exampleBulletsText = formatBulletsForPrompt(context.exampleBullets.slice(0, 5));

    // Get previously rejected bullets for this role/user to avoid similar ones
    let previouslyRejected: string[] = [];
    if (user) {
      const rejectedFeedback = db.prepare(`
        SELECT bullet_text FROM bullet_feedback
        WHERE user_id = ? AND role_title = ? AND feedback = 'down'
        ORDER BY created_at DESC
        LIMIT 10
      `).all(user.id, role.title) as { bullet_text: string }[];
      previouslyRejected = rejectedFeedback.map(f => f.bullet_text);
    }

    const prompt = `Generate ONE new resume bullet point for a ${role.title} at ${role.company}.

THE USER REJECTED THIS BULLET (generate something DIFFERENT):
"${rejectedBullet}"

${previouslyRejected.length > 0 ? `ALSO AVOID BULLETS SIMILAR TO THESE (previously rejected):
${previouslyRejected.slice(0, 5).map(b => `- "${b}"`).join('\n')}

` : ''}EXISTING BULLETS (DO NOT DUPLICATE):
${existingBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

REFERENCE EXAMPLES OF GOOD BULLETS:
${exampleBulletsText || 'Use professional resume best practices'}

REQUIREMENTS:
1. Generate something SUBSTANTIALLY DIFFERENT from the rejected bullet
2. Try a different angle, focus, or achievement type
3. Keep it 1-2 lines (15-30 words)
4. Include a specific metric (%, $, #)
5. Start with a strong action verb
6. Make it specific to ${role.company}

RESPOND WITH ONLY THE BULLET TEXT, NO QUOTES OR EXPLANATION.`;

    const response = await callAI(prompt);
    const newBullet = response.trim().replace(/^["']|["']$/g, ''); // Remove any quotes

    return NextResponse.json({ bullet: newBullet });
  } catch (error) {
    console.error("Error regenerating bullet:", error);
    return NextResponse.json(
      { error: "Failed to regenerate bullet" },
      { status: 500 }
    );
  }
}
