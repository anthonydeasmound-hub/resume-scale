import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { _testDb as db } from "@/lib/db";
import { GET, DELETE } from "@/app/api/extension/token/route";
import { POST as VALIDATE } from "@/app/api/extension/validate/route";

const mockGetServerSession = vi.mocked(getServerSession);

describe("GET /api/extension/token", () => {
  beforeEach(() => {
    db.exec("DELETE FROM extension_tokens");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("generates a new token for a user without one", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com", name: "Test User", image: null },
      expires: "",
    });

    db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User");

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.token.length).toBe(64); // 32 bytes hex

    // Verify token was persisted
    const tokenRecord = db.prepare("SELECT token FROM extension_tokens").get() as { token: string };
    expect(tokenRecord.token).toBe(data.token);
  });

  it("returns existing token when one exists", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com", name: "Test User", image: null },
      expires: "",
    });

    const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User") as { lastInsertRowid: number }).lastInsertRowid;
    db.prepare("INSERT INTO extension_tokens (user_id, token, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(userId, "existing-token-abc");

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe("existing-token-abc");
  });

  it("creates user if not in database", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "new@example.com", name: "New User", image: null },
      expires: "",
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();

    // Verify user was created
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get("new@example.com") as { name: string };
    expect(user).toBeDefined();
    expect(user.name).toBe("New User");
  });
});

describe("DELETE /api/extension/token", () => {
  beforeEach(() => {
    db.exec("DELETE FROM extension_tokens");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const response = await DELETE();
    expect(response.status).toBe(401);
  });

  it("deletes all tokens for the user", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User") as { lastInsertRowid: number }).lastInsertRowid;
    db.prepare("INSERT INTO extension_tokens (user_id, token) VALUES (?, ?)").run(userId, "token-1");
    db.prepare("INSERT INTO extension_tokens (user_id, token) VALUES (?, ?)").run(userId, "token-2");

    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    const remaining = db.prepare("SELECT * FROM extension_tokens WHERE user_id = ?").all(userId);
    expect(remaining).toHaveLength(0);
  });

  it("succeeds even when user has no tokens", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User");

    const response = await DELETE();
    expect(response.status).toBe(200);
  });
});

describe("POST /api/extension/validate", () => {
  beforeEach(() => {
    db.exec("DELETE FROM extension_tokens");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when no authorization header provided", async () => {
    const request = new NextRequest("http://localhost/api/extension/validate", {
      method: "POST",
    });
    const response = await VALIDATE(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Missing token");
  });

  it("returns 401 for invalid token", async () => {
    const request = new NextRequest("http://localhost/api/extension/validate", {
      method: "POST",
      headers: { Authorization: "Bearer invalid-token-xyz" },
    });
    const response = await VALIDATE(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Invalid or expired token");
  });

  it("validates a correct token and returns user info", async () => {
    const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User") as { lastInsertRowid: number }).lastInsertRowid;
    db.prepare("INSERT INTO extension_tokens (user_id, token, expires_at) VALUES (?, ?, datetime('now', '+30 days'))").run(userId, "valid-token-123");

    const request = new NextRequest("http://localhost/api/extension/validate", {
      method: "POST",
      headers: { Authorization: "Bearer valid-token-123" },
    });
    const response = await VALIDATE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.user.email).toBe("test@example.com");
    expect(data.user.name).toBe("Test User");
  });

  it("rejects expired token", async () => {
    const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("test@example.com", "Test User") as { lastInsertRowid: number }).lastInsertRowid;
    // Expired 1 day ago
    db.prepare("INSERT INTO extension_tokens (user_id, token, expires_at) VALUES (?, ?, datetime('now', '-1 days'))").run(userId, "expired-token");

    const request = new NextRequest("http://localhost/api/extension/validate", {
      method: "POST",
      headers: { Authorization: "Bearer expired-token" },
    });
    const response = await VALIDATE(request);
    expect(response.status).toBe(401);
  });

  it("rejects malformed authorization header", async () => {
    const request = new NextRequest("http://localhost/api/extension/validate", {
      method: "POST",
      headers: { Authorization: "Basic abc123" },
    });
    const response = await VALIDATE(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Missing token");
  });
});
