
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const memeContainer = document.getElementById('meme-container');
  
  // Load memes when page loads
  fetchMemes();
  
  // Add search functionality
  searchBtn.addEventListener('click', () => {
    fetchMemes(searchInput.value);
  });
  
  // Also search when Enter key is pressed
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      fetchMemes(searchInput.value);
    }
  });
  
  async function fetchMemes(query = '') {
    try {
      let url = '/api/memes';
      if (query) {
        url += `?q=${encodeURIComponent(query)}`;
      }
      
      const response = await fetch(url);
      const memes = await response.json();
      
      renderMemes(memes);
    } catch (error) {
      console.error('Error fetching memes:', error);
      memeContainer.innerHTML = '<p>Error loading memes. Please try again.</p>';
    }
  }
  
  function renderMemes(memes) {
    if (memes.length === 0) {
      memeContainer.innerHTML = '<p>No memes found. Try a different search.</p>';
      return;
    }
    
    memeContainer.innerHTML = '';
    
    memes.forEach(meme => {
      const card = document.createElement('div');
      card.className = 'meme-card';
      
      // Extract file extension from path
      const fileExt = meme.path.substring(meme.path.lastIndexOf('.'));
      const imagePath = `/images/${meme.category}/${meme.filename}${fileExt}`;
      
      card.innerHTML = `
        <img src="${imagePath}" alt="${meme.text || 'Meme'}">
        <div class="meme-info">
          <div class="meme-text">${meme.text || ''}</div>
          <div class="meme-keywords">
            ${meme.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
          </div>
        </div>
      `;
      
      memeContainer.appendChild(card);
    });
  }
});
  