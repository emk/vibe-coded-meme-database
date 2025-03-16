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
  } catch (error) {
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

export async function registerExistingMigration(dbPath: string): Promise<void> {
  const { db, migrator } = await createMigrator(dbPath);

  try {
    // Check if kysely_migration table exists by trying to query it
    let migrationsTableExists = false;
    try {
      await db.selectFrom('kysely_migration').select('name').executeTakeFirst();
      migrationsTableExists = true;
    } catch (error) {
      // Table doesn't exist if we get an error
      migrationsTableExists = false;
    }

    if (!migrationsTableExists) {
      // Create kysely_migration table exactly as Kysely would
      await db.schema
        .createTable('kysely_migration')
        .addColumn('name', 'varchar(255)', (col) => col.notNull().primaryKey())
        .addColumn('timestamp', 'varchar(255)', (col) => col.notNull())
        .execute();
        
      // Create kysely_migration_lock table exactly as Kysely would
      await db.schema
        .createTable('kysely_migration_lock')
        .addColumn('id', 'varchar(255)', (col) => col.notNull().primaryKey())
        .addColumn('is_locked', 'integer', (col) => col.defaultTo(0).notNull())
        .execute();
        
      // Add default row to kysely_migration_lock
      await db
        .insertInto('kysely_migration_lock')
        .values({
          id: 'migration_lock',
          is_locked: 0
        })
        .execute();
    }

    // Check if initial migration is registered
    let initialMigration = null;
    try {
      initialMigration = await db
        .selectFrom('kysely_migration')
        .select('name')
        .where('name', '=', '001_initial_schema')
        .executeTakeFirst();
    } catch (error) {
      // If table was just created, this might fail
      initialMigration = null;
    }

    if (!initialMigration) {
      // Register the initial migration as already applied with exact name seen in new migrations
      await db
        .insertInto('kysely_migration')
        .values({
          name: '001_initial_schema',
          timestamp: new Date().toISOString(),
        })
        .execute();
        
      console.log('Successfully registered existing database as migrated');
    } else {
      console.log('Database is already registered with migration system');
    }
  } finally {
    await db.destroy();
  }
}