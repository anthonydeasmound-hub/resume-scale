import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { _testDb as db } from "@/lib/db";
import { GET } from "@/app/api/jobs/route";

const mockGetServerSession = vi.mocked(getServerSession);

describe("GET /api/jobs", () => {
  beforeEach(() => {
    db.exec("DELETE FROM interview_stages");
    db.exec("DELETE FROM email_actions");
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/jobs");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns empty array when user has no jobs", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run(
      "test@example.com",
      "Test User"
    );

    const request = new NextRequest("http://localhost/api/jobs");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns user's jobs ordered by created_at DESC", async () => {
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
      "INSERT INTO job_applications (user_id, company_name, job_title, status, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, "Company A", "Dev", "applied", "2025-01-01 00:00:00");
    db.prepare(
      "INSERT INTO job_applications (user_id, company_name, job_title, status, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, "Company B", "SWE", "review", "2025-01-02 00:00:00");

    const request = new NextRequest("http://localhost/api/jobs");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    // Most recent first (Company B created later)
    expect(data[0].company_name).toBe("Company B");
    expect(data[1].company_name).toBe("Company A");
  });

  it("does not return other users' jobs", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "user1@example.com" },
      expires: "",
    });

    const user1Id = (
      db
        .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
        .run("user1@example.com", "User 1") as { lastInsertRowid: number }
    ).lastInsertRowid;

    const user2Id = (
      db
        .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
        .run("user2@example.com", "User 2") as { lastInsertRowid: number }
    ).lastInsertRowid;

    db.prepare(
      "INSERT INTO job_applications (user_id, company_name, job_title) VALUES (?, ?, ?)"
    ).run(user1Id, "My Company", "My Job");
    db.prepare(
      "INSERT INTO job_applications (user_id, company_name, job_title) VALUES (?, ?, ?)"
    ).run(user2Id, "Other Company", "Other Job");

    const request = new NextRequest("http://localhost/api/jobs");
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].company_name).toBe("My Company");
  });

  it("includes interview stages when requested", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    const userId = (
      db
        .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
        .run("test@example.com", "Test User") as { lastInsertRowid: number }
    ).lastInsertRowid;

    const jobId = (
      db
        .prepare("INSERT INTO job_applications (user_id, company_name, job_title) VALUES (?, ?, ?)")
        .run(userId, "Test Corp", "Dev") as { lastInsertRowid: number }
    ).lastInsertRowid;

    db.prepare(
      "INSERT INTO interview_stages (job_id, stage_number, stage_type, stage_name, status) VALUES (?, ?, ?, ?, ?)"
    ).run(jobId, 1, "phone_screen", "Phone Screen", "completed");

    const request = new NextRequest("http://localhost/api/jobs?include=stages");
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0].interview_stages).toHaveLength(1);
    expect(data[0].interview_stages[0].stage_type).toBe("phone_screen");
  });

  it("returns empty array when user not in database", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "nonexistent@example.com" },
      expires: "",
    });

    const request = new NextRequest("http://localhost/api/jobs");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });
});
