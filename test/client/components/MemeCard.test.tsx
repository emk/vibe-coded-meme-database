import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemeCard } from '../../../src/client/src/components/MemeCard';
import { SelectionContext } from '../../../src/client/src/hooks/useSelection';

// Mock the meme data
const mockMeme = {
  id: 1,
  path: '/path/to/meme.jpg',
  filename: 'test-meme',
  category: 'funny',
  hash: 'abc123',
  text: 'Test meme text',
  description: 'A test meme description',
  keywords: ['test', 'meme', 'jest'],
  created_at: new Date()
};

// Mock selection context
const mockSelectionContext = {
  selectedMemes: new Set<number>(),
  toggleMeme: jest.fn(),
  isSelected: jest.fn().mockReturnValue(false),
  clearSelection: jest.fn(),
  selectionCount: 0,
  getSelectedIds: jest.fn().mockReturnValue([])
};

describe('MemeCard Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders meme card with image and keywords', () => {
    render(
      <SelectionContext.Provider value={mockSelectionContext}>
        <MemeCard meme={mockMeme} />
      </SelectionContext.Provider>
    );
    
    // Check that image is rendered with correct src and alt
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', `/images/funny/test-meme.jpg`);
    expect(image).toHaveAttribute('alt', 'Test meme text - A test meme description');
    
    // Check that keywords are displayed
    mockMeme.keywords.forEach(keyword => {
      expect(screen.getByText(keyword)).toBeInTheDocument();
    });
  });

  test('toggles meme selection when checkbox is clicked', () => {
    const { container } = render(
      <SelectionContext.Provider value={mockSelectionContext}>
        <MemeCard meme={mockMeme} />
      </SelectionContext.Provider>
    );
    
    // Find and click the checkbox using its unique class
    const checkbox = container.querySelector('.meme-selection-checkbox');
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);
    
    // Verify that toggleMeme was called with the correct ID
    expect(mockSelectionContext.toggleMeme).toHaveBeenCalledWith(mockMeme.id);
  });

  test('shows selected state', () => {
    // Mock the selection context to show this meme as selected
    const selectedContext = {
      ...mockSelectionContext,
      isSelected: jest.fn().mockReturnValue(true)
    };
    
    render(
      <SelectionContext.Provider value={selectedContext}>
        <MemeCard meme={mockMeme} />
      </SelectionContext.Provider>
    );
    
    // Check that the checkbox shows as selected
    const checkbox = screen.getByText('✓');
    expect(checkbox).toBeInTheDocument();
  });
});