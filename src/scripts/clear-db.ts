import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from '../services/database';

// Load environment variables
dotenv.config();

async function clearDatabase(): Promise<void> {
  // Database path from environment or default
  const dbPath = process.env.DB_PATH || './memedb/memes.sqlite3';
  const memeDir = process.env.MEME_DIR || './memedb/memes';
  
  console.log(`Clearing database at: ${dbPath}`);
  
  // Check if database exists
  if (fs.existsSync(dbPath)) {
    // Delete the SQLite file
    fs.unlinkSync(dbPath);
    console.log('Database file deleted');
  }
  
  // Create a new empty database with the schema
  const db = new DatabaseService(dbPath);
  console.log('New empty database created');
  
  // Optionally clear the meme directory
  if (fs.existsSync(memeDir)) {
    // This preserves the top directory but removes all contents
    fs.readdirSync(memeDir).forEach(category => {
      const categoryPath = path.join(memeDir, category);
      if (fs.statSync(categoryPath).isDirectory()) {
        fs.readdirSync(categoryPath).forEach(file => {
          fs.unlinkSync(path.join(categoryPath, file));
        });
        fs.rmdirSync(categoryPath);
      } else {
        fs.unlinkSync(categoryPath);
      }
    });
    console.log('Meme directory contents cleared');
  }
  
  // Close the database connection
  db.close();
  
  console.log('Database reset complete');
}

clearDatabase().catch(error => {
  console.error('Error clearing database:', error);
  process.exit(1);
});