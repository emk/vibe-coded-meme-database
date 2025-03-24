import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create virtual table for vector search
  // Uses dimension 384 for all-MiniLM-L6-v2 model
  try {
    // The vector extension should be loaded by the migrator before this runs
    await sql`
      CREATE VIRTUAL TABLE IF NOT EXISTS meme_embeddings USING vec0(
        embedding float[384]
      )
    `.execute(db);
    
    console.log('Successfully created meme_embeddings vector table');
  } catch (error) {
    console.error('Failed to create vector table:', error);
    throw error;
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the vector search table
  try {
    await sql`DROP TABLE IF EXISTS meme_embeddings`.execute(db);
    console.log('Successfully dropped meme_embeddings vector table');
  } catch (error) {
    console.error('Failed to drop vector table:', error);
    throw error;
  }
}