import fs from 'fs';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { AIService } from '../../src/services/ai';

// Create a temp file for testing
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = os.tmpdir();
const mockImagePath = path.join(tempDir, 'test-mock-image.jpg');

// Create mock image file
beforeEach(() => {
  fs.writeFileSync(mockImagePath, 'mock image content');
});

afterEach(() => {
  if (fs.existsSync(mockImagePath)) {
    fs.unlinkSync(mockImagePath);
  }
});

// Mock the Ollama module
vi.mock('ollama', () => {
  const mockChat = vi.fn().mockResolvedValue({
    message: {
      content: JSON.stringify({
        full_ocr_text: 'This is test OCR text',
        short_description: 'A mock meme description',
        category: 'mock_category',
        keywords: ['mock', 'test', 'vitest'],
        descriptive_image_filename: 'mock_meme_test'
      })
    }
  });
  
  return {
    Ollama: class MockOllama {
      constructor() {}
      chat = mockChat;
    }
  };
});

describe('AIService', () => {
  let aiService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    aiService = new AIService('http://mock-ollama-host:11434', 'mock-model');
  });
  
  test('should analyze a meme image', async () => {
    const result = await aiService.analyzeMeme(mockImagePath);

    // Verify Ollama chat method was called with correct parameters
    const { Ollama } = await import('ollama');
    const ollama = new Ollama();
    
    expect(ollama.chat).toHaveBeenCalled();
    expect(result).toEqual({
      full_ocr_text: 'This is test OCR text',
      short_description: 'A mock meme description',
      category: 'mock_category',
      keywords: ['mock', 'test', 'vitest'],
      descriptive_image_filename: 'mock_meme_test'
    });
  });

  test('should handle error when Ollama API throws an exception', async () => {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama();
    ollama.chat.mockRejectedValueOnce(new Error('API connection error'));

    await expect(aiService.analyzeMeme(mockImagePath))
      .rejects
      .toThrow('Failed to analyze meme: API connection error');
  });

  test('should handle malformed JSON response from Ollama', async () => {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama();
    ollama.chat.mockResolvedValueOnce({
      message: {
        content: '{invalid json'
      }
    });

    await expect(aiService.analyzeMeme(mockImagePath))
      .rejects
      .toThrow('Failed to parse AI response');
  });

  test('should handle missing required fields in Ollama response', async () => {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama();
    ollama.chat.mockResolvedValueOnce({
      message: {
        content: JSON.stringify({
          full_ocr_text: 'Text only',
          // Missing short_description, category, etc.
        })
      }
    });

    await expect(aiService.analyzeMeme(mockImagePath))
      .rejects
      .toThrow('AI response missing required field');
  });

  test('should handle empty response from Ollama', async () => {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama();
    ollama.chat.mockResolvedValueOnce({
      message: {
        content: 'null'
      }
    });

    await expect(aiService.analyzeMeme(mockImagePath))
      .rejects
      .toThrow('Empty response from AI service');
  });

  test('should handle empty keywords array in Ollama response', async () => {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama();
    ollama.chat.mockResolvedValueOnce({
      message: {
        content: JSON.stringify({
          full_ocr_text: 'Text with no keywords',
          short_description: 'A description',
          category: 'category',
          keywords: [], // Empty array
          descriptive_image_filename: 'filename'
        })
      }
    });

    await expect(aiService.analyzeMeme(mockImagePath))
      .rejects
      .toThrow('AI response missing required field: keywords');
  });
});