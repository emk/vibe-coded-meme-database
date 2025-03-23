import React from 'react';
import { SearchBar } from './components/SearchBar';
import { MemeGrid } from './components/MemeGrid';
import { SelectionFooter } from './components/SelectionFooter';
import { useMemes } from './hooks/useMemes';
import { useSelection, SelectionContext } from './hooks/useSelection';
import styles from './App.module.css';

function App() {
  const { memes, loading, error, fetchMemes } = useMemes();
  const selectionState = useSelection();

  const handleSearch = (query: string) => {
    fetchMemes(query);
  };

  return (
    <SelectionContext.Provider value={selectionState}>
      <div className={styles.container}>
        <h1 className={styles.title}>Meme Database</h1>
        <SearchBar onSearch={handleSearch} error={error} />
        {!error && <MemeGrid memes={memes} loading={loading} />}
        <SelectionFooter />
      </div>
    </SelectionContext.Provider>
  );
}

export default App;
