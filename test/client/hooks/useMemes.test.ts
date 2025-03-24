import { renderHook, act } from '@testing-library/react';
import { useMemes } from '../../../src/client/src/hooks/useMemes';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock fetch to avoid actual API calls
global.fetch = vi.fn();

describe('useMemes Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('should initialize with loading state and fetch memes', async () => {
    // Mock successful API response
    const mockMemes = [
      { 
        id: 1, 
        path: '/path/to/meme1.jpg', 
        filename: 'meme1', 
        category: 'funny',
        hash: 'hash1',
        text: 'Meme 1 text',
        description: 'Meme 1 description',
        keywords: ['funny', 'test'],
        created_at: new Date()
      }
    ];
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMemes
    });
    
    const { result } = renderHook(() => useMemes());
    
    // Initial state should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.memes).toEqual([]);
    expect(result.current.error).toBeNull();
    
    // Wait for fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // After fetch, should have memes and not be loading
    expect(result.current.loading).toBe(false);
    expect(result.current.memes).toEqual(mockMemes);
    expect(result.current.error).toBeNull();
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/memes');
  });

  test('should handle API errors', async () => {
    // Mock API error with error response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed to fetch memes' })
    });
    
    const { result } = renderHook(() => useMemes());
    
    // Wait for fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Should have error state
    expect(result.current.loading).toBe(false);
    expect(result.current.memes).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch memes');
  });

  test('should fetch memes with search query', async () => {
    // Mock successful search response
    const mockSearchResults = [
      { 
        id: 2, 
        path: '/path/to/meme2.jpg', 
        filename: 'meme2', 
        category: 'funny',
        hash: 'hash2',
        text: 'Meme 2 text with search term',
        description: 'Meme 2 description',
        keywords: ['funny', 'search'],
        created_at: new Date()
      }
    ];
    
    // Initial fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });
    
    const { result } = renderHook(() => useMemes());
    
    // Wait for initial fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Mock second fetch for search
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResults
    });
    
    // Call fetchMemes with search query
    await act(async () => {
      await result.current.fetchMemes('search term');
    });
    
    // Should have search results
    expect(result.current.loading).toBe(false);
    expect(result.current.memes).toEqual(mockSearchResults);
    expect(result.current.error).toBeNull();
    
    // Verify fetch was called with correct query
    expect(global.fetch).toHaveBeenCalledWith('/api/memes?q=search%20term');
  });

  test('should handle network errors', async () => {
    // Mock network error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useMemes());
    
    // Wait for fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Should have error state
    expect(result.current.loading).toBe(false);
    expect(result.current.memes).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });
});