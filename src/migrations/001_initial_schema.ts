import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {

  // Create memes table
  await db.schema
    .createTable('memes')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('path', 'text', (col) => col.notNull())
    .addColumn('filename', 'text', (col) => col.notNull())
    .addColumn('category', 'text', (col) => col.notNull())
    .addColumn('hash', 'text', (col) => col.notNull().unique())
    .addColumn('text', 'text')
    .addColumn('description', 'text')
    .addColumn('keywords', 'text')
    .addColumn('created_at', 'text', (col) => 
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();

  // Create indexes
  await db.schema
    .createIndex('idx_memes_hash')
    .on('memes')
    .column('hash')
    .execute();

  await db.schema
    .createIndex('idx_memes_text')
    .on('memes')
    .column('text')
    .execute();
    
  await db.schema
    .createIndex('idx_memes_description')
    .on('memes')
    .column('description')
    .execute();
    
  await db.schema
    .createIndex('idx_memes_keywords')
    .on('memes')
    .column('keywords')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_memes_keywords').execute();
  await db.schema.dropIndex('idx_memes_description').execute();
  await db.schema.dropIndex('idx_memes_text').execute();
  await db.schema.dropIndex('idx_memes_hash').execute();
  await db.schema.dropTable('memes').execute();
}