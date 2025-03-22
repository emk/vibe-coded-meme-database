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

  test('renders search input and button', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    // Check that input and button exist
    const input = screen.getByPlaceholderText('Search memes...');
    const button = screen.getByRole('button', { name: /search/i });
    
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
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
    const button = screen.getByRole('button', { name: /search/i });
    
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
});