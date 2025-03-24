import express from 'express';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseService } from '../../src/services/database';
import { getTempDbPath, getTempMemeDir } from '../setup';

// Helper to create a test Express app with our routes
function createTestApp(dbService: DatabaseService, memeDir: string) {
  const app = express();
  app.use(express.json());
  
  // Add the routes from index.ts (simplified version for testing)
  app.get('/api/memes', async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = 200;
      let memes;
      
      if (query && query.trim()) {
        memes = await dbService.searchMemes(query, limit);
      } else {
        memes = await dbService.getAllMemes(limit);
      }
      
      res.json(memes);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch memes' });
    }
  });

  app.get('/api/memes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid meme ID' });
        return;
      }
      const meme = await dbService.getMemeById(id);
      
      if (!meme) {
        res.status(404).json({ error: 'Meme not found' });
        return;
      }
      
      res.json(meme);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch meme' });
    }
  });

  app.get('/images/:category/:filename', (req, res) => {
    const { category, filename } = req.params;
    
    // Validate input parameters
    if (category.includes('..') || filename.includes('..') || 
        category.includes('/') || filename.includes('/')) {
      res.status(400).send('Invalid request');
      return;
    }
    
    const imagePath = path.join(memeDir, category, filename);
    
    // Verify path is within memeDir
    const resolvedPath = path.resolve(imagePath);
    const resolvedMemeDir = path.resolve(memeDir);
    
    if (!resolvedPath.startsWith(resolvedMemeDir)) {
      res.status(403).send('Forbidden');
      return;
    }
    
    if (!fs.existsSync(resolvedPath)) {
      res.status(404).send('Image not found');
      return;
    }
    
    // For testing, just read and send the file directly
    // instead of using res.sendFile which doesn't work well in tests
    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    res.send(fileContent);
  });

  return app;
}

describe('API Routes', () => {
  let dbService: DatabaseService;
  let app: express.Application;
  let dbPath: string;
  let memeDir: string;

  // Setup before all tests
  beforeAll(async () => {
    // Create test database and directories
    dbPath = getTempDbPath();
    memeDir = getTempMemeDir();
    
    // Add test category directory
    const testCategoryDir = path.join(memeDir, 'test-category');
    fs.mkdirSync(testCategoryDir, { recursive: true });
    
    // Create a test image file
    const testImagePath = path.join(testCategoryDir, 'test-image.jpg');
    fs.writeFileSync(testImagePath, 'dummy image data');
    
    // Initialize database
    dbService = new DatabaseService(dbPath);
    await dbService.init();
    
    // Add some test memes to the database
    await dbService.addMeme({
      path: '/test-category/test-image.jpg',
      filename: 'test-image',
      category: 'test-category',
      hash: 'test-hash-1',
      text: 'Test meme 1',
      description: 'A test meme for API testing',
      keywords: ['test', 'api']
    });
    
    await dbService.addMeme({
      path: '/test-category/test-image2.jpg',
      filename: 'test-image2',
      category: 'test-category',
      hash: 'test-hash-2',
      text: 'Special test meme',
      description: 'Another test meme with special keywords',
      keywords: ['test', 'special', 'api']
    });
    
    // Create test app
    app = createTestApp(dbService, memeDir);
  });

  // Cleanup after tests
  afterAll(async () => {
    await dbService.close();
    
    // Clean up test files and directories
    try {
      fs.unlinkSync(dbPath);
      fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
      fs.rmSync(memeDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Failed to clean up test files: ${err}`);
    }
  });

  // Test GET /api/memes
  test('GET /api/memes should return all memes', async () => {
    const response = await request(app).get('/api/memes');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  // Test GET /api/memes with search
  test('GET /api/memes?q=special should filter memes', async () => {
    const response = await request(app).get('/api/memes?q=special');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // At least one result should contain 'special' in its text or keywords
    const hasSpecial = response.body.some((meme: any) => 
      meme.text.includes('special') || 
      meme.description.includes('special') || 
      meme.keywords.includes('special')
    );
    
    expect(hasSpecial).toBe(true);
  });

  // Test GET /api/memes/:id
  test('GET /api/memes/:id should return a specific meme', async () => {
    // Get all memes to find a valid ID
    const allMemes = await request(app).get('/api/memes');
    const firstMeme = allMemes.body[0];
    const id = firstMeme.id;
    
    const response = await request(app).get(`/api/memes/${id}`);
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(id);
  });

  // Test GET /api/memes/:id with invalid ID
  test('GET /api/memes/:id with invalid ID should return 400', async () => {
    const response = await request(app).get('/api/memes/invalid');
    expect(response.status).toBe(400);
  });

  // Test GET /api/memes/:id with non-existent ID
  test('GET /api/memes/:id with non-existent ID should return 404', async () => {
    const response = await request(app).get('/api/memes/9999');
    expect(response.status).toBe(404);
  });

  // Test GET /images/:category/:filename
  test('GET /images/:category/:filename should serve the image file', async () => {
    const response = await request(app).get('/images/test-category/test-image.jpg');
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('dummy image data');
  });

  // Instead of trying to test path traversal in the URL structure (which is handled differently by Express),
  // let's test the actual validation in our endpoint
  test('GET /images/:category/:filename with invalid characters should return 400', async () => {
    // Test with '..' directly in the category parameter
    const response = await request(app).get('/images/test..category/test-image.jpg');
    expect(response.status).toBe(400);
  });

  // Test GET /images/:category/:filename with non-existent file
  test('GET /images/:category/:filename with non-existent file should return 404', async () => {
    const response = await request(app).get('/images/test-category/non-existent.jpg');
    expect(response.status).toBe(404);
  });
});