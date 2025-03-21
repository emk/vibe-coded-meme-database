import React from 'react';
import { SearchBar } from './components/SearchBar';
import { MemeGrid } from './components/MemeGrid';
import { useMemes } from './hooks/useMemes';

function App() {
  const { memes, loading, error, fetchMemes } = useMemes();

  const handleSearch = (query: string) => {
    fetchMemes(query);
  };

  return (
    <div className="container">
      <h1>Meme Database</h1>
      <SearchBar onSearch={handleSearch} />
      <MemeGrid memes={memes} loading={loading} error={error} />
    </div>
  );
}

export default App;
