
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
      memeContainer.innerHTML = '';
      
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'Error loading memes. Please try again.';
      memeContainer.appendChild(errorMessage);
    }
  }
  
  function renderMemes(memes) {
    if (memes.length === 0) {
      memeContainer.innerHTML = '';
      const noResults = document.createElement('p');
      noResults.textContent = 'No memes found. Try a different search.';
      memeContainer.appendChild(noResults);
      return;
    }
    
    memeContainer.innerHTML = '';
    
    if (memes.length === 200) {
      const limitNotice = document.createElement('div');
      limitNotice.className = 'limit-notice';
      limitNotice.textContent = 'Showing the 200 most recent memes. Use search to narrow results.';
      memeContainer.appendChild(limitNotice);
    }
    
    memes.forEach(meme => {
      const card = document.createElement('div');
      card.className = 'meme-card';
      
      // Extract file extension from path
      const fileExt = meme.path.substring(meme.path.lastIndexOf('.'));
      const imagePath = `/images/${meme.category}/${meme.filename}${fileExt}`;
      
      // Create image element with proper alt/title text
      const img = document.createElement('img');
      img.src = imagePath;
      
      const altText = meme.text ? 
        (meme.description ? `${meme.text} - ${meme.description}` : meme.text) : 
        (meme.description || 'Meme');
      
      img.alt = altText;
      img.title = altText;
      
      // Create meme info container
      const memeInfo = document.createElement('div');
      memeInfo.className = 'meme-info';
      
      // Create keywords container
      const keywordsDiv = document.createElement('div');
      keywordsDiv.className = 'meme-keywords';
      
      // Add keywords as spans
      meme.keywords.forEach(keyword => {
        const keywordSpan = document.createElement('span');
        keywordSpan.className = 'keyword';
        keywordSpan.textContent = keyword;
        keywordsDiv.appendChild(keywordSpan);
      });
      
      // Assemble the card
      memeInfo.appendChild(keywordsDiv);
      card.appendChild(img);
      card.appendChild(memeInfo);
      
      memeContainer.appendChild(card);
    });
  }
});
  