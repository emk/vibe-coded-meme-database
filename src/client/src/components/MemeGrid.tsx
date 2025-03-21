import React from 'react';
import { Meme } from '../types/Meme';
import { MemeCard } from './MemeCard';
import styles from './MemeGrid.module.css';

interface MemeGridProps {
  memes: Meme[];
  loading: boolean;
  error: string | null;
}

export const MemeGrid: React.FC<MemeGridProps> = ({ memes, loading, error }) => {
  if (loading) {
    return <div>Loading memes...</div>;
  }

  if (error) {
    return <div>Error loading memes: {error}</div>;
  }

  if (memes.length === 0) {
    return <div>No memes found. Try a different search.</div>;
  }

  return (
    <div className={styles.memeGrid}>
      {memes.length === 200 && (
        <div className={styles.limitNotice}>
          Showing the 200 most recent memes. Use search to narrow results.
        </div>
      )}
      {memes.map((meme) => (
        <MemeCard key={meme.id} meme={meme} />
      ))}
    </div>
  );
};
