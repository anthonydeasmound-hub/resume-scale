import { queryOne, queryAll, execute } from "../src/lib/db";

async function clearUserData(email: string) {
  // Get user ID
  const user = await queryOne<{ id: number }>(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (!user) {
    console.log("User not found:", email);
    return;
  }

  const userId = user.id;
  console.log(`Found user ID: ${userId} for email: ${email}`);

  // Get job IDs for this user (needed for cascading deletes)
  const jobs = await queryAll<{ id: number }>(
    "SELECT id FROM job_applications WHERE user_id = $1",
    [userId]
  );
  const jobIds = jobs.map(j => j.id);
  console.log(`Found ${jobIds.length} jobs to delete`);

  if (jobIds.length > 0) {
    const placeholders = jobIds.map((_, i) => `$${i + 1}`).join(",");
    
    // Delete job-related data first (child tables)
    await execute(`DELETE FROM calendar_events WHERE job_id IN (${placeholders})`, jobIds);
    console.log("Deleted calendar_events");
    
    await execute(`DELETE FROM email_actions WHERE job_id IN (${placeholders})`, jobIds);
    console.log("Deleted email_actions");
    
    await execute(`DELETE FROM interview_stages WHERE job_id IN (${placeholders})`, jobIds);
    console.log("Deleted interview_stages");
    
    await execute(`DELETE FROM job_notes WHERE job_id IN (${placeholders})`, jobIds);
    console.log("Deleted job_notes");
    
    // Delete jobs
    await execute("DELETE FROM job_applications WHERE user_id = $1", [userId]);
    console.log("Deleted job_applications");
  }

  // Delete resumes
  await execute("DELETE FROM resumes WHERE user_id = $1", [userId]);
  console.log("Deleted resumes");

  // Delete bullet feedback
  await execute("DELETE FROM bullet_feedback WHERE user_id = $1", [userId]);
  console.log("Deleted bullet_feedback");

  // Delete user settings (to reset onboarding)
  await execute("DELETE FROM user_settings WHERE user_id = $1", [userId]);
  console.log("Deleted user_settings");

  console.log("\nAll user data cleared successfully! Account preserved.");
}

clearUserData("anthonydeasmound@gmail.com");
