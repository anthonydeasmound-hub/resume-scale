import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { _testDb as db } from "@/lib/db";
import { POST } from "@/app/api/resume/save/route";

const mockGetServerSession = vi.mocked(getServerSession);

const validResume = {
  contact_info: { name: "Jane Doe", email: "jane@example.com", phone: "555-1234", location: "San Francisco, CA" },
  work_experience: [
    { company: "Acme Corp", title: "Software Engineer", start_date: "2022-01", end_date: "Present", description: ["Built APIs", "Led migrations"] },
  ],
  skills: ["JavaScript", "TypeScript", "React"],
  education: [
    { institution: "UC Berkeley", degree: "B.S.", field: "Computer Science", graduation_date: "2022" },
  ],
};

describe("POST /api/resume/save", () => {
  beforeEach(() => {
    db.exec("DELETE FROM resumes");
    db.exec("DELETE FROM users");
    mockGetServerSession.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/resume/save", {
      method: "POST",
      body: JSON.stringify(validResume),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "test@example.com" }, expires: "" });
    const request = new NextRequest("http://localhost/api/resume/save", {
      method: "POST",
      body: JSON.stringify({ contact_info: { name: "Test" } }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid input");
  });

  it("creates a new resume for a new user", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "jane@example.com", name: "Jane Doe", image: null },
      expires: "",
    });

    const request = new NextRequest("http://localhost/api/resume/save", {
      method: "POST",
      body: JSON.stringify(validResume),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify user was created
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get("jane@example.com") as { id: number; name: string };
    expect(user).toBeDefined();
    expect(user.name).toBe("Jane Doe");

    // Verify resume was created
    const resume = db.prepare("SELECT * FROM resumes WHERE user_id = ?").get(user.id) as { contact_info: string; skills: string };
    expect(resume).toBeDefined();
    expect(JSON.parse(resume.contact_info).name).toBe("Jane Doe");
    expect(JSON.parse(resume.skills)).toEqual(["JavaScript", "TypeScript", "React"]);
  });

  it("updates existing resume for existing user", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "jane@example.com", name: "Jane Doe", image: null },
      expires: "",
    });

    const userId = (db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run("jane@example.com", "Jane Doe") as { lastInsertRowid: number }).lastInsertRowid;
    db.prepare("INSERT INTO resumes (user_id, contact_info, work_experience, skills, education) VALUES (?, ?, ?, ?, ?)").run(userId, '{"name":"Old"}', '[]', '[]', '[]');

    const request = new NextRequest("http://localhost/api/resume/save", {
      method: "POST",
      body: JSON.stringify(validResume),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify resume was updated, not duplicated
    const resumes = db.prepare("SELECT * FROM resumes WHERE user_id = ?").all(userId);
    expect(resumes).toHaveLength(1);

    const resume = resumes[0] as { contact_info: string };
    expect(JSON.parse(resume.contact_info).name).toBe("Jane Doe");
  });

  it("saves optional fields when provided", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "jane@example.com", name: "Jane Doe", image: null },
      expires: "",
    });

    const resumeWithOptionals = {
      ...validResume,
      certifications: [{ name: "AWS Solutions Architect", issuer: "Amazon", date: "2023" }],
      languages: ["English", "Spanish"],
      honors: [{ title: "Dean's List", issuer: "UC Berkeley", date: "2021" }],
      summary: "Experienced full-stack developer",
      resume_style: "modern",
      accent_color: "#ff5733",
    };

    const request = new NextRequest("http://localhost/api/resume/save", {
      method: "POST",
      body: JSON.stringify(resumeWithOptionals),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get("jane@example.com") as { id: number };
    const resume = db.prepare("SELECT * FROM resumes WHERE user_id = ?").get(user.id) as {
      certifications: string; languages: string; honors: string; summary: string; resume_style: string; accent_color: string;
    };

    expect(JSON.parse(resume.certifications)).toHaveLength(1);
    expect(JSON.parse(resume.languages)).toEqual(["English", "Spanish"]);
    expect(JSON.parse(resume.honors)).toHaveLength(1);
    expect(resume.summary).toBe("Experienced full-stack developer");
    expect(resume.resume_style).toBe("modern");
    expect(resume.accent_color).toBe("#ff5733");
  });

  it("defaults resume_style to basic and accent_color to blue", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "jane@example.com", name: "Jane Doe", image: null },
      expires: "",
    });

    const request = new NextRequest("http://localhost/api/resume/save", {
      method: "POST",
      body: JSON.stringify(validResume),
    });
    await POST(request);

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get("jane@example.com") as { id: number };
    const resume = db.prepare("SELECT resume_style, accent_color FROM resumes WHERE user_id = ?").get(user.id) as { resume_style: string; accent_color: string };

    expect(resume.resume_style).toBe("basic");
    expect(resume.accent_color).toBe("#2563eb");
  });

  it("rejects work_experience exceeding max items", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "jane@example.com", name: "Jane Doe", image: null },
      expires: "",
    });

    const tooManyJobs = Array.from({ length: 51 }, (_, i) => ({
      company: `Company ${i}`, title: "Dev", start_date: "2020", end_date: "2021", description: ["Worked"],
    }));

    const request = new NextRequest("http://localhost/api/resume/save", {
      method: "POST",
      body: JSON.stringify({ ...validResume, work_experience: tooManyJobs }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
