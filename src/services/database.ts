import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Meme, MemeInput } from '../models/Meme';

export class DatabaseService {
  protected db: Database.Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        filename TEXT NOT NULL,
        category TEXT NOT NULL,
        hash TEXT NOT NULL UNIQUE,
        text TEXT,
        description TEXT,
        keywords TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_memes_hash ON memes(hash);
      CREATE INDEX IF NOT EXISTS idx_memes_text ON memes(text);
      CREATE INDEX IF NOT EXISTS idx_memes_description ON memes(description);
      CREATE INDEX IF NOT EXISTS idx_memes_keywords ON memes(keywords);
    `);
  }

  public addMeme(meme: MemeInput): number {
    const stmt = this.db.prepare(`
      INSERT INTO memes (path, filename, category, hash, text, description, keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      meme.path,
      meme.filename,
      meme.category,
      meme.hash,
      meme.text,
      meme.description,
      JSON.stringify(meme.keywords)
    );

    return result.lastInsertRowid as number;
  }

  public getMemeByHash(hash: string): Meme | null {
    const stmt = this.db.prepare('SELECT * FROM memes WHERE hash = ?');
    const row = stmt.get(hash) as any;
    
    if (!row) return null;
    
    return {
      ...row,
      keywords: JSON.parse(row.keywords || '[]'),
      created_at: new Date(row.created_at),
      description: row.description || '' 
    };
  }

  public searchMemes(query: string, limit: number = 200): Meme[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memes 
      WHERE text LIKE ? OR description LIKE ? OR keywords LIKE ? OR filename LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    const searchPattern = `%${query}%`;
    const rows = stmt.all(searchPattern, searchPattern, searchPattern, searchPattern, limit) as any[];
    
    return rows.map(row => ({
      ...row,
      keywords: JSON.parse(row.keywords || '[]'),
      created_at: new Date(row.created_at)
    }));
  }

  public getAllMemes(limit: number = 200): Meme[] {
    const stmt = this.db.prepare('SELECT * FROM memes ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    
    return rows.map(row => ({
      ...row,
      keywords: JSON.parse(row.keywords || '[]'),
      created_at: new Date(row.created_at),
      description: row.description || ''
    }));
  }

  public getMemeById(id: number): Meme | null {
    const stmt = this.db.prepare('SELECT * FROM memes WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      ...row,
      keywords: JSON.parse(row.keywords || '[]'),
      created_at: new Date(row.created_at),
      description: row.description || ''
    };
  }

  public close(): void {
    this.db.close();
  }
}