import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import archiver from 'archiver';
import { DatabaseService } from './services/database';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Restrict CORS to specific origin if configured
  methods: ['GET', 'POST'] // Allow POST for zip download
}));
app.use(express.json({
  limit: '1mb' // Limit request body size
}));
// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../dist/client'), {
  maxAge: '1d'
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

// Download selected memes as a zip file
app.post('/api/memes/download', async (req, res) => {
  try {
    const { ids } = req.body;
    
    // Validate input - ids must be an array of numbers
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every(id => typeof id === 'number')) {
      res.status(400).json({ error: 'Invalid or empty meme selection' });
      return;
    }
    
    // Fetch meme details from database by IDs in a single query
    const memes = await db.getMemesByIds(ids);
    
    if (memes.length === 0) {
      res.status(404).json({ error: 'No valid memes found' });
      return;
    }
    
    // Generate date-time string in YYYYMMDD-HHMMSS format
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const dateTime = `${dateStr}-${timeStr}`;
    
    // Use the same base name for both the zip file and the folder
    const baseName = `selected-memes-${dateTime}`;
    const zipFilename = `${baseName}.zip`;
    
    // Set up the response headers for a zip file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
    
    // Create a zip archive with no compression for image files (already compressed)
    const archive = archiver('zip', {
      zlib: { level: 0 }
    });
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    // Set up error handling for the archive
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      // Only send an error response if headers haven't been sent yet
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create zip file' });
      } else {
        res.end();
      }
    });
    
    const memeDir = process.env.MEME_DIR || './memedb/memes';
    
    // Add each meme to the archive within a top-level directory
    for (const meme of memes) {
      if (!meme) continue;
      
      // Get the file extension from the path
      const fileExt = meme.path.substring(meme.path.lastIndexOf('.'));
      
      // Create the source file path
      const filePath = path.join(memeDir, meme.category, meme.filename + fileExt);
      
      // Skip if file doesn't exist
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }
      
      // Validate that the resolved path is within the meme directory (security)
      const resolvedPath = path.resolve(filePath);
      const resolvedMemeDir = path.resolve(memeDir);
      
      if (!resolvedPath.startsWith(resolvedMemeDir)) {
        console.warn(`Security check failed for path: ${filePath}`);
        continue;
      }
      
      // Add file to zip with the top-level directory structure
      archive.file(filePath, { name: `${baseName}/${meme.filename}${fileExt}` });
    }
    
    // Finalize the archive
    await archive.finalize();
    
  } catch (error) {
    console.error('Error creating zip file:', error);
    // Only send an error response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create zip file' });
    }
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

// Serve the React frontend
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/client/index.html'));
});

// Start the server with async initialization
async function startServer() {
  try {
    // Initialize the database and run migrations
    await db.init();
    
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Use the following commands:');
      console.log(`- To import memes: npm run import <path-to-image-folder>`);
      console.log(`- Web UI available at: http://localhost:${PORT}`);
    });
    
    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        console.log('Server closed. Closing database connection...');
        await db.close();
        console.log('Database connection closed. Exiting.');
        process.exit(0);
      });
      
      // If server doesn't close in 5 seconds, force exit
      setTimeout(() => {
        console.log('Server took too long to close. Forcing exit.');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Start the server
startServer();