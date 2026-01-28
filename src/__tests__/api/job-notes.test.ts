import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { _testDb as db } from "@/lib/db";
import { GET, POST } from "@/app/api/jobs/[id]/notes/route";

const mockGetServerSession = vi.mocked(getServerSession);

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function createUserAndJob(email = "test@example.com"): { userId: number; jobId: number } {
  const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run(email, "Test User") as { lastInsertRowid: number }).lastInsertRowid;
  const jobId = (db.prepare("INSERT INTO job_applications (user_id, company_name, job_title) VALUES (?, ?, ?)").run(userId, "Acme Inc", "Dev") as { lastInsertRowid: number }).lastInsertRowid;
  return { userId, jobId };
}

describe("GET /api/jobs/[id]/notes", () => {
  beforeEach(() => {
    db.exec("DELETE FROM job_notes");
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/jobs/1/notes");
    const response = await GET(request, makeParams("1"));
    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid job id", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const request = new NextRequest("http://localhost/api/jobs/xyz/notes");
    const response = await GET(request, makeParams("xyz"));
    expect(response.status).toBe(400);
  });

  it("returns 404 when job not found", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User");

    const request = new NextRequest("http://localhost/api/jobs/999/notes");
    const response = await GET(request, makeParams("999"));
    expect(response.status).toBe(404);
  });

  it("returns empty array when no notes exist", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/notes`);
    const response = await GET(request, makeParams(String(jobId)));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns notes ordered by created_at DESC", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    db.prepare("INSERT INTO job_notes (job_id, content, created_at) VALUES (?, ?, ?)").run(jobId, "First note", "2025-01-01 00:00:00");
    db.prepare("INSERT INTO job_notes (job_id, content, created_at) VALUES (?, ?, ?)").run(jobId, "Second note", "2025-01-02 00:00:00");

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/notes`);
    const response = await GET(request, makeParams(String(jobId)));
    const data = await response.json();

    expect(data).toHaveLength(2);
    expect(data[0].content).toBe("Second note");
    expect(data[1].content).toBe("First note");
  });

  it("does not return notes for other users' jobs", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "user1@example.com" }, expires: "" });
    db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("user1@example.com", "User 1");

    const user2Id = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("user2@example.com", "User 2") as { lastInsertRowid: number }).lastInsertRowid;
    const jobId = (db.prepare("INSERT INTO job_applications (user_id, company_name, job_title) VALUES (?, ?, ?)").run(user2Id, "Other Corp", "Dev") as { lastInsertRowid: number }).lastInsertRowid;
    db.prepare("INSERT INTO job_notes (job_id, content) VALUES (?, ?)").run(jobId, "Secret note");

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/notes`);
    const response = await GET(request, makeParams(String(jobId)));
    expect(response.status).toBe(404);
  });
});

describe("POST /api/jobs/[id]/notes", () => {
  beforeEach(() => {
    db.exec("DELETE FROM job_notes");
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/jobs/1/notes", {
      method: "POST",
      body: JSON.stringify({ content: "Test" }),
    });
    const response = await POST(request, makeParams("1"));
    expect(response.status).toBe(401);
  });

  it("returns 400 when content is empty", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content: "" }),
    });
    const response = await POST(request, makeParams(String(jobId)));
    expect(response.status).toBe(400);
  });

  it("returns 400 when content is whitespace-only", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content: "   " }),
    });
    const response = await POST(request, makeParams(String(jobId)));
    expect(response.status).toBe(400);
  });

  it("creates a note successfully", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content: "Had a great call with recruiter" }),
    });
    const response = await POST(request, makeParams(String(jobId)));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.content).toBe("Had a great call with recruiter");
    expect(data.job_id).toBe(Number(jobId));
    expect(data.id).toBeDefined();
  });

  it("trims whitespace from note content", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/notes`, {
      method: "POST",
      body: JSON.stringify({ content: "  Follow up tomorrow  " }),
    });
    const response = await POST(request, makeParams(String(jobId)));
    const data = await response.json();

    expect(data.content).toBe("Follow up tomorrow");
  });
});
