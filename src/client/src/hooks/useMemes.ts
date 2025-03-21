import { useState, useEffect, useCallback } from 'react';
import { Meme } from '../types/Meme';

interface UseMemeResult {
  memes: Meme[];
  loading: boolean;
  error: string | null;
  fetchMemes: (query?: string) => Promise<void>;
}

export function useMemes(): UseMemeResult {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemes = useCallback(async (query: string = '') => {
    try {
      setLoading(true);
      setError(null);

      let url = '/api/memes';
      if (query) {
        url += `?q=${encodeURIComponent(query)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setMemes(data);
    } catch (err) {
      console.error('Error fetching memes:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMemes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load memes on initial render
  useEffect(() => {
    fetchMemes();
  }, [fetchMemes]);

  return { memes, loading, error, fetchMemes };
}
