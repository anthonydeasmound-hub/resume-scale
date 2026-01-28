import { vi } from "vitest";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock rate limiting — always allow
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
}));

// Mock the database module with an in-memory SQLite instance
// that translates PostgreSQL syntax to SQLite
vi.mock("@/lib/db", async () => {
  const Database = (await import("better-sqlite3")).default;
  const db = new Database(":memory:");

  // Create tables matching the production schema
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_info TEXT,
      work_experience TEXT,
      skills TEXT,
      education TEXT,
      certifications TEXT,
      languages TEXT,
      honors TEXT,
      profile_photo_path TEXT,
      summary TEXT,
      resume_style TEXT DEFAULT 'basic',
      accent_color TEXT DEFAULT '#2563eb',
      raw_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_name TEXT NOT NULL,
      job_title TEXT NOT NULL,
      job_description TEXT,
      tailored_resume TEXT,
      cover_letter TEXT,
      resume_style TEXT DEFAULT 'classic',
      resume_color TEXT DEFAULT '#000000',
      status TEXT DEFAULT 'draft',
      reviewed INTEGER DEFAULT 0,
      date_applied DATETIME,
      job_details_parsed TEXT,
      recruiter_name TEXT,
      recruiter_email TEXT,
      recruiter_title TEXT,
      recruiter_source TEXT,
      interview_guide TEXT,
      interview_guide_generated_at DATETIME,
      job_analysis TEXT,
      archived_at DATETIME,
      pinned INTEGER DEFAULT 0,
      last_activity_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE extension_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE interview_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      stage_number INTEGER NOT NULL,
      stage_type TEXT NOT NULL,
      stage_name TEXT,
      status TEXT DEFAULT 'pending',
      scheduled_at DATETIME,
      completed_at DATETIME,
      notes TEXT,
      source TEXT,
      source_email_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE email_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      stage_id INTEGER,
      email_type TEXT NOT NULL,
      direction TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      recipient_email TEXT,
      gmail_message_id TEXT,
      gmail_thread_id TEXT,
      status TEXT DEFAULT 'pending',
      sent_at DATETIME,
      detected_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE job_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE bullet_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_title TEXT NOT NULL,
      company TEXT,
      bullet_text TEXT NOT NULL,
      feedback TEXT NOT NULL,
      was_user_written INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Translate PostgreSQL $1, $2, ... to SQLite ? placeholders
  function convertParams(query: string): string {
    return query.replace(/\$\d+/g, "?");
  }

  // Translate PostgreSQL functions to SQLite equivalents
  function convertSQL(query: string): string {
    let converted = convertParams(query);
    // NOW() + INTERVAL '30 days' → datetime('now', '+30 days')
    converted = converted.replace(
      /NOW\(\)\s*\+\s*INTERVAL\s*'(\d+)\s+days'/gi,
      "datetime('now', '+$1 days')"
    );
    // NOW() → datetime('now')
    converted = converted.replace(/NOW\(\)/g, "datetime('now')");
    // Strip RETURNING id (handled separately)
    converted = converted.replace(/\s*RETURNING\s+id\s*/gi, " ");
    return converted;
  }

  async function queryOne<T>(query: string, params: unknown[] = []): Promise<T | undefined> {
    const row = db.prepare(convertSQL(query)).get(...params);
    return row as T | undefined;
  }

  async function queryAll<T>(query: string, params: unknown[] = []): Promise<T[]> {
    const rows = db.prepare(convertSQL(query)).all(...params);
    return rows as T[];
  }

  async function execute(
    query: string,
    params: unknown[] = []
  ): Promise<{ rows: Record<string, unknown>[]; rowCount: number }> {
    const result = db.prepare(convertSQL(query)).run(...params);
    // Handle RETURNING id — return lastInsertRowid as if PostgreSQL returned it
    if (/RETURNING\s+id/i.test(query)) {
      return { rows: [{ id: result.lastInsertRowid }], rowCount: 1 };
    }
    return { rows: [], rowCount: result.changes };
  }

  return {
    queryOne,
    queryAll,
    execute,
    // Expose raw SQLite instance for test setup/teardown
    _testDb: db,
  };
});
