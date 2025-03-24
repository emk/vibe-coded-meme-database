# Semantic Search Implementation Notes

## Overview

We've implemented embedding-based semantic search for meme images using:
- `@xenova/transformers` for local text embedding generation
- `sqlite-vec` for vector storage and similarity search in SQLite
- A REST API endpoint for retrieving semantically similar memes

## Working Demo Implementation

We have a fully functional demo in `/tmp/demo/pipeline_demo.mjs` that proves the concept works:

```javascript
// Key parts of our working implementation
import { pipeline } from '@xenova/transformers';
import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';

// Initialize database
const db = new Database('/path/to/db');
sqliteVec.load(db);

// Get embedding model
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// Generate embedding
const output = await extractor(text, { pooling: 'mean', normalize: true });
const vector = Array.from(output.data);
const vectorJson = JSON.stringify(vector);

// Store in vector table
db.exec(`INSERT INTO vec_memes(rowid, embedding) VALUES(${id}, '${vectorJson}')`);

// Search with similarity
const searchQuery = `
  SELECT v.rowid, v.distance, m.text
  FROM vec_memes v
  JOIN memes m ON v.rowid = m.id
  WHERE v.embedding MATCH '${JSON.stringify(searchVector)}' AND k=3
  ORDER BY v.distance
`;
```

This implementation successfully demonstrates:
1. Generating text embeddings locally without external API dependencies
2. Storing and retrieving vector embeddings in SQLite
3. Performing semantic similarity searches with proper ranking
4. Vector data persistence between application runs

## Key Components

### Text Embedding Generation

We use `@xenova/transformers` with the feature extraction pipeline:

```javascript
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const output = await extractor(text, { pooling: 'mean', normalize: true });
const vector = Array.from(output.data);
```

- **Model**: Xenova/all-MiniLM-L6-v2 (384-dimension embeddings)
- **Normalization**: Vectors are normalized during extraction
- **Mean Pooling**: Used to get a single vector for a text sequence

### Vector Storage

We use `sqlite-vec` to add vector search capabilities to SQLite:

```javascript
// Load extension
sqliteVec.load(sqliteDb);

// Create vector table
CREATE VIRTUAL TABLE meme_embeddings USING vec0(
  embedding float[384]
);

// Store vector
INSERT INTO meme_embeddings(rowid, embedding) VALUES(memeId, vectorJson);
```

- **Table Type**: `vec0` virtual table from sqlite-vec
- **Dimension**: 384 (matching the embedding model)
- **Linking**: The `rowid` in the vector table matches the meme ID in the main table

### Vector Search

```javascript
// Query with embedding
const searchQuery = `
  SELECT v.rowid, v.distance, m.*
  FROM meme_embeddings v
  JOIN memes m ON v.rowid = m.id
  WHERE v.embedding MATCH ? AND k=?
  ORDER BY v.distance
`;
```

- **Similarity Metric**: Cosine distance (0-2 range, where 0 is identical)
- **Conversion**: We convert distance to similarity with `similarity = 1 - (distance / 2)`
- **Result Limit**: `k=limit` parameter controls the number of results

## Persistence

We confirmed that sqlite-vec tables are persistent across sessions. When we created a vector table in our demo app and stored vectors, we were able to reopen the database and successfully query the vectors without needing to recreate them.

## Performance Optimizations

- **Pipeline Caching**: We cache the embedding pipeline to avoid reloading the model for each query
- **Batch Processing**: When we add multiple memes, we reuse the pipeline
- **Error Handling**: We catch and log errors during embedding generation but allow operations to continue

## Integration

The semantic search functionality is integrated with:
- The `DatabaseService` for storing and retrieving embeddings
- The migration system for table creation (migration 003)
- The main meme import and search workflows

## Testing Challenges

While implementing tests, we encountered some challenges:
- ESM modules in `@xenova/transformers` require special Jest configuration
- The sqlite-vec extension needs to be properly loaded for migrations
- Effective mocking of the embedding generation and vector search functions

## Next Steps

- Complete test coverage with proper mocks for both `@xenova/transformers` and `sqlite-vec`
- Add a batch embedding generation tool for processing existing memes
- Consider a specialized API endpoint for semantic search with specific parameters
- Add a UI component for semantic search with similarity score visualization