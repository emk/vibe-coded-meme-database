import { useState, createContext } from 'react';

interface SelectionContextType {
  selectedMemes: Set<number>;
  toggleMeme: (memeId: number) => void;
  isSelected: (memeId: number) => boolean;
  clearSelection: () => void;
  selectionCount: number;
  getSelectedIds: () => number[];
}

// Create a context with a default value
export const SelectionContext = createContext<SelectionContextType>({
  selectedMemes: new Set<number>(),
  toggleMeme: () => {},
  isSelected: () => false,
  clearSelection: () => {},
  selectionCount: 0,
  getSelectedIds: () => []
});

export const useSelection = () => {
  const [selectedMemes, setSelectedMemes] = useState<Set<number>>(new Set());

  // Toggle a meme's selection status
  const toggleMeme = (memeId: number) => {
    setSelectedMemes(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(memeId)) {
        newSelection.delete(memeId);
      } else {
        newSelection.add(memeId);
      }
      return newSelection;
    });
  };

  // Check if a meme is selected
  const isSelected = (memeId: number) => {
    return selectedMemes.has(memeId);
  };

  // Get array of selected IDs
  const getSelectedIds = () => {
    return Array.from(selectedMemes);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedMemes(new Set());
  };

  return {
    selectedMemes,
    toggleMeme,
    isSelected,
    clearSelection,
    selectionCount: selectedMemes.size,
    getSelectedIds
  };
};
