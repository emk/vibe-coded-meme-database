import { FileMigrationProvider, Kysely, Migrator, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import * as path from 'path';
import { promises as fs } from 'fs';
import { Database as DbType } from '../models/Meme';

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

  const db = new Kysely<DbType>({
    dialect: new SqliteDialect({
      database: new Database(dbPath)
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

