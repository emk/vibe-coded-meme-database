import dotenv from 'dotenv';
import { AIService, DEFAULT_AI_MODEL } from './services/ai';
import path from 'path';

// Load environment variables
dotenv.config();

async function testAnalyze() {
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
  // Use the default model (which is gemma3:27b)
  const aiModel = DEFAULT_AI_MODEL;
  
  const ai = new AIService(ollamaHost, aiModel);
  
  // Path to the test image
  const imagePath = path.resolve('./test-memes/Debate-Night-Horse-stalling-meme-attb-MyPetsName-dot-com.jpg');
  
  console.log(`Analyzing image with model: ${aiModel}`);
  console.log(`Image path: ${imagePath}`);
  
  try {
    const result = await ai.analyzeMeme(imagePath);
    console.log('Analysis result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error analyzing image:', error);
  }
}

testAnalyze().catch(console.error);