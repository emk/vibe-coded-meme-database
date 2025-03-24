import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { SearchBar } from '../../../src/client/src/components/SearchBar';

describe('SearchBar Component', () => {
  // Mock search handler function
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  test('renders search input and buttons', () => {
    const { container } = render(<SearchBar onSearch={mockOnSearch} />);
    
    // Check that input and buttons exist
    const input = container.querySelector('input[placeholder="Search memes..."]');
    const searchButton = container.querySelector('button:not([aria-label])');
    const helpButton = container.querySelector('button[aria-label="Search syntax help"]');
    
    expect(input).not.toBeNull();
    expect(searchButton).not.toBeNull();
    expect(helpButton).not.toBeNull();
    expect(searchButton).toHaveTextContent('Search');
  });

  test('updates input value when typing', () => {
    const { container } = render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = container.querySelector('input[placeholder="Search memes..."]') as HTMLInputElement;
    
    // Simulate typing in the input
    fireEvent.change(input, { target: { value: 'test query' } });
    
    // Check that the input value was updated
    expect(input.value).toBe('test query');
  });

  test('calls onSearch when button is clicked', () => {
    const { container } = render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = container.querySelector('input[placeholder="Search memes..."]') as HTMLInputElement;
    const button = container.querySelector('button.searchButton') || container.querySelector('button:not([aria-label])');
    
    // Type something and click search
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.click(button);
    
    // Check that onSearch was called with the correct query
    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  test('calls onSearch when Enter key is pressed', () => {
    const { container } = render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = container.querySelector('input[placeholder="Search memes..."]');
    
    // Type something and press Enter
    fireEvent.change(input, { target: { value: 'keyboard query' } });
    fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' });
    
    // Check that onSearch was called with the correct query
    expect(mockOnSearch).toHaveBeenCalledWith('keyboard query');
  });

  test('does not call onSearch when other keys are pressed', () => {
    const { container } = render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = container.querySelector('input[placeholder="Search memes..."]');
    
    // Type something and press a key other than Enter
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.keyUp(input, { key: 'a', code: 'KeyA' });
    
    // Check that onSearch was not called
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  test('displays error message when provided', () => {
    const { container } = render(<SearchBar onSearch={mockOnSearch} error="Test error message" />);
    
    // Check that the error message is displayed
    const errorElement = container.querySelector('div[class*="errorMessage"]');
    expect(errorElement).not.toBeNull();
    expect(errorElement.textContent).toBe('Test error message');
  });

  // Test that the help button shows/hides help
  test('toggles help panel when help button is clicked', () => {
    const { container } = render(<SearchBar onSearch={mockOnSearch} />);
    
    // Initially help panel should not be visible
    const initialHelpPanel = container.querySelector('h4');
    expect(initialHelpPanel).toBeNull();
    
    // Click help button
    const helpButton = container.querySelector('button[aria-label="Search syntax help"]');
    fireEvent.click(helpButton);
    
    // Now help panel should be visible
    const helpPanelAfterClick = container.querySelector('h4');
    expect(helpPanelAfterClick).not.toBeNull();
    expect(helpPanelAfterClick.textContent).toBe('Search Syntax');
    
    // Click help button again to hide panel
    fireEvent.click(helpButton);
    
    // Help panel should be hidden again
    const helpPanelAfterSecondClick = container.querySelector('h4');
    expect(helpPanelAfterSecondClick).toBeNull();
  });
});