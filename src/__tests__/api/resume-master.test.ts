import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth";
import { _testDb as db } from "@/lib/db";
import { GET } from "@/app/api/resume/master/route";

const mockGetServerSession = vi.mocked(getServerSession);

describe("GET /api/resume/master", () => {
  beforeEach(() => {
    db.exec("DELETE FROM resumes");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 when user has no resume", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run(
      "test@example.com",
      "Test User"
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Resume not found");
  });

  it("returns parsed resume data when resume exists", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    const userId = (
      db
        .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
        .run("test@example.com", "Test User") as { lastInsertRowid: number }
    ).lastInsertRowid;

    const contactInfo = { name: "Test User", email: "test@example.com", phone: "555-1234" };
    const workExperience = [{ company: "Acme", title: "Dev", bullets: ["Built stuff"] }];
    const skills = ["JavaScript", "TypeScript"];
    const education = [{ school: "MIT", degree: "BS" }];

    db.prepare(
      "INSERT INTO resumes (user_id, contact_info, work_experience, skills, education, summary) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      userId,
      JSON.stringify(contactInfo),
      JSON.stringify(workExperience),
      JSON.stringify(skills),
      JSON.stringify(education),
      "Experienced developer"
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.contact_info).toEqual(contactInfo);
    expect(data.work_experience).toEqual(workExperience);
    expect(data.skills).toEqual(skills);
    expect(data.education).toEqual(education);
    expect(data.summary).toBe("Experienced developer");
    expect(data.resume_style).toBe("basic");
    expect(data.accent_color).toBe("#2563eb");
  });

  it("returns 404 when user not in database", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "nonexistent@example.com" },
      expires: "",
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("User not found");
  });

  it("returns empty arrays for optional fields when null", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    const userId = (
      db
        .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
        .run("test@example.com", "Test User") as { lastInsertRowid: number }
    ).lastInsertRowid;

    db.prepare(
      "INSERT INTO resumes (user_id, contact_info, work_experience, skills, education) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, '{}', '[]', '[]', '[]');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.certifications).toEqual([]);
    expect(data.languages).toEqual([]);
    expect(data.honors).toEqual([]);
    expect(data.summary).toBe("");
  });
});
