import React from 'react';
import { Meme } from '../types/Meme';
import styles from './MemeCard.module.css';

interface MemeCardProps {
  meme: Meme;
}

export const MemeCard: React.FC<MemeCardProps> = ({ meme }) => {
  // Extract file extension from path
  const fileExt = meme.path.substring(meme.path.lastIndexOf('.'));
  const imagePath = `/images/${meme.category}/${meme.filename}${fileExt}`;
  
  // Create alt/title text
  const altText = meme.text ? 
    (meme.description ? `${meme.text} - ${meme.description}` : meme.text) : 
    (meme.description || 'Meme');
  
  return (
    <div className={styles.memeCard}>
      <img src={imagePath} alt={altText} title={altText} />
      <div className={styles.memeInfo}>
        <div className={styles.memeKeywords}>
          {meme.keywords.map((keyword, index) => (
            <span key={index} className={styles.keyword}>{keyword}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
