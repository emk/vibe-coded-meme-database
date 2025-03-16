import dotenv from 'dotenv';
import { AIService, DEFAULT_AI_MODEL } from '../services/ai';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let imagePath = '';
  let model = DEFAULT_AI_MODEL;
  let numCtx = 4096;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--model' && i + 1 < args.length) {
      model = args[i + 1];
      i++;
    } else if (args[i] === '--context' && i + 1 < args.length) {
      numCtx = parseInt(args[i + 1], 10);
      i++;
    } else if (!args[i].startsWith('--') && !imagePath) {
      imagePath = args[i];
    }
  }
  
  return { imagePath, model, numCtx };
}

async function analyze() {
  const { imagePath, model, numCtx } = parseArgs();
  
  if (!imagePath) {
    console.error('Error: Image path is required');
    console.log('Usage: npm run analyze -- <image_path> [--model model_name] [--context context_size]');
    process.exit(1);
  }
  
  // Check if the file exists
  const resolvedPath = path.resolve(imagePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Image file not found at ${resolvedPath}`);
    process.exit(1);
  }
  
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const ai = new AIService(ollamaHost, model);
  
  console.log(`Analyzing image with model: ${model}`);
  console.log(`Context size: ${numCtx}`);
  console.log(`Image path: ${resolvedPath}`);
  
  try {
    const result = await ai.analyzeMeme(resolvedPath, numCtx);
    console.log('Analysis result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error analyzing image:', error);
    process.exit(1);
  }
}

analyze().catch(console.error);