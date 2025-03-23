import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchBar } from '../../../src/client/src/components/SearchBar';

describe('SearchBar Component', () => {
  // Mock search handler function
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders search input and buttons', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    // Check that input and buttons exist
    const input = screen.getByPlaceholderText('Search memes...');
    const searchButton = screen.getByText('Search');
    const helpButton = screen.getByRole('button', { name: /search syntax help/i });
    
    expect(input).toBeInTheDocument();
    expect(searchButton).toBeInTheDocument();
    expect(helpButton).toBeInTheDocument();
  });

  test('updates input value when typing', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Search memes...') as HTMLInputElement;
    
    // Simulate typing in the input
    fireEvent.change(input, { target: { value: 'test query' } });
    
    // Check that the input value was updated
    expect(input.value).toBe('test query');
  });

  test('calls onSearch when button is clicked', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Search memes...');
    const button = screen.getByText('Search');
    
    // Type something and click search
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.click(button);
    
    // Check that onSearch was called with the correct query
    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  test('calls onSearch when Enter key is pressed', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Search memes...');
    
    // Type something and press Enter
    fireEvent.change(input, { target: { value: 'keyboard query' } });
    fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' });
    
    // Check that onSearch was called with the correct query
    expect(mockOnSearch).toHaveBeenCalledWith('keyboard query');
  });

  test('does not call onSearch when other keys are pressed', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Search memes...');
    
    // Type something and press a key other than Enter
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
    
    // Check that onSearch was not called
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  test('displays error message when provided', () => {
    render(<SearchBar onSearch={mockOnSearch} error="Test error message" />);
    
    // Check that the error message is displayed
    const errorElement = screen.getByText('Test error message');
    expect(errorElement).toBeInTheDocument();
  });

  // Test that the help button shows/hides help
  test('toggles help panel when help button is clicked', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    // Initially help panel should not be visible
    expect(screen.queryByRole('heading', { name: 'Search Syntax' })).not.toBeInTheDocument();
    
    // Click help button
    const helpButton = screen.getByRole('button', { name: /search syntax help/i });
    fireEvent.click(helpButton);
    
    // Now help panel should be visible
    expect(screen.getByRole('heading', { name: 'Search Syntax' })).toBeInTheDocument();
    
    // Click help button again to hide panel
    fireEvent.click(helpButton);
    
    // Help panel should be hidden again
    expect(screen.queryByRole('heading', { name: 'Search Syntax' })).not.toBeInTheDocument();
  });
});