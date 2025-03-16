import dotenv from 'dotenv';
import { migrateToLatest, registerExistingMigration } from '../services/migrator';

// Load environment variables
dotenv.config();

async function main() {
  const dbPath = process.env.DB_PATH || './memedb/memes.sqlite3';
  const command = process.argv[2] || '';

  if (command === 'register-existing') {
    console.log(`Registering existing database at ${dbPath} with migration system...`);
    await registerExistingMigration(dbPath);
  } else {
    console.log(`Migrating database at ${dbPath}...`);
    await migrateToLatest(dbPath);
  }
}

main().catch(error => {
  console.error('Migration error:', error);
  process.exit(1);
});