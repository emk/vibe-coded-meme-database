import { FileMigrationProvider, Kysely, Migrator, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { Database as DbType } from '../models/Meme';
import { load as loadVecExtension } from 'sqlite-vec';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createMigrator(dbPath: string): Promise<{
  db: Kysely<DbType>;
  migrator: Migrator;
}> {
  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  try {
    await fs.mkdir(dbDir, { recursive: true });
  } catch (_) {
    // Directory already exists
  }

  // Initialize better-sqlite3 database directly
  const sqliteDb = new Database(dbPath);
  
  // Load the vector extension before creating Kysely instance
  try {
    loadVecExtension(sqliteDb);
    console.log('Vector search extension loaded for migrations');
  } catch (err) {
    console.warn('Failed to load vector search extension for migrations:', err);
  }

  // Create Kysely instance with the SQLite connection
  const db = new Kysely<DbType>({
    dialect: new SqliteDialect({
      database: sqliteDb
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.resolve(__dirname, '../migrations'),
    }),
  });

  return { db, migrator };
}

export async function migrateToLatest(dbPath: string): Promise<void> {
  const { db, migrator } = await createMigrator(dbPath);

  try {
    const { error, results } = await migrator.migrateToLatest();

    if (results && results.length > 0) {
      for (const result of results) {
        if (result.status === 'Success') {
          console.log(`Migration "${result.migrationName}" was executed successfully`);
        } else if (result.status === 'Error') {
          console.error(`Failed to execute migration "${result.migrationName}"`);
        }
      }
    }

    if (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  } finally {
    await db.destroy();
  }
}

