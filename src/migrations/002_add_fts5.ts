import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create FTS5 virtual table
  await sql`
    CREATE VIRTUAL TABLE IF NOT EXISTS memes_fts USING fts5(
      text, 
      description, 
      keywords,
      filename,
      content='memes',
      content_rowid='id'
    )
  `.execute(db);

  // Populate FTS table with existing data
  await sql`
    INSERT INTO memes_fts(rowid, text, description, keywords, filename)
    SELECT id, text, description, keywords, filename FROM memes
  `.execute(db);

  // Create triggers to keep FTS index in sync
  await sql`
    CREATE TRIGGER IF NOT EXISTS memes_ai AFTER INSERT ON memes BEGIN
      INSERT INTO memes_fts(rowid, text, description, keywords, filename)
      VALUES (new.id, new.text, new.description, new.keywords, new.filename);
    END;
  `.execute(db);

  await sql`
    CREATE TRIGGER IF NOT EXISTS memes_ad AFTER DELETE ON memes BEGIN
      DELETE FROM memes_fts WHERE rowid = old.id;
    END;
  `.execute(db);

  await sql`
    CREATE TRIGGER IF NOT EXISTS memes_au AFTER UPDATE ON memes BEGIN
      DELETE FROM memes_fts WHERE rowid = old.id;
      INSERT INTO memes_fts(rowid, text, description, keywords, filename)
      VALUES (new.id, new.text, new.description, new.keywords, new.filename);
    END;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop triggers
  await sql`DROP TRIGGER IF EXISTS memes_au`.execute(db);
  await sql`DROP TRIGGER IF EXISTS memes_ad`.execute(db);
  await sql`DROP TRIGGER IF EXISTS memes_ai`.execute(db);
  
  // Drop FTS table
  await sql`DROP TABLE IF EXISTS memes_fts`.execute(db);
}