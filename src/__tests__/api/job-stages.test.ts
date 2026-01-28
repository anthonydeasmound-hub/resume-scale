import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { _testDb as db } from "@/lib/db";
import { GET, POST } from "@/app/api/jobs/[id]/stages/route";
import { PATCH, DELETE } from "@/app/api/jobs/[id]/stages/[stageId]/route";

const mockGetServerSession = vi.mocked(getServerSession);

function makeStageParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function makeStagePairParams(id: string, stageId: string): { params: Promise<{ id: string; stageId: string }> } {
  return { params: Promise.resolve({ id, stageId }) };
}

function createUserAndJob(email = "test@example.com"): { userId: number; jobId: number } {
  const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run(email, "Test User") as { lastInsertRowid: number }).lastInsertRowid;
  const jobId = (db.prepare("INSERT INTO job_applications (user_id, company_name, job_title, status) VALUES (?, ?, ?, ?)").run(userId, "Acme Inc", "Dev", "applied") as { lastInsertRowid: number }).lastInsertRowid;
  return { userId, jobId };
}

describe("GET /api/jobs/[id]/stages", () => {
  beforeEach(() => {
    db.exec("DELETE FROM interview_stages");
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/jobs/1/stages");
    const response = await GET(request, makeStageParams("1"));
    expect(response.status).toBe(401);
  });

  it("returns empty array when no stages exist", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/stages`);
    const response = await GET(request, makeStageParams(String(jobId)));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("returns stages ordered by stage_number ASC", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    db.prepare("INSERT INTO interview_stages (job_id, stage_number, stage_type, stage_name, status) VALUES (?, ?, ?, ?, ?)").run(jobId, 2, "technical", "Technical", "pending");
    db.prepare("INSERT INTO interview_stages (job_id, stage_number, stage_type, stage_name, status) VALUES (?, ?, ?, ?, ?)").run(jobId, 1, "phone_screen", "Phone Screen", "completed");

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/stages`);
    const response = await GET(request, makeStageParams(String(jobId)));
    const data = await response.json();

    expect(data).toHaveLength(2);
    expect(data[0].stage_type).toBe("phone_screen");
    expect(data[1].stage_type).toBe("technical");
  });
});

