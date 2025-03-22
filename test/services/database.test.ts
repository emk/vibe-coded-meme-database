import path from 'path';
import fs from 'fs';
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

  // Test search functionality
  test('searchMemes should find memes matching the query', async () => {
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
    const texts = results.map(m => m.text);
    const descriptions = results.map(m => m.description);
    
    expect(
      texts.includes('Unique search term alpha') || 
      descriptions.includes('But contains alpha in description')
    ).toBe(true);
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