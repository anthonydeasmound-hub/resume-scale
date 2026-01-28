import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth";
import { _testDb as db } from "@/lib/db";
import { GET } from "@/app/api/setup-status/route";

const mockGetServerSession = vi.mocked(getServerSession);

describe("GET /api/setup-status", () => {
  beforeEach(() => {
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM extension_tokens");
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

  it("returns all false for new user", async () => {
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

    expect(response.status).toBe(200);
    expect(data.hasResume).toBe(false);
    expect(data.hasExtension).toBe(false);
    expect(data.hasFirstJob).toBe(false);
    expect(data.completedCount).toBe(0);
    expect(data.totalTasks).toBe(3);
  });

  it("tracks resume completion", async () => {
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

    expect(data.hasResume).toBe(true);
    expect(data.completedCount).toBe(1);
  });

  it("tracks all three tasks completed", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    const userId = (
      db
        .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
        .run("test@example.com", "Test User") as { lastInsertRowid: number }
    ).lastInsertRowid;

    // Add resume
    db.prepare(
      "INSERT INTO resumes (user_id, contact_info, work_experience, skills, education) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, '{}', '[]', '[]', '[]');

    // Add extension token
    db.prepare(
      "INSERT INTO extension_tokens (user_id, token) VALUES (?, ?)"
    ).run(userId, "test-token-123");

    // Add a job
    db.prepare(
      "INSERT INTO job_applications (user_id, company_name, job_title) VALUES (?, ?, ?)"
    ).run(userId, "Test Corp", "Developer");

    const response = await GET();
    const data = await response.json();

    expect(data.hasResume).toBe(true);
    expect(data.hasExtension).toBe(true);
    expect(data.hasFirstJob).toBe(true);
    expect(data.completedCount).toBe(3);
  });

  it("returns defaults when user not in database", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "nonexistent@example.com" },
      expires: "",
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.completedCount).toBe(0);
    expect(data.totalTasks).toBe(3);
  });
});
