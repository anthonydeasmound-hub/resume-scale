const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/DATABASE_URL=(.+)/);
if (!match) {
  console.log('DATABASE_URL not found');
  process.exit(1);
}
const DATABASE_URL = match[1].trim();

async function test() {
  try {
    const sql = neon(DATABASE_URL);
    const result = await sql('SELECT NOW()');
    console.log('Database connected:', result[0]);

    const tables = await sql(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('Tables:', tables.map(t => t.table_name).join(', ') || 'NONE - You need to run schema.sql!');

  } catch (e) {
    console.error('Database Error:', e.message);
  }
}
test();
