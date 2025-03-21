import React from 'react';
import { Meme } from '../types/Meme';

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
    <div className="meme-card">
      <img src={imagePath} alt={altText} title={altText} />
      <div className="meme-info">
        <div className="meme-keywords">
          {meme.keywords.map((keyword, index) => (
            <span key={index} className="keyword">{keyword}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
