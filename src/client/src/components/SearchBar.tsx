import React, { useState } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  error?: string | null;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, error }) => {
  const [query, setQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSearch = () => {
    onSearch(query);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  return (
    <div>
      <div className={styles.searchContainer}>
        <input 
          type="text" 
          className={styles.searchInput}
          placeholder="Search memes..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyUp={handleKeyUp}
        />
        <button className={styles.searchButton} onClick={handleSearch}>Search</button>
        <button 
          className={styles.helpButton} 
          type="button" 
          onClick={() => setShowHelp(!showHelp)}
          aria-label="Search syntax help"
        >
          ?
        </button>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {showHelp && (
        <div className={styles.helpPanel}>
          <h4>Search Syntax</h4>
          <ul>
            <li><code>cat dog</code> - Find memes with both words (implicit AND)</li>
            <li><code>cat AND dog</code> - Same as above, explicit AND</li>
            <li><code>cat OR dog</code> - Find memes with either word</li>
            <li><code>cat NOT dog</code> - Find memes with "cat" but not "dog"</li>
            <li><code>"surprised pikachu"</code> - Exact phrase search</li>
            <li><code>pikachu AND (surprised OR detective)</code> - Grouping with parentheses</li>
            <li><code>program*</code> - Prefix search (matches "program", "programming")</li>
            <li><code>NEAR(cat dog, 5)</code> - Words within 5 words of each other</li>
            <li><code>text:pikachu</code> - Search only in text field</li>
            <li><code>keywords:pokemon</code> - Search only in keywords field</li>
          </ul>
        </div>
      )}
    </div>
  );
};
