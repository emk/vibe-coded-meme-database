import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from '../services/database';
import { AIService, DEFAULT_AI_MODEL } from '../services/ai';
import { 
  generateFileHash, 
  sanitizeFilename, 
  ensureDirectoryExists 
} from '../utils/fileUtils';

// Load environment variables
dotenv.config();

// Supported image extensions
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

async function importMemes(sourcePath: string): Promise<void> {
  // Validate arguments
  if (!sourcePath) {
    console.error('Error: Please provide a source directory or file');
    console.log('Usage: npm run import <source-directory-or-file>');
    process.exit(1);
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source path ${sourcePath} does not exist`);
    process.exit(1);
  }

  // Initialize services
  const dbPath = process.env.DB_PATH || './memedb/memes.sqlite3';
  const memeDir = process.env.MEME_DIR || './memedb/memes';
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const aiModel = process.env.AI_MODEL || DEFAULT_AI_MODEL;

  ensureDirectoryExists(memeDir);
  
  const db = new DatabaseService(dbPath);
  const ai = new AIService(ollamaHost, aiModel);

  // Check if the source is a file or directory
  const stats = fs.statSync(sourcePath);
  let imageFiles: Array<{name: string, path: string}> = [];

  if (stats.isDirectory()) {
    // Read all files in the source directory
    const files = fs.readdirSync(sourcePath);
    
    // Filter and map to get full paths
    imageFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext);
      })
      .map(file => ({
        name: file,
        path: path.join(sourcePath, file)
      }));
      
    console.log(`Found ${imageFiles.length} images in directory ${sourcePath}`);
  } else if (stats.isFile()) {
    // Check if it's a supported image file
    const ext = path.extname(sourcePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      console.error(`Error: File ${sourcePath} is not a supported image type`);
      console.log(`Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      process.exit(1);
    }
    
    // Add the single file
    const fileName = path.basename(sourcePath);
    imageFiles = [{ name: fileName, path: sourcePath }];
    console.log(`Processing single image file: ${sourcePath}`);
  } else {
    console.error(`Error: ${sourcePath} is neither a file nor a directory`);
    process.exit(1);
  }

  // Process each image
  let imported = 0;
  let skipped = 0;

  for (const imageFile of imageFiles) {
    const fileName = imageFile.name;
    const sourcePath = imageFile.path;
    const ext = path.extname(fileName).toLowerCase();
    
    try {
      // Generate a hash for the file to avoid duplicates
      const hash = generateFileHash(sourcePath);
      
      // Check if we already have this meme
      const existingMeme = db.getMemeByHash(hash);
      if (existingMeme) {
        console.log(`Skipping ${fileName} (already exists)`);
        skipped++;
        continue;
      }

      // Analyze the image with the AI
      console.log(`Analyzing ${fileName}...`);
      const analysis = await ai.analyzeMeme(sourcePath);

      // Sanitize category
      const category = sanitizeFilename(analysis.category || 'unknown');
      
      // Use the AI-generated filename (sanitized) or fallback to the original filename
      let baseFilename = sanitizeFilename(analysis.generated_filename || path.parse(fileName).name);
      
      // Create the category directory if it doesn't exist
      const categoryDir = path.join(memeDir, category);
      ensureDirectoryExists(categoryDir);
      
      // Check for filename collisions and make unique if needed
      let uniqueFilename = baseFilename;
      let counter = 1;
      let destPath = path.join(categoryDir, `${uniqueFilename}${ext}`);
      
      // If file already exists, append a number to make it unique
      while (fs.existsSync(destPath)) {
        uniqueFilename = `${baseFilename}_${counter}`;
        destPath = path.join(categoryDir, `${uniqueFilename}${ext}`);
        counter++;
      }
      
      const destFilename = `${uniqueFilename}${ext}`;
      
      // Copy the file
      fs.copyFileSync(sourcePath, destPath);
      
      // Add to database
      db.addMeme({
        path: destPath,
        filename: uniqueFilename,
        category,
        hash,
        text: analysis.text,
        description: analysis.description,
        keywords: analysis.keywords
      });
      
      console.log(`Imported: ${fileName} -> ${category}/${destFilename}`);
      imported++;
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error);
    }
  }

  console.log('\nImport summary:');
  console.log(`Total files: ${imageFiles.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (duplicates): ${skipped}`);
  console.log(`Failed: ${imageFiles.length - imported - skipped}`);

  // Close the database connection
  db.close();
}

// Get the source directory from command line arguments
const sourceDir = process.argv[2];
importMemes(sourceDir)
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });