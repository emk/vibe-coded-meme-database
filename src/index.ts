import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import { DatabaseService } from './services/database';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Restrict CORS to specific origin if configured
  methods: ['GET']
}));
app.use(express.json({
  limit: '1mb' // Limit request body size
}));
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: '1d' // Set cache headers
}));

// Initialize database
const dbPath = process.env.DB_PATH || './memedb/memes.sqlite3';
const db = new DatabaseService(dbPath);

// Type declaration for Express route parameters
type MemeIdParams = { id: string };
type CategoryFilenameParams = { category: string; filename: string };

// API Routes
app.get('/api/memes', async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = 200; // Hard-coded limit to 200 memes
    let memes;
    
    if (query && query.trim()) {
      memes = await db.searchMemes(query, limit);
    } else {
      memes = await db.getAllMemes(limit);
    }
    
    res.json(memes);
  } catch (error) {
    console.error('Error fetching memes:', error);
    res.status(500).json({ error: 'Failed to fetch memes' });
    // Don't expose error details to the client
  }
});

app.get<MemeIdParams>('/api/memes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid meme ID' });
      return;
    }
    const meme = await db.getMemeById(id);
    
    if (!meme) {
      res.status(404).json({ error: 'Meme not found' });
      return;
    }
    
    res.json(meme);
  } catch (error) {
    console.error('Error fetching meme by ID:', error);
    res.status(500).json({ error: 'Failed to fetch meme' });
    // Don't expose error details to the client
  }
});

// Serve the meme image files
app.get<CategoryFilenameParams>('/images/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  
  // Validate input parameters to prevent directory traversal
  if (category.includes('..') || filename.includes('..') || 
      category.includes('/') || filename.includes('/') ||
      !category.match(/^[\w-]+$/) || !filename.match(/^[\w.-]+$/)) {
    res.status(400).send('Invalid request');
    return;
  }
  
  const memeDir = process.env.MEME_DIR || './memedb/memes';
  const imagePath = path.join(memeDir, category, filename);
  
  // Use path.resolve to get absolute path, then verify it's still within memeDir
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
  
  // Set security headers
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  res.sendFile(resolvedPath);
});

// Serve the main frontend
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server with async initialization
async function startServer() {
  try {
    // Initialize the database and run migrations
    await db.init();
    
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Use the following commands:');
      console.log(`- To import memes: npm run import <path-to-image-folder>`);
      console.log(`- Web UI available at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Start the server
startServer();