import dotenv from 'dotenv';
import { migrateToLatest } from '../services/migrator';

// Load environment variables
dotenv.config();

async function main() {
  const dbPath = process.env.DB_PATH || './memedb/memes.sqlite3';
  console.log(`Migrating database at ${dbPath}...`);
  await migrateToLatest(dbPath);
}

main().catch(error => {
  console.error('Migration error:', error);
  process.exit(1);
});