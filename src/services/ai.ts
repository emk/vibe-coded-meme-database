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

  public async analyzeMeme(imagePath: string, numCtx: number = 4096): Promise<MemeAnalysis> {
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
          num_ctx: numCtx
        }
      });
      
      // Log the AI response for debugging
      console.log('AI Response content:', response.message.content);
      
      // Parse the response
      const result = this.parseResponse(response.message.content);
      console.log('Parsed result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error: unknown) {
      console.error('Error analyzing meme with AI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to analyze meme: ${errorMessage}`);
    }
  }

  private parseResponse(content: string): MemeAnalysis {
    try {
      // Try to parse as JSON directly
      const result = JSON.parse(content) as MemeAnalysis;
      
      // Validate that the response contains the required fields
      if (!result) {
        throw new Error('Empty response from AI service');
      }
      
      // Check for required fields
      if (!result.description) {
        throw new Error('AI response missing required field: description');
      }
      
      if (!result.category) {
        throw new Error('AI response missing required field: category');
      }
      
      if (!Array.isArray(result.keywords) || result.keywords.length === 0) {
        throw new Error('AI response missing required field: keywords');
      }
      
      if (!result.generated_filename) {
        throw new Error('AI response missing required field: generated_filename');
      }
      
      // Ensure result has all fields (text can be empty if truly no text in image)
      return {
        text: result.text || '',
        description: result.description,
        category: result.category,
        keywords: result.keywords,
        generated_filename: result.generated_filename
      };
    } catch (error: unknown) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw response:', content);
      
      // Throw the error instead of returning default values
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse AI response: ${errorMessage}`);
    }
  }
}