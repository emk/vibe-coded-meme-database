import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import App from '../../src/client/src/App';
import { useMemes } from '../../src/client/src/hooks/useMemes';
import { useSelection } from '../../src/client/src/hooks/useSelection';

// Mock the hooks
vi.mock('../../src/client/src/hooks/useMemes');
vi.mock('../../src/client/src/hooks/useSelection');
// Mock the child components to simplify testing
vi.mock('../../src/client/src/components/SearchBar', () => ({
  SearchBar: ({ onSearch, error }) => (
    <div data-testid="mock-search-bar">
      <input 
        data-testid="search-input" 
        onChange={() => {}}
        onKeyUp={vi.fn()}
      />
      <button data-testid="search-button" onClick={() => onSearch('test query')}>Search</button>
      {error && <span>Error: {error}</span>}
    </div>
  )
}));
vi.mock('../../src/client/src/components/MemeGrid', () => ({
  MemeGrid: ({ memes, loading }) => (
    <div data-testid="mock-meme-grid">
      {loading && <span>Loading...</span>}
      <span>Meme count: {memes.length}</span>
    </div>
  )
}));
vi.mock('../../src/client/src/components/SelectionFooter', () => ({
  SelectionFooter: () => <div data-testid="mock-selection-footer">Selection Footer</div>
}));

describe('App Component', () => {
  // Setup mock data
  const mockMemes = [
    { 
      id: 1, 
      path: '/path/to/meme.jpg', 
      filename: 'test-meme',
      category: 'funny',
      hash: 'abc123',
      text: 'Test meme text',
      description: 'A test meme description',
      keywords: ['test', 'meme'],
      created_at: new Date()
    }
  ];
  
  // Mock hook implementations
  const mockFetchMemes = vi.fn();
  const mockSelectionState = {
    selectedMemes: new Set<number>(),
    toggleMeme: vi.fn(),
    isSelected: vi.fn(),
    clearSelection: vi.fn(),
    selectionCount: 0,
    getSelectedIds: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock for useMemes hook
    (useMemes as any).mockReturnValue({
      memes: mockMemes,
      loading: false,
      error: null,
      fetchMemes: mockFetchMemes
    });
    
    // Setup mock for useSelection hook
    (useSelection as any).mockReturnValue(mockSelectionState);
  });

  test('renders the App with all components', () => {
    render(<App />);
    
    // Check that the title, and all components are rendered
    expect(screen.getByText('Meme Database')).toBeInTheDocument();
    expect(screen.getByTestId('mock-search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-meme-grid')).toBeInTheDocument();
    expect(screen.getByTestId('mock-selection-footer')).toBeInTheDocument();
  });

  test('passes the correct props to child components', () => {
    const { container } = render(<App />);
    
    // Check that MemeGrid receives the correct props
    const memeCountElement = container.querySelector('[data-testid="mock-meme-grid"] span');
    expect(memeCountElement).toHaveTextContent('Meme count: 1');
  });

  test('calls fetchMemes when search is performed', () => {
    const { container } = render(<App />);
    
    // Simulate search - get the first search button
    const searchButton = container.querySelector('[data-testid="search-button"]');
    fireEvent.click(searchButton);
    
    // Check that fetchMemes was called with the search query
    expect(mockFetchMemes).toHaveBeenCalledWith('test query');
  });

  test('handles loading state', () => {
    // Mock loading state
    (useMemes as any).mockReturnValue({
      memes: [],
      loading: true,
      error: null,
      fetchMemes: mockFetchMemes
    });
    
    render(<App />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('handles error state', () => {
    // Mock error state
    (useMemes as any).mockReturnValue({
      memes: [],
      loading: false,
      error: 'API error',
      fetchMemes: mockFetchMemes
    });
    
    render(<App />);
    
    expect(screen.getByText('Error: API error')).toBeInTheDocument();
  });
});