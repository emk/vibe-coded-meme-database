import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { SelectionFooter } from '../../../src/client/src/components/SelectionFooter';
import { SelectionContext } from '../../../src/client/src/hooks/useSelection';

// Mock the fetch function to avoid actual API calls
global.fetch = vi.fn();

describe('SelectionFooter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders nothing when no memes are selected', () => {
    const mockContext = {
      selectedMemes: new Set<number>(),
      toggleMeme: vi.fn(),
      isSelected: vi.fn(),
      clearSelection: vi.fn(),
      selectionCount: 0,
      getSelectedIds: vi.fn().mockReturnValue([])
    };

    const { container } = render(
      <div>
        <SelectionContext.Provider value={mockContext}>
          <SelectionFooter />
        </SelectionContext.Provider>
      </div>
    );

    // The component should return null when selectionCount is 0
    expect(container.querySelector('[class*="selectionFooter"]')).not.toBeInTheDocument();
  });

  test('renders footer with correct buttons when memes are selected', () => {
    const mockContext = {
      selectedMemes: new Set<number>([1, 2]),
      toggleMeme: vi.fn(),
      isSelected: vi.fn(),
      clearSelection: vi.fn(),
      selectionCount: 2,
      getSelectedIds: vi.fn().mockReturnValue([1, 2])
    };

    render(
      <div>
        <SelectionContext.Provider value={mockContext}>
          <SelectionFooter />
        </SelectionContext.Provider>
      </div>
    );

    // Check for the buttons
    expect(screen.getByText('Unselect All')).toBeInTheDocument();
    expect(screen.getByText('Download 2 Memes')).toBeInTheDocument();
  });

  test('shows singular text when only one meme is selected', () => {
    const mockContext = {
      selectedMemes: new Set<number>([1]),
      toggleMeme: vi.fn(),
      isSelected: vi.fn(),
      clearSelection: vi.fn(),
      selectionCount: 1,
      getSelectedIds: vi.fn().mockReturnValue([1])
    };

    render(
      <div>
        <SelectionContext.Provider value={mockContext}>
          <SelectionFooter />
        </SelectionContext.Provider>
      </div>
    );

    // Check for singular text
    expect(screen.getByText('Download 1 Meme')).toBeInTheDocument();
  });

  test('calls clearSelection when "Unselect All" button is clicked', () => {
    const mockClearSelection = vi.fn();
    const mockContext = {
      selectedMemes: new Set<number>([1, 2]),
      toggleMeme: vi.fn(),
      isSelected: vi.fn(),
      clearSelection: mockClearSelection,
      selectionCount: 2,
      getSelectedIds: vi.fn().mockReturnValue([1, 2])
    };

    const { container } = render(
      <div id="test-selection-footer">
        <SelectionContext.Provider value={mockContext}>
          <SelectionFooter />
        </SelectionContext.Provider>
      </div>
    );

    // Find the button using its parent container and text content
    const testContainer = container.querySelector('#test-selection-footer');
    const unselectAllButton = Array.from(testContainer.querySelectorAll('button'))
      .find(button => button.textContent === 'Unselect All');
    
    // Click the Unselect All button
    fireEvent.click(unselectAllButton);

    // Check that clearSelection was called
    expect(mockClearSelection).toHaveBeenCalled();
  });

  // Note: We're skipping the download test because it involves complex browser APIs
  // that are challenging to mock correctly. This would be a good candidate for
  // integration testing instead.
});