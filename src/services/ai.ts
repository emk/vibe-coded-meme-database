import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';

// Default AI model to use for all image analysis
export const DEFAULT_AI_MODEL = 'gemma3:27b';

interface MemeAnalysis {
  text: string;
  description: string;
  category: string;
  keywords: string[];
  generated_filename: string;
}

export class AIService {
  private ollama: Ollama;
  private model: string;

  constructor(host: string, model: string = DEFAULT_AI_MODEL) {
    this.ollama = new Ollama({ host });
    this.model = model;
  }

  public async analyzeMeme(imagePath: string): Promise<MemeAnalysis> {
    const imageBase64 = fs.readFileSync(imagePath).toString('base64');

    const prompt = `
    Analyze this image as a meme. I need you to provide the following information:
    
    1. Extract ALL visible text from the image (even small or hard to read text)
    2. Write a brief description of what's shown in the image and what makes it funny or interesting
    3. Categorize the meme (e.g., politics, animals, reaction, movie, etc.)
    4. Provide relevant keywords that describe the content, theme, or emotions
    5. Generate a descriptive, memorable filename that captures the essence of the meme
    
    Respond with a JSON object with the following structure:
    {
      "text": "ALL text visible in the meme - leave empty only if truly no text exists",
      "description": "A brief description of what's happening in the image",
      "category": "one_word_category",
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
      "generated_filename": "descriptive_memorable_filename"
    }
    
    For the category, use a simple descriptive word like "politics", "animals", "reaction", "movie", etc.
    For the generated_filename, use ONLY alphanumeric characters and underscores (no spaces), keep it under 40 characters, and make it descriptive of the meme's content.
    
    IMPORTANT: Always provide a description even if there's no text in the image.
    `;
    
    try {
      // According to Ollama API docs, for the chat endpoint,
      // images should be included in the messages array as base64 strings
      const response = await this.ollama.chat({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
            images: [imageBase64]
          }
        ],
        format: 'json',
        options: {
          num_ctx: 8192
        }
      });
      
      // Log the AI response for debugging
      console.log('AI Response content:', response.message.content);
      
      const result = this.parseResponse(response.message.content);
      console.log('Parsed result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error analyzing meme with AI:', error);
      return {
        text: '',
        description: 'Failed to analyze this image',
        category: 'unknown',
        keywords: ['error', 'unknown'],
        generated_filename: 'unknown_error_image'
      };
    }
  }

  private parseResponse(content: string): MemeAnalysis {
    try {
      // Try to parse as JSON directly
      const result = JSON.parse(content) as MemeAnalysis;
      
      // Ensure result has all required fields
      return {
        text: result.text || '',
        description: result.description || 'No description available',
        category: result.category || 'unknown',
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        generated_filename: result.generated_filename || 'unnamed_meme'
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw response:', content);
      
      // Return default values if parsing fails
      return {
        text: '',
        description: 'Failed to parse AI response',
        category: 'unknown',
        keywords: ['error', 'parsing_failed'],
        generated_filename: 'parsing_error'
      };
    }
  }
}