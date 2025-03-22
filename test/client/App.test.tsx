import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../src/client/src/App';
import { useMemes } from '../../src/client/src/hooks/useMemes';
import { useSelection } from '../../src/client/src/hooks/useSelection';

// Mock the hooks
jest.mock('../../src/client/src/hooks/useMemes');
jest.mock('../../src/client/src/hooks/useSelection');
// Mock the child components to simplify testing
jest.mock('../../src/client/src/components/SearchBar', () => ({
  SearchBar: ({ onSearch }) => (
    <div data-testid="mock-search-bar">
      <input 
        data-testid="search-input" 
        onChange={() => {}}
        onKeyUp={jest.fn()}
      />
      <button data-testid="search-button" onClick={() => onSearch('test query')}>Search</button>
    </div>
  )
}));
jest.mock('../../src/client/src/components/MemeGrid', () => ({
  MemeGrid: ({ memes, loading, error }) => (
    <div data-testid="mock-meme-grid">
      {loading && <span>Loading...</span>}
      {error && <span>Error: {error}</span>}
      <span>Meme count: {memes.length}</span>
    </div>
  )
}));
jest.mock('../../src/client/src/components/SelectionFooter', () => ({
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
  const mockFetchMemes = jest.fn();
  const mockSelectionState = {
    selectedMemes: new Set<number>(),
    toggleMeme: jest.fn(),
    isSelected: jest.fn(),
    clearSelection: jest.fn(),
    selectionCount: 0,
    getSelectedIds: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock for useMemes hook
    (useMemes as jest.Mock).mockReturnValue({
      memes: mockMemes,
      loading: false,
      error: null,
      fetchMemes: mockFetchMemes
    });
    
    // Setup mock for useSelection hook
    (useSelection as jest.Mock).mockReturnValue(mockSelectionState);
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
    render(<App />);
    
    // Check that MemeGrid receives the correct props
    expect(screen.getByText('Meme count: 1')).toBeInTheDocument();
  });

  test('calls fetchMemes when search is performed', () => {
    render(<App />);
    
    // Simulate search
    fireEvent.click(screen.getByTestId('search-button'));
    
    // Check that fetchMemes was called with the search query
    expect(mockFetchMemes).toHaveBeenCalledWith('test query');
  });

  test('handles loading state', () => {
    // Mock loading state
    (useMemes as jest.Mock).mockReturnValue({
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
    (useMemes as jest.Mock).mockReturnValue({
      memes: [],
      loading: false,
      error: 'API error',
      fetchMemes: mockFetchMemes
    });
    
    render(<App />);
    
    expect(screen.getByText('Error: API error')).toBeInTheDocument();
  });
});