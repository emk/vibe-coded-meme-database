import fs from 'fs';
import { AIService } from '../../src/services/ai';

// Mock Ollama
jest.mock('ollama', () => {
  return {
    Ollama: jest.fn().mockImplementation(() => {
      return {
        chat: jest.fn().mockResolvedValue({
          message: {
            content: JSON.stringify({
              full_ocr_text: 'This is test OCR text',
              short_description: 'A mock meme description',
              category: 'mock_category',
              keywords: ['mock', 'test', 'jest'],
              descriptive_image_filename: 'mock_meme_test'
            })
          }
        })
      };
    })
  };
});

// Mock fs for reading image files
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    readFileSync: jest.fn().mockReturnValue(Buffer.from('mock-image-data'))
  };
});

describe('AIService', () => {
  let aiService: AIService;
  const mockImagePath = '/path/to/mock/image.jpg';
  
  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService('http://mock-ollama-host:11434', 'mock-model');
  });

  test('should initialize with the provided host and model', () => {
    const { Ollama } = require('ollama');
    expect(Ollama).toHaveBeenCalledWith({ host: 'http://mock-ollama-host:11434' });
  });

  test('should analyze a meme image', async () => {
    const result = await aiService.analyzeMeme(mockImagePath);

    // Verify fs was called to read the image
    expect(fs.readFileSync).toHaveBeenCalledWith(mockImagePath);

    // Verify Ollama chat method was called with correct parameters
    const { Ollama } = require('ollama');
    const ollamaMock = Ollama.mock.results[0].value;
    
    expect(ollamaMock.chat).toHaveBeenCalled();
    expect(ollamaMock.chat.mock.calls[0][0].model).toBe('mock-model');
    expect(ollamaMock.chat.mock.calls[0][0].messages[0].role).toBe('user');

    // Verify the returned analysis has the expected structure
    expect(result).toEqual({
      full_ocr_text: 'This is test OCR text',
      short_description: 'A mock meme description',
      category: 'mock_category',
      keywords: ['mock', 'test', 'jest'],
      descriptive_image_filename: 'mock_meme_test'
    });
  });

  test('should handle error when Ollama API throws an exception', async () => {
    // Mock a failed API call
    const { Ollama } = require('ollama');
    const ollamaMock = Ollama.mock.results[0].value;
    ollamaMock.chat.mockRejectedValueOnce(new Error('API connection error'));

    await expect(aiService.analyzeMeme(mockImagePath))
      .rejects
      .toThrow('Failed to analyze meme: API connection error');
  });

  test('should handle malformed JSON response from Ollama', async () => {
    // Mock a response with invalid JSON
    const { Ollama } = require('ollama');
    const ollamaMock = Ollama.mock.results[0].value;
    ollamaMock.chat.mockResolvedValueOnce({
      message: {
        content: '{invalid json'
      }
    });

    await expect(aiService.analyzeMeme(mockImagePath))
      .rejects
      .toThrow('Failed to parse AI response');
  });

  test('should handle missing required fields in Ollama response', async () => {
    // Mock a response with missing fields
    const { Ollama } = require('ollama');
    const ollamaMock = Ollama.mock.results[0].value;
    ollamaMock.chat.mockResolvedValueOnce({
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
    // Mock an empty response
    const { Ollama } = require('ollama');
    const ollamaMock = Ollama.mock.results[0].value;
    ollamaMock.chat.mockResolvedValueOnce({
      message: {
        content: 'null'
      }
    });

    await expect(aiService.analyzeMeme(mockImagePath))
      .rejects
      .toThrow('Empty response from AI service');
  });

  test('should handle empty keywords array in Ollama response', async () => {
    // Mock a response with empty keywords array
    const { Ollama } = require('ollama');
    const ollamaMock = Ollama.mock.results[0].value;
    ollamaMock.chat.mockResolvedValueOnce({
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