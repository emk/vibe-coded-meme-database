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
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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
  }
});

app.get<MemeIdParams>('/api/memes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const meme = await db.getMemeById(id);
    
    if (!meme) {
      res.status(404).json({ error: 'Meme not found' });
      return;
    }
    
    res.json(meme);
  } catch (error) {
    console.error('Error fetching meme by ID:', error);
    res.status(500).json({ error: 'Failed to fetch meme' });
  }
});

// Serve the meme image files
app.get<CategoryFilenameParams>('/images/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  const memeDir = process.env.MEME_DIR || './memedb/memes';
  const imagePath = path.join(memeDir, category, filename);
  
  if (!fs.existsSync(imagePath)) {
    res.status(404).send('Image not found');
    return;
  }
  
  res.sendFile(path.resolve(imagePath));
});

// Serve the main frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Create the public directory if it doesn't exist
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create a basic HTML file if it doesn't exist
const indexPath = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meme Database</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <div class="container">
    <h1>Meme Database</h1>
    
    <div class="search-container">
      <input type="text" id="search-input" placeholder="Search memes...">
      <button id="search-btn">Search</button>
    </div>
    
    <div id="meme-container" class="meme-grid"></div>
  </div>
  
  <script src="/js/main.js"></script>
</body>
</html>
  `;
  
  fs.writeFileSync(indexPath, html);
}

// Create CSS file if it doesn't exist
const cssDir = path.join(publicDir, 'css');
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
}

const cssPath = path.join(cssDir, 'styles.css');
if (!fs.existsSync(cssPath)) {
  const css = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  background-color: #f4f4f4;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  margin-bottom: 20px;
}

#search-input {
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
}

#search-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.meme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.meme-card {
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.meme-card img {
  width: 100%;
  height: auto;
}

.meme-info {
  padding: 10px;
}

.meme-text {
  font-size: 14px;
  margin-bottom: 5px;
  font-weight: bold;
  overflow: hidden;
}

.meme-description {
  font-size: 12px;
  margin-bottom: 5px;
  height: 40px;
  overflow: hidden;
  color: #555;
}

.meme-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.keyword {
  background-color: #eee;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 12px;
}
  `;
  
  fs.writeFileSync(cssPath, css);
}

// Create JS file if it doesn't exist
const jsDir = path.join(publicDir, 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

const jsPath = path.join(jsDir, 'main.js');
if (!fs.existsSync(jsPath)) {
  const js = `
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const memeContainer = document.getElementById('meme-container');
  
  // Load memes when page loads
  fetchMemes();
  
  // Add search functionality
  searchBtn.addEventListener('click', () => {
    fetchMemes(searchInput.value);
  });
  
  // Also search when Enter key is pressed
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      fetchMemes(searchInput.value);
    }
  });
  
  async function fetchMemes(query = '') {
    try {
      let url = '/api/memes';
      if (query) {
        url += \`?q=\${encodeURIComponent(query)}\`;
      }
      
      const response = await fetch(url);
      const memes = await response.json();
      
      renderMemes(memes);
    } catch (error) {
      console.error('Error fetching memes:', error);
      memeContainer.innerHTML = '';
      
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'Error loading memes. Please try again.';
      memeContainer.appendChild(errorMessage);
    }
  }
  
  function renderMemes(memes) {
    if (memes.length === 0) {
      memeContainer.innerHTML = '';
      const noResults = document.createElement('p');
      noResults.textContent = 'No memes found. Try a different search.';
      memeContainer.appendChild(noResults);
      return;
    }
    
    memeContainer.innerHTML = '';
    
    if (memes.length === 200) {
      const limitNotice = document.createElement('div');
      limitNotice.className = 'limit-notice';
      limitNotice.textContent = 'Showing the 200 most recent memes. Use search to narrow results.';
      memeContainer.appendChild(limitNotice);
    }
    
    memes.forEach(meme => {
      const card = document.createElement('div');
      card.className = 'meme-card';
      
      // Extract file extension from path
      const fileExt = meme.path.substring(meme.path.lastIndexOf('.'));
      const imagePath = \`/images/\${meme.category}/\${meme.filename}\${fileExt}\`;
      
      // Create image element with proper alt/title text
      const img = document.createElement('img');
      img.src = imagePath;
      
      const altText = meme.text ? 
        (meme.description ? \`\${meme.text} - \${meme.description}\` : meme.text) : 
        (meme.description || 'Meme');
      
      img.alt = altText;
      img.title = altText;
      
      // Create meme info container
      const memeInfo = document.createElement('div');
      memeInfo.className = 'meme-info';
      
      // Create keywords container
      const keywordsDiv = document.createElement('div');
      keywordsDiv.className = 'meme-keywords';
      
      // Add keywords as spans
      meme.keywords.forEach(keyword => {
        const keywordSpan = document.createElement('span');
        keywordSpan.className = 'keyword';
        keywordSpan.textContent = keyword;
        keywordsDiv.appendChild(keywordSpan);
      });
      
      // Assemble the card
      memeInfo.appendChild(keywordsDiv);
      card.appendChild(img);
      card.appendChild(memeInfo);
      
      memeContainer.appendChild(card);
    });
  }
});
  `;
  
  fs.writeFileSync(jsPath, js);
}

// Start the server with async initialization
async function startServer() {
  try {
    // Initialize the database and run migrations
    await db.init();
    
    app.listen(PORT, () => {
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