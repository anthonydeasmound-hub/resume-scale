import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { _testDb as db } from "@/lib/db";
import { GET, PATCH } from "@/app/api/jobs/[id]/route";

const mockGetServerSession = vi.mocked(getServerSession);

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/jobs/[id]", () => {
  beforeEach(() => {
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/jobs/1");
    const response = await GET(request, makeParams("1"));
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid id", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const request = new NextRequest("http://localhost/api/jobs/abc");
    const response = await GET(request, makeParams("abc"));
    expect(response.status).toBe(400);
  });

  it("returns 404 when user not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "nobody@example.com" }, expires: "" });
    const request = new NextRequest("http://localhost/api/jobs/1");
    const response = await GET(request, makeParams("1"));
    expect(response.status).toBe(404);
  });

  it("returns 404 when job does not belong to user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "user1@example.com" }, expires: "" });

    const user1Id = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("user1@example.com", "User 1") as { lastInsertRowid: number }).lastInsertRowid;
    const user2Id = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("user2@example.com", "User 2") as { lastInsertRowid: number }).lastInsertRowid;

    const jobId = (db.prepare("INSERT INTO job_applications (user_id, company_name, job_title) VALUES (?, ?, ?)").run(user2Id, "Other Corp", "Dev") as { lastInsertRowid: number }).lastInsertRowid;

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}`);
    const response = await GET(request, makeParams(String(jobId)));
    expect(response.status).toBe(404);
  });

  it("returns job when it belongs to user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });

    const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User") as { lastInsertRowid: number }).lastInsertRowid;
    const jobId = (db.prepare("INSERT INTO job_applications (user_id, company_name, job_title, status) VALUES (?, ?, ?, ?)").run(userId, "Acme Inc", "Engineer", "applied") as { lastInsertRowid: number }).lastInsertRowid;

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}`);
    const response = await GET(request, makeParams(String(jobId)));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.company_name).toBe("Acme Inc");
    expect(data.job_title).toBe("Engineer");
  });
});

describe("PATCH /api/jobs/[id]", () => {
  beforeEach(() => {
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/jobs/1", {
      method: "PATCH",
      body: JSON.stringify({ status: "interview" }),
    });
    const response = await PATCH(request, makeParams("1"));
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid id", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const request = new NextRequest("http://localhost/api/jobs/abc", {
      method: "PATCH",
      body: JSON.stringify({ status: "interview" }),
    });
    const response = await PATCH(request, makeParams("abc"));
    expect(response.status).toBe(400);
  });

  it("returns 400 when no valid fields provided", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });

    const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User") as { lastInsertRowid: number }).lastInsertRowid;
    const jobId = (db.prepare("INSERT INTO job_applications (user_id, company_name, job_title) VALUES (?, ?, ?)").run(userId, "Acme", "Dev") as { lastInsertRowid: number }).lastInsertRowid;

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ invalid_field: "test" }),
    });
    const response = await PATCH(request, makeParams(String(jobId)));
    expect(response.status).toBe(400);
  });

  it("updates allowed fields successfully", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });

    const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User") as { lastInsertRowid: number }).lastInsertRowid;
    const jobId = (db.prepare("INSERT INTO job_applications (user_id, company_name, job_title, status) VALUES (?, ?, ?, ?)").run(userId, "Acme", "Dev", "review") as { lastInsertRowid: number }).lastInsertRowid;

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "applied", date_applied: "2025-01-15" }),
    });
    const response = await PATCH(request, makeParams(String(jobId)));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify the update persisted
    const job = db.prepare("SELECT status, date_applied FROM job_applications WHERE id = ?").get(jobId) as { status: string; date_applied: string };
    expect(job.status).toBe("applied");
    expect(job.date_applied).toBe("2025-01-15");
  });

  it("rejects disallowed fields", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });

    const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User") as { lastInsertRowid: number }).lastInsertRowid;
    const jobId = (db.prepare("INSERT INTO job_applications (user_id, company_name, job_title) VALUES (?, ?, ?)").run(userId, "Acme", "Dev") as { lastInsertRowid: number }).lastInsertRowid;

    // user_id is not in allowedFields
    const request = new NextRequest(`http://localhost/api/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ user_id: 999 }),
    });
    const response = await PATCH(request, makeParams(String(jobId)));
    expect(response.status).toBe(400);
  });

  it("does not update jobs belonging to other users", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "user1@example.com" }, expires: "" });

    db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("user1@example.com", "User 1");
    const user2Id = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("user2@example.com", "User 2") as { lastInsertRowid: number }).lastInsertRowid;
    const jobId = (db.prepare("INSERT INTO job_applications (user_id, company_name, job_title, status) VALUES (?, ?, ?, ?)").run(user2Id, "Other Corp", "Dev", "review") as { lastInsertRowid: number }).lastInsertRowid;

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "applied" }),
    });
    const response = await PATCH(request, makeParams(String(jobId)));

    // The route returns 404 for user not found or success but no rows affected
    // Check the job wasn't changed
    const job = db.prepare("SELECT status FROM job_applications WHERE id = ?").get(jobId) as { status: string };
    expect(job.status).toBe("review");
  });
});
