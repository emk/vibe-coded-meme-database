import { renderHook, act } from '@testing-library/react';
import { useSelection } from '../../../src/client/src/hooks/useSelection';
import { describe, test, expect } from 'vitest';

describe('useSelection Hook', () => {
  test('should initialize with empty selection', () => {
    const { result } = renderHook(() => useSelection());
    
    expect(result.current.selectedMemes).toBeInstanceOf(Set);
    expect(result.current.selectedMemes.size).toBe(0);
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.getSelectedIds()).toEqual([]);
  });

  test('should toggle a meme in selection', async () => {
    const { result } = renderHook(() => useSelection());
    
    // Toggle a meme (add to selection)
    await act(async () => {
      result.current.toggleMeme(1);
    });
    
    expect(result.current.selectedMemes.size).toBe(1);
    expect(result.current.selectedMemes.has(1)).toBe(true);
    expect(result.current.selectionCount).toBe(1);
    expect(result.current.isSelected(1)).toBe(true);
    expect(result.current.getSelectedIds()).toEqual([1]);
    
    // Toggle the same meme again (remove from selection)
    await act(async () => {
      result.current.toggleMeme(1);
    });
    
    expect(result.current.selectedMemes.size).toBe(0);
    expect(result.current.selectedMemes.has(1)).toBe(false);
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.isSelected(1)).toBe(false);
    expect(result.current.getSelectedIds()).toEqual([]);
  });

  test('should handle multiple meme selections', async () => {
    const { result } = renderHook(() => useSelection());
    
    // Add multiple memes
    await act(async () => {
      result.current.toggleMeme(1);
      result.current.toggleMeme(2);
      result.current.toggleMeme(3);
    });
    
    expect(result.current.selectedMemes.size).toBe(3);
    expect(result.current.selectionCount).toBe(3);
    expect(result.current.isSelected(1)).toBe(true);
    expect(result.current.isSelected(2)).toBe(true);
    expect(result.current.isSelected(3)).toBe(true);
    
    // Check order of IDs is maintained
    expect(result.current.getSelectedIds().sort()).toEqual([1, 2, 3]);
  });

  test('should clear selection', async () => {
    const { result } = renderHook(() => useSelection());
    
    // Add some memes
    await act(async () => {
      result.current.toggleMeme(1);
      result.current.toggleMeme(2);
    });
    
    expect(result.current.selectedMemes.size).toBe(2);
    
    // Clear selection
    await act(async () => {
      result.current.clearSelection();
    });
    
    expect(result.current.selectedMemes.size).toBe(0);
    expect(result.current.selectionCount).toBe(0);
    expect(result.current.getSelectedIds()).toEqual([]);
    expect(result.current.isSelected(1)).toBe(false);
    expect(result.current.isSelected(2)).toBe(false);
  });
});