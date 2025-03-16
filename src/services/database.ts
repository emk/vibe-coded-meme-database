import path from 'path';
import { promises as fs } from 'fs';
import { Kysely, SqliteDialect, sql } from 'kysely';
import Database from 'better-sqlite3';
import { 
  Database as DbType, 
  DatabaseMeme, 
  Meme, 
  MemeInput, 
  NewDatabaseMeme 
} from '../models/Meme';
import { migrateToLatest } from './migrator';

export class DatabaseService {
  protected db: Kysely<DbType>;
  protected dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.db = new Kysely<DbType>({
      dialect: new SqliteDialect({
        database: new Database(dbPath)
      }),
    });
  }

  // Initialize database with migrations
  public async init(): Promise<void> {
    await migrateToLatest(this.dbPath);
  }

  // Add a new meme to the database
  public async addMeme(meme: MemeInput): Promise<number> {
    // Prepare data for database insertion
    const newMeme: NewDatabaseMeme = {
      path: meme.path,
      filename: meme.filename,
      category: meme.category,
      hash: meme.hash,
      text: meme.text || null,
      description: meme.description || null,
      keywords: JSON.stringify(meme.keywords)
    };
    
    // Insert the meme and return the ID
    const result = await this.db
      .insertInto('memes')
      .values(newMeme)
      .returning('id')
      .executeTakeFirstOrThrow();
      
    return Number(result.id);
  }

  // Get meme by hash
  public async getMemeByHash(hash: string): Promise<Meme | null> {
    const row = await this.db
      .selectFrom('memes')
      .selectAll()
      .where('hash', '=', hash)
      .executeTakeFirst();
      
    if (!row) return null;
    
    return this.mapRowToMeme(row);
  }

  // Search memes
  public async searchMemes(query: string, limit: number = 200): Promise<Meme[]> {
    const searchPattern = `%${query}%`;
    const rows = await this.db
      .selectFrom('memes')
      .selectAll()
      .where(eb => eb.or([
        eb('text', 'like', searchPattern),
        eb('description', 'like', searchPattern),
        eb('keywords', 'like', searchPattern),
        eb('filename', 'like', searchPattern)
      ]))
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
      
    return rows.map(row => this.mapRowToMeme(row));
  }

  // Get all memes
  public async getAllMemes(limit: number = 200): Promise<Meme[]> {
    const rows = await this.db
      .selectFrom('memes')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
      
    return rows.map(row => this.mapRowToMeme(row));
  }

  // Get meme by ID
  public async getMemeById(id: number): Promise<Meme | null> {
    const row = await this.db
      .selectFrom('memes')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
      
    if (!row) return null;
    
    return this.mapRowToMeme(row);
  }

  // Close database connection
  public async close(): Promise<void> {
    await this.db.destroy();
  }

  // Helper method to map a database row to a client-facing Meme object
  private mapRowToMeme(row: DatabaseMeme): Meme {
    return {
      id: Number(row.id),
      path: row.path,
      filename: row.filename,
      category: row.category,
      hash: row.hash,
      text: row.text || '',
      description: row.description || '',
      keywords: JSON.parse(row.keywords || '[]'),
      created_at: new Date(row.created_at)
    };
  }
}