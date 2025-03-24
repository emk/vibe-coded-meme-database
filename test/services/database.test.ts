import path from 'path';
import fs from 'fs';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseService } from '../../src/services/database';
import { MemeInput } from '../../src/models/Meme';
import { getTempDbPath } from '../setup';

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let dbPath: string;

  // Setup a fresh database for each test suite
  beforeAll(async () => {
    // Create a temporary database file
    dbPath = getTempDbPath();
    console.log(`Using test database at: ${dbPath}`);
    
    // Initialize database service with test database
    dbService = new DatabaseService(dbPath);
    await dbService.init(); // This will run migrations
  });

  // Clean up after all tests
  afterAll(async () => {
    // Close the database connection
    await dbService.close();
    
    // Remove the test database file
    try {
      fs.unlinkSync(dbPath);
      fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
    } catch (err) {
      console.warn(`Failed to clean up test database: ${err}`);
    }
  });

  // Sample meme for testing
  const sampleMeme: MemeInput = {
    path: '/path/to/meme.jpg',
    filename: 'sample-meme',
    category: 'funny',
    hash: 'abc123',
    text: 'Sample meme text',
    description: 'A sample meme for testing',
    keywords: ['test', 'sample', 'meme']
  };

  // Test adding a meme
  test('addMeme should add a meme to the database', async () => {
    const id = await dbService.addMeme(sampleMeme);
    expect(id).toBeGreaterThan(0);
  });

  // Test retrieving a meme by ID
  test('getMemeById should return the correct meme', async () => {
    // First add a meme
    const id = await dbService.addMeme({
      ...sampleMeme,
      hash: 'unique-hash-1',
      text: 'Another sample meme'
    });

    // Then retrieve it by ID
    const meme = await dbService.getMemeById(id);
    
    expect(meme).not.toBeNull();
    expect(meme?.id).toBe(id);
    expect(meme?.text).toBe('Another sample meme');
    expect(meme?.hash).toBe('unique-hash-1');
    expect(Array.isArray(meme?.keywords)).toBe(true);
    expect(meme?.keywords).toEqual(['test', 'sample', 'meme']);
  });

  // Test retrieving a meme by hash
  test('getMemeByHash should return the correct meme', async () => {
    // First add a meme with a unique hash
    const uniqueHash = 'unique-hash-2';
    await dbService.addMeme({
      ...sampleMeme,
      hash: uniqueHash
    });

    // Then retrieve it by hash
    const meme = await dbService.getMemeByHash(uniqueHash);
    
    expect(meme).not.toBeNull();
    expect(meme?.hash).toBe(uniqueHash);
  });

  // Test getting all memes
  test('getAllMemes should return all memes with limit', async () => {
    // Add a few more memes
    for (let i = 0; i < 5; i++) {
      await dbService.addMeme({
        ...sampleMeme,
        hash: `batch-hash-${i}`,
        text: `Batch meme ${i}`
      });
    }

    // Get memes with limit
    const memes = await dbService.getAllMemes(3);
    
    expect(Array.isArray(memes)).toBe(true);
    expect(memes.length).toBe(3); // Should respect the limit
    
    // Memes should be ordered by created_at DESC
    expect(new Date(memes[0].created_at).getTime())
      .toBeGreaterThanOrEqual(new Date(memes[1].created_at).getTime());
  });

  // Basic search functionality
  test('searchMemes should find memes matching a simple query', async () => {
    // Add memes with specific text for searching
    await dbService.addMeme({
      ...sampleMeme,
      hash: 'search-hash-1',
      text: 'Unique search term alpha',
      keywords: ['unique', 'search', 'test']
    });

    await dbService.addMeme({
      ...sampleMeme,
      hash: 'search-hash-2',
      text: 'Different content',
      description: 'But contains alpha in description',
      keywords: ['different', 'alpha', 'test']
    });

    // Search for 'alpha'
    const results = await dbService.searchMemes('alpha');
    
    expect(results.length).toBeGreaterThanOrEqual(2);
    
    // Check that our two test memes are found
    const foundHashesSet = new Set(results.map(m => m.hash));
    expect(foundHashesSet.has('search-hash-1')).toBe(true);
    expect(foundHashesSet.has('search-hash-2')).toBe(true);
  });

  // Test advanced search features
  describe('FTS5 search capabilities', () => {
    beforeAll(async () => {
      // Add a variety of memes for testing different search features
      await dbService.addMeme({
        ...sampleMeme,
        hash: 'fts-test-1',
        text: 'Surprised pikachu meme',
        description: 'A yellow pokemon looking surprised',
        keywords: ['surprised', 'pikachu', 'pokemon', 'reaction']
      });

      await dbService.addMeme({
        ...sampleMeme,
        hash: 'fts-test-2',
        text: 'Distracted boyfriend meme',
        description: 'Guy looking at another woman while with girlfriend',
        keywords: ['distracted', 'boyfriend', 'jealous', 'reaction']
      });

      await dbService.addMeme({
        ...sampleMeme,
        hash: 'fts-test-3',
        text: 'Pikachu detective movie poster',
        description: 'Promotional image from the movie',
        keywords: ['pikachu', 'detective', 'movie', 'pokemon']
      });

      await dbService.addMeme({
        ...sampleMeme,
        hash: 'fts-test-4',
        text: 'Programming bug meme',
        description: 'When your code works but you dont know why',
        keywords: ['programming', 'code', 'bug', 'work']
      });

      await dbService.addMeme({
        ...sampleMeme,
        hash: 'fts-test-5',
        text: 'Working from home programming meme',
        description: 'Programmer in pajamas with coffee',
        keywords: ['work', 'home', 'programming', 'remote']
      });
    });

    // Test exact phrase search
    test('should find exact phrases with quotes', async () => {
      const results = await dbService.searchMemes('"surprised pikachu"');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(m => m.hash === 'fts-test-1')).toBe(true);
      
      // Should not match partial phrases
      expect(results.some(m => m.hash === 'fts-test-3')).toBe(false);
    });

    // Test OR operator
    test('should handle OR queries correctly', async () => {
      const results = await dbService.searchMemes('boyfriend OR detective');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      const foundHashes = results.map(m => m.hash);
      expect(foundHashes).toContain('fts-test-2'); // boyfriend
      expect(foundHashes).toContain('fts-test-3'); // detective
    });

    // Test AND operator (implicit in FTS5)
    test('should handle implicit AND queries', async () => {
      const results = await dbService.searchMemes('pikachu pokemon');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      const foundHashes = results.map(m => m.hash);
      expect(foundHashes).toContain('fts-test-1'); // has both terms
      expect(foundHashes).toContain('fts-test-3'); // has both terms
    });

    // Test prefix search
    test('should handle prefix searches with wildcard', async () => {
      const results = await dbService.searchMemes('program*');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      const foundHashes = results.map(m => m.hash);
      expect(foundHashes).toContain('fts-test-4'); // programming
      expect(foundHashes).toContain('fts-test-5'); // programming
    });

    // Test column-specific search
    test('should handle column-specific searches', async () => {
      const results = await dbService.searchMemes('description:pokemon');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(m => m.hash === 'fts-test-1')).toBe(true);
      
      // Test with keywords field
      const keywordResults = await dbService.searchMemes('keywords:pokemon');
      expect(keywordResults.some(m => m.hash === 'fts-test-1')).toBe(true);
      expect(keywordResults.some(m => m.hash === 'fts-test-3')).toBe(true);
    });

    // Test NEAR operator
    test('should handle NEAR operator for proximity searches', async () => {
      // Add a meme with terms near each other
      await dbService.addMeme({
        ...sampleMeme,
        hash: 'fts-test-6',
        text: 'This is a very funny reaction meme about humor',
        description: 'Humorous content for reactions',
        keywords: ['funny', 'reaction', 'humor']
      });

      // First test with a simple search to ensure the meme is findable
      const basicResults = await dbService.searchMemes('funny');
      expect(basicResults.some(m => m.hash === 'fts-test-6')).toBe(true);
      
      // Then test with the NEAR operator syntax
      // FTS5 NEAR syntax is 'NEAR(term1 term2, distance)'
      const results = await dbService.searchMemes('NEAR(funny reaction, 10)');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(m => m.hash === 'fts-test-6')).toBe(true);
    });

    // Test combined query with parentheses
    test('should handle grouped expressions with parentheses', async () => {
      const results = await dbService.searchMemes('pikachu AND (surprised OR detective)');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      const foundHashes = results.map(m => m.hash);
      expect(foundHashes).toContain('fts-test-1'); // pikachu and surprised
      expect(foundHashes).toContain('fts-test-3'); // pikachu and detective
    });
    
    // Test NOT operator
    test('should handle NOT operator for exclusion', async () => {
      // Should find pikachu memes that are not detective-related
      const results = await dbService.searchMemes('pikachu NOT detective');
      
      expect(results.length).toBeGreaterThanOrEqual(1);
      const foundHashes = results.map(m => m.hash);
      expect(foundHashes).toContain('fts-test-1'); // pikachu surprised (not detective)
      expect(foundHashes).not.toContain('fts-test-3'); // pikachu detective (excluded)
    });
  });

  // Test getting memes by IDs
  test('getMemesByIds should return memes with matching IDs', async () => {
    // Add two new memes and capture their IDs
    const id1 = await dbService.addMeme({
      ...sampleMeme,
      hash: 'ids-test-hash-1',
      text: 'First ID test meme'
    });

    const id2 = await dbService.addMeme({
      ...sampleMeme,
      hash: 'ids-test-hash-2',
      text: 'Second ID test meme'
    });

    // Get memes by IDs
    const memes = await dbService.getMemesByIds([id1, id2]);
    
    expect(memes.length).toBe(2);
    
    // Verify both memes were retrieved
    const ids = memes.map(m => m.id);
    expect(ids).toContain(id1);
    expect(ids).toContain(id2);
  });

  // Test edge cases
  test('getMemeById should return null for non-existent ID', async () => {
    const meme = await dbService.getMemeById(999999);
    expect(meme).toBeNull();
  });

  test('getMemeByHash should return null for non-existent hash', async () => {
    const meme = await dbService.getMemeByHash('non-existent-hash');
    expect(meme).toBeNull();
  });

  test('getMemesByIds should handle empty array', async () => {
    const memes = await dbService.getMemesByIds([]);
    expect(Array.isArray(memes)).toBe(true);
    expect(memes.length).toBe(0);
  });

  test('searchMemes should handle empty query', async () => {
    const memes = await dbService.searchMemes('');
    expect(Array.isArray(memes)).toBe(true);
    // Empty query should return same as getAllMemes
  });
});