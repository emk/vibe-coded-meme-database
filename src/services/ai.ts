import { Ollama } from 'ollama';
import fs from 'fs';

import MemeAnalysis from './meme-analysis';
import MemeAnalysisSchema from './meme-analysis.json';

// Default AI model to use for all image analysis
export const DEFAULT_AI_MODEL = 'gemma3:27b';

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
    Extract the specified information from the image.
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
        format: MemeAnalysisSchema,
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
      if (!result.short_description) {
        throw new Error('AI response missing required field: short_description');
      }
      
      if (!result.category) {
        throw new Error('AI response missing required field: category');
      }
      
      if (!Array.isArray(result.keywords) || result.keywords.length === 0) {
        throw new Error('AI response missing required field: keywords');
      }
      
      if (!result.descriptive_image_filename) {
        throw new Error('AI response missing required field: generated_filename');
      }
      
      // Ensure result has all fields (text can be empty if truly no text in image)
      return {
        full_ocr_text: result.full_ocr_text || '',
        short_description: result.short_description,
        category: result.category,
        keywords: result.keywords,
        descriptive_image_filename: result.descriptive_image_filename
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