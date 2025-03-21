import React, { useState, useContext } from 'react';
import { Meme } from '../types/Meme';
import { SelectionContext } from '../hooks/useSelection';
import styles from './MemeCard.module.css';

interface MemeCardProps {
  meme: Meme;
}

export const MemeCard: React.FC<MemeCardProps> = ({ meme }) => {
  const [isHovering, setIsHovering] = useState(false);
  const { toggleMeme, isSelected } = useContext(SelectionContext);
  const selected = isSelected(meme.id);
  
  // Extract file extension from path
  const fileExt = meme.path.substring(meme.path.lastIndexOf('.'));
  const imagePath = `/images/${meme.category}/${meme.filename}${fileExt}`;
  
  // Create alt/title text
  const altText = meme.text ? 
    (meme.description ? `${meme.text} - ${meme.description}` : meme.text) : 
    (meme.description || 'Meme');
  
  const handleToggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMeme(meme.id);
  };
  
  return (
    <div 
      className={styles.memeCard}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={styles.imageContainer}>
        <img src={imagePath} alt={altText} title={altText} />
        {(isHovering || selected) && (
          <div 
            className={`${styles.checkbox} ${selected ? styles.selected : ''}`}
            onClick={handleToggleSelect}
          >
            {selected ? '✓' : ''}
          </div>
        )}
      </div>
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
