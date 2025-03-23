import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemeGrid } from '../../../src/client/src/components/MemeGrid';
import { SelectionContext } from '../../../src/client/src/hooks/useSelection';

// Mock selection context for rendering
const mockSelectionContext = {
  selectedMemes: new Set<number>(),
  toggleMeme: jest.fn(),
  isSelected: jest.fn(),
  clearSelection: jest.fn(),
  selectionCount: 0,
  getSelectedIds: jest.fn().mockReturnValue([])
};

// Sample meme data
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
  },
  {
    id: 2,
    path: '/path/to/meme2.jpg',
    filename: 'meme2',
    category: 'cats',
    hash: 'hash2',
    text: 'Meme 2 text',
    description: 'Meme 2 description',
    keywords: ['cats', 'cute'],
    created_at: new Date()
  }
];

// Mock MemeCard to isolate MemeGrid tests
jest.mock('../../../src/client/src/components/MemeCard', () => ({
  MemeCard: ({ meme }) => <div data-testid={`meme-card-${meme.id}`}>{meme.filename}</div>
}));

describe('MemeGrid Component', () => {
  const renderWithContext = (ui: React.ReactElement) => {
    return render(
      <SelectionContext.Provider value={mockSelectionContext}>
        {ui}
      </SelectionContext.Provider>
    );
  };

  test('shows loading state', () => {
    renderWithContext(<MemeGrid memes={[]} loading={true} error={null} />);
    expect(screen.getByText('Loading memes...')).toBeInTheDocument();
  });

  // Remove error test since error handling moved to SearchBar

  test('shows empty state message', () => {
    renderWithContext(<MemeGrid memes={[]} loading={false} error={null} />);
    expect(screen.getByText('No memes found. Try a different search.')).toBeInTheDocument();
  });

  test('renders meme cards when memes are available', () => {
    renderWithContext(<MemeGrid memes={mockMemes} loading={false} error={null} />);
    expect(screen.getByTestId('meme-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('meme-card-2')).toBeInTheDocument();
    expect(screen.getByText('meme1')).toBeInTheDocument();
    expect(screen.getByText('meme2')).toBeInTheDocument();
  });

  test('shows limit notice when 200 memes are returned', () => {
    // Create array of 200 memes
    const manyMemes = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      path: `/path/to/meme${i+1}.jpg`,
      filename: `meme${i+1}`,
      category: 'misc',
      hash: `hash${i+1}`,
      text: `Meme ${i+1} text`,
      description: `Meme ${i+1} description`,
      keywords: ['test'],
      created_at: new Date()
    }));

    renderWithContext(<MemeGrid memes={manyMemes} loading={false} error={null} />);
    expect(
      screen.getByText('Showing the 200 most recent memes. Use search to narrow results.')
    ).toBeInTheDocument();
  });
});