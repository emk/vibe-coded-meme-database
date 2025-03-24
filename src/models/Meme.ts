import { Generated, Insertable, Selectable, Updateable } from 'kysely';

// Database schema types for Kysely
export interface Database {
  memes: MemeTable;
  meme_embeddings: {
    rowid: number;  // Maps to memes.id
    embedding: any; // Will be queried using MATCH operator
    distance: number; // For search results
  };
  memes_fts: {
    rowid: number;
    text: string | null;
    description: string | null; 
    keywords: string | null;
    filename: string;
    rank: number;
  };
  kysely_migration: {
    name: string;
    timestamp: string;
  };
  kysely_migration_lock: {
    id: string;
    is_locked: number;
  };
}

// Table schema for the memes table in the database
export interface MemeTable {
  // Generated columns
  id: Generated<number>;
  created_at: Generated<string>;
  
  // Regular columns
  path: string;
  filename: string;
  category: string;
  hash: string;
  
  // Nullable columns
  text: string | null;
  description: string | null;
  keywords: string | null;
}

// Types for different database operations
export type DatabaseMeme = Selectable<MemeTable>;
export type NewDatabaseMeme = Insertable<MemeTable>;
export type DatabaseMemeUpdate = Updateable<MemeTable>;

// Client-facing Meme type (after processing from database)
export interface Meme {
  id: number;
  path: string;
  filename: string;
  category: string;
  hash: string;
  text: string;
  description: string;
  keywords: string[];
  created_at: Date;
}

// Input type for creating a new meme
export interface MemeInput {
  path: string;
  filename: string;
  category: string;
  hash: string;
  text: string;
  description: string;
  keywords: string[];
}

// Interface for semantic search results
export interface SimilaritySearchResult {
  id: number;
  distance: number; // Raw distance from vector search
  similarity: number; // Normalized similarity score (0-1)
  meme: Meme;
}