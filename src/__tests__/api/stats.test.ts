import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth";
import { _testDb as db } from "@/lib/db";
import { GET } from "@/app/api/stats/route";

const mockGetServerSession = vi.mocked(getServerSession);

describe("GET /api/stats", () => {
  beforeEach(() => {
    // Clear tables before each test
    db.exec("DELETE FROM job_applications");
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

  it("returns zero stats for a new user with no jobs", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    // Create user but no jobs
    db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run(
      "test@example.com",
      "Test User"
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resumes_created).toBe(0);
    expect(data.jobs_applied).toBe(0);
    expect(data.review_count).toBe(0);
  });

  it("returns zero stats when user does not exist in database", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "nonexistent@example.com" },
      expires: "",
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resumes_created).toBe(0);
    expect(data.review_count).toBe(0);
  });

  it("counts jobs correctly by status", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "test@example.com" },
      expires: "",
    });

    const userId = (
      db
        .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
        .run("test@example.com", "Test User") as { lastInsertRowid: number }
    ).lastInsertRowid;

    // Insert jobs with different statuses
    const insert = db.prepare(
      "INSERT INTO job_applications (user_id, company_name, job_title, status, reviewed, tailored_resume, cover_letter) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    insert.run(userId, "Company A", "Dev", "applied", 0, '{"data":"resume"}', null);
    insert.run(userId, "Company B", "Dev", "interview", 0, null, '{"data":"cover"}');
    insert.run(userId, "Company C", "Dev", "rejected", 0, '{"data":"resume"}', '{"data":"cover"}');
    insert.run(userId, "Company D", "Dev", "offer", 0, null, null);
    insert.run(userId, "Company E", "Dev", "review", 0, null, null);
    insert.run(userId, "Company F", "Dev", "review", 1, null, null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.jobs_applied).toBe(4); // applied + interview + rejected + offer
    expect(data.resumes_created).toBe(2); // tailored_resume IS NOT NULL
    expect(data.cover_letters_created).toBe(2); // cover_letter IS NOT NULL
    expect(data.rejections).toBe(1);
    expect(data.interviews).toBe(1);
    expect(data.offers).toBe(1);
    expect(data.review_count).toBe(1); // status=review AND reviewed=0
  });
});