describe("POST /api/jobs/[id]/stages", () => {
  beforeEach(() => {
    db.exec("DELETE FROM interview_stages");
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/jobs/1/stages", {
      method: "POST",
      body: JSON.stringify({ stage_type: "phone_screen" }),
    });
    const response = await POST(request, makeStageParams("1"));
    expect(response.status).toBe(401);
  });

  it("returns 400 when stage_type is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/stages`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request, makeStageParams(String(jobId)));
    expect(response.status).toBe(400);
  });

  it("creates a stage with auto-incremented stage_number", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    // Create first stage
    const req1 = new NextRequest(`http://localhost/api/jobs/${jobId}/stages`, {
      method: "POST",
      body: JSON.stringify({ stage_type: "phone_screen" }),
    });
    const res1 = await POST(req1, makeStageParams(String(jobId)));
    const data1 = await res1.json();

    expect(res1.status).toBe(201);
    expect(data1.stage_number).toBe(1);
    expect(data1.stage_type).toBe("phone_screen");
    expect(data1.status).toBe("pending");

    // Create second stage
    const req2 = new NextRequest(`http://localhost/api/jobs/${jobId}/stages`, {
      method: "POST",
      body: JSON.stringify({ stage_type: "technical", stage_name: "Coding Challenge" }),
    });
    const res2 = await POST(req2, makeStageParams(String(jobId)));
    const data2 = await res2.json();

    expect(data2.stage_number).toBe(2);
    expect(data2.stage_name).toBe("Coding Challenge");
  });

  it("sets default stage name based on stage_type", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/stages`, {
      method: "POST",
      body: JSON.stringify({ stage_type: "behavioral" }),
    });
    const response = await POST(request, makeStageParams(String(jobId)));
    const data = await response.json();

    expect(data.stage_name).toBe("Behavioral Interview");
  });
});

describe("PATCH /api/jobs/[id]/stages/[stageId]", () => {
  beforeEach(() => {
    db.exec("DELETE FROM interview_stages");
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/jobs/1/stages/1", {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
    const response = await PATCH(request, makeStagePairParams("1", "1"));
    expect(response.status).toBe(401);
  });

  it("returns 400 when no valid fields provided", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const stageId = (db.prepare("INSERT INTO interview_stages (job_id, stage_number, stage_type, status) VALUES (?, ?, ?, ?)").run(jobId, 1, "phone_screen", "pending") as { lastInsertRowid: number }).lastInsertRowid;

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/stages/${stageId}`, {
      method: "PATCH",
      body: JSON.stringify({ invalid_field: "test" }),
    });
    const response = await PATCH(request, makeStagePairParams(String(jobId), String(stageId)));
    expect(response.status).toBe(400);
  });

  it("updates stage status successfully", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const stageId = (db.prepare("INSERT INTO interview_stages (job_id, stage_number, stage_type, status) VALUES (?, ?, ?, ?)").run(jobId, 1, "phone_screen", "pending") as { lastInsertRowid: number }).lastInsertRowid;

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/stages/${stageId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "scheduled" }),
    });
    const response = await PATCH(request, makeStagePairParams(String(jobId), String(stageId)));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("scheduled");
  });

  it("returns 404 for stage that does not exist", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/stages/9999`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
    const response = await PATCH(request, makeStagePairParams(String(jobId), "9999"));
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/jobs/[id]/stages/[stageId]", () => {
  beforeEach(() => {
    db.exec("DELETE FROM interview_stages");
    db.exec("DELETE FROM job_applications");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/jobs/1/stages/1", { method: "DELETE" });
    const response = await DELETE(request, makeStagePairParams("1", "1"));
    expect(response.status).toBe(401);
  });

  it("deletes a stage and renumbers remaining stages", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const stage1 = (db.prepare("INSERT INTO interview_stages (job_id, stage_number, stage_type, status) VALUES (?, ?, ?, ?)").run(jobId, 1, "phone_screen", "completed") as { lastInsertRowid: number }).lastInsertRowid;
    const stage2 = (db.prepare("INSERT INTO interview_stages (job_id, stage_number, stage_type, status) VALUES (?, ?, ?, ?)").run(jobId, 2, "technical", "pending") as { lastInsertRowid: number }).lastInsertRowid;
    const stage3 = (db.prepare("INSERT INTO interview_stages (job_id, stage_number, stage_type, status) VALUES (?, ?, ?, ?)").run(jobId, 3, "behavioral", "pending") as { lastInsertRowid: number }).lastInsertRowid;

    // Delete the middle stage
    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/stages/${stage2}`, { method: "DELETE" });
    const response = await DELETE(request, makeStagePairParams(String(jobId), String(stage2)));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify stage2 is gone
    const deleted = db.prepare("SELECT * FROM interview_stages WHERE id = ?").get(stage2);
    expect(deleted).toBeUndefined();

    // Verify remaining stages are renumbered
    const remaining = db.prepare("SELECT id, stage_number FROM interview_stages WHERE job_id = ? ORDER BY stage_number").all(jobId) as { id: number; stage_number: number }[];
    expect(remaining).toHaveLength(2);
    expect(remaining[0].id).toBe(Number(stage1));
    expect(remaining[0].stage_number).toBe(1);
    expect(remaining[1].id).toBe(Number(stage3));
    expect(remaining[1].stage_number).toBe(2);
  });

  it("returns 404 when stage does not exist", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const { jobId } = createUserAndJob();

    const request = new NextRequest(`http://localhost/api/jobs/${jobId}/stages/9999`, { method: "DELETE" });
    const response = await DELETE(request, makeStagePairParams(String(jobId), "9999"));
    expect(response.status).toBe(404);
  });
});
