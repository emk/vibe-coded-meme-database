// Database service module
import { Kysely, SqliteDialect, sql } from 'kysely';
import Database from 'better-sqlite3';
import { 
  Database as DbType, 
  DatabaseMeme, 
  Meme, 
  MemeInput, 
  NewDatabaseMeme,
  SimilaritySearchResult
} from '../models/Meme';
import { migrateToLatest } from './migrator';
import { pipeline } from '@xenova/transformers';
import { load as loadVecExtension } from 'sqlite-vec';

export class DatabaseService {
  protected db: Kysely<DbType>;
  protected dbPath: string;
  protected sqliteDb: Database.Database;
  private embeddingPipeline: any = null; // Cache for the embedding pipeline
  
  constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.sqliteDb = new Database(dbPath);
    
    // Load sqlite-vec extension for vector search
    try {
      loadVecExtension(this.sqliteDb);
      console.log('Vector search extension loaded successfully');
    } catch (err) {
      console.warn('Failed to load vector search extension:', err);
    }
    
    this.db = new Kysely<DbType>({
      dialect: new SqliteDialect({
        database: this.sqliteDb
      }),
    });
  }
  
  // Get embedding pipeline (cached)
  private async getEmbeddingPipeline() {
    if (!this.embeddingPipeline) {
      console.log('Initializing embedding pipeline...');
      this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('Embedding pipeline initialized');
    }
    return this.embeddingPipeline;
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
      
    const memeId = Number(result.id);
    
    // Generate and store embedding for the new meme
    await this.generateAndStoreEmbedding(memeId, meme);
      
    return memeId;
  }
  
  // Generate and store embeddings for a meme
  private async generateAndStoreEmbedding(memeId: number, meme: MemeInput): Promise<void> {
    // Create embeddings from text content
    const textToEmbed = [
      meme.text || '',
      meme.description || '',
      ...(meme.keywords || [])
    ].filter(Boolean).join(' ');
    
    // Skip if there's no text to embed
    if (!textToEmbed.trim()) {
      return;
    }
    
    try {
      // Get cached embedding pipeline
      const extractor = await this.getEmbeddingPipeline();
      
      // Generate embedding
      const output = await extractor(textToEmbed, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);
      const vectorJson = JSON.stringify(vector);
      
      // IMPORTANT: We tried multiple approaches for inserting embeddings:
      // 1. Kysely's sql`...` tagged template - Failed with "Only integers are allowed for primary key values"
      // 2. Prepared statements with ? placeholders - Failed with same error
      // 3. Prepared statements with named parameters - Failed with same error
      // 4. Direct SQL execution with string concatenation - This works!
      //
      // The sqlite-vec extension seems to have specific requirements for how data is passed
      // to its virtual tables, requiring direct SQL execution.
      
      // Ensure memeId is a proper number to avoid injection risks
      const rowid = Number(memeId);
      
      // Direct SQL execution with properly verified number and JSON-stringified vector
      this.sqliteDb.exec(`INSERT INTO meme_embeddings(rowid, embedding) VALUES(${rowid}, '${vectorJson}')`);
      
      console.log(`Stored embedding for meme ID ${rowid}`);
    } catch (err) {
      console.error(`Failed to generate or store embedding for meme ID ${memeId}:`, err);
    }
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

  // Search memes using FTS5 with ranking
  public async searchMemes(query: string, limit: number = 200): Promise<Meme[]> {
    if (!query.trim()) {
      return this.getAllMemes(limit);
    }

    // Format query for FTS5
    const ftsQuery = query.trim();
    
    // Use FTS5 with ranking
    const result = await sql<DatabaseMeme>`
      SELECT m.*
      FROM memes m
      JOIN (
        SELECT rowid, rank
        FROM memes_fts
        WHERE memes_fts MATCH ${ftsQuery}
        ORDER BY rank
      ) fts ON m.id = fts.rowid
      ORDER BY fts.rank, m.created_at DESC
      LIMIT ${limit}
    `.execute(this.db);
    
    return result.rows.map(row => this.mapRowToMeme(row));
  }
  
  // Semantic search using vector embeddings
  public async semanticSearch(query: string, limit: number = 10): Promise<SimilaritySearchResult[]> {
    if (!query.trim()) {
      return [];
    }
    
    try {
      // Get cached embedding pipeline
      const extractor = await this.getEmbeddingPipeline();
      
      // Generate embedding for the query
      const output = await extractor(query, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(output.data);
      const queryVectorJson = JSON.stringify(queryVector);
      
      // The MATCH operator in sqlite-vec requires direct SQL with string literals
      // Similar to the insertion process, parameterized queries don't work here either
      
      // Ensure limit is a proper number to avoid injection risks
      const numLimit = Number(limit);
      
      // Use direct SQL with properly verified number and JSON-stringified vector
      const directSql = `
        SELECT v.rowid, v.distance, m.*
        FROM meme_embeddings v
        JOIN memes m ON v.rowid = m.id
        WHERE v.embedding MATCH '${queryVectorJson}' AND k=${numLimit}
        ORDER BY v.distance
      `;
      
      const rows = this.sqliteDb.prepare(directSql).all();
      
      // Map the results
      return rows.map(row => {
        // Type the row as DatabaseMeme with distance
        const typedRow = row as DatabaseMeme & { distance: number };
        const meme = this.mapRowToMeme(typedRow);
        const distance = typedRow.distance;
        
        // Convert distance to similarity score (1 is perfect match, 0 is completely dissimilar)
        // Cosine distance range is 0-2, where 0 is identical
        const similarity = Math.max(0, 1 - (distance / 2));
        
        return {
          id: meme.id,
          distance,
          similarity,
          meme
        };
      });
    } catch (err) {
      console.error('Semantic search failed:', err);
      return [];
    }
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
  
  // Get multiple memes by IDs
  public async getMemesByIds(ids: number[]): Promise<Meme[]> {
    if (ids.length === 0) return [];
    
    const rows = await this.db
      .selectFrom('memes')
      .selectAll()
      .where('id', 'in', ids)
      .execute();
      
    return rows.map(row => this.mapRowToMeme(row));
  }

  // Close database connection and release resources
  public async close(): Promise<void> {
    this.embeddingPipeline = null; // Release the pipeline
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