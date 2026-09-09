// Homepage Application Logic

let allMovies = [];
let currentGenre = 'all';
let currentSearch = '';
let currentHeroIndex = 0;
let heroTimer = null;

// Watchlist storage key
const WATCHLIST_KEY = 'cinestream_watchlist';

function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function toggleWatchlist(movieId) {
  let list = getWatchlist();
  if (list.includes(movieId)) {
    list = list.filter(id => id !== movieId);
  } else {
    list.push(movieId);
  }
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  updateWatchlistUI();
  return list.includes(movieId);
}

function isMovieInWatchlist(movieId) {
  return getWatchlist().includes(movieId);
}

// Fetch Movies from API
async function loadMovies() {
  try {
    const res = await fetch('/api/movies');
    const data = await res.json();
    if (data.success && data.movies) {
      allMovies = data.movies;
      setupHeroCarousel();
      renderMoviesGrid();
      updateWatchlistUI();
    }
  } catch (err) {
    console.error('Failed to load movies:', err);
    document.getElementById('movies-grid').innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        Failed to load movies. Please make sure the server is running.
      </div>
    `;
  }
}

// Hero Carousel Setup
function setupHeroCarousel() {
  const featuredMovies = allMovies.filter(m => m.featured);
  const heroList = featuredMovies.length > 0 ? featuredMovies : allMovies.slice(0, 3);
  if (heroList.length === 0) return;

  function renderHero(index) {
    const m = heroList[index];
    const heroBackdrop = document.getElementById('hero-backdrop');
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-desc');
    const heroRating = document.getElementById('hero-rating');
    const heroQuality = document.getElementById('hero-quality');
    const heroPlayBtn = document.getElementById('hero-play-btn');
    const heroWatchlistBtn = document.getElementById('hero-watchlist-btn');

    if (!heroTitle) return;

    heroBackdrop.style.backgroundImage = `url('${m.backdrop || m.poster}')`;
    heroTitle.textContent = m.title;
    heroDesc.textContent = m.description;
    heroRating.innerHTML = `★ ${m.rating.toFixed(1)}`;
    heroQuality.textContent = m.quality || 'HD';
    heroPlayBtn.href = `watch.html?id=${encodeURIComponent(m.id)}`;

    const inList = isMovieInWatchlist(m.id);
    heroWatchlistBtn.innerHTML = inList 
      ? `<span>✔ In Watchlist</span>` 
      : `<span>+ Add to Watchlist</span>`;

    heroWatchlistBtn.onclick = () => {
      const added = toggleWatchlist(m.id);
      heroWatchlistBtn.innerHTML = added 
        ? `<span>✔ In Watchlist</span>` 
        : `<span>+ Add to Watchlist</span>`;
    };
  }

  renderHero(currentHeroIndex);

  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    currentHeroIndex = (currentHeroIndex + 1) % heroList.length;
    renderHero(currentHeroIndex);
  }, 7000);
}

// Render Movies Grid with Native Sponsored Card
function renderMoviesGrid() {
  const grid = document.getElementById('movies-grid');
  if (!grid) return;

  let filtered = allMovies;

  if (currentGenre !== 'all') {
    filtered = filtered.filter(m => 
      m.genres && m.genres.some(g => g.toLowerCase() === currentGenre.toLowerCase())
    );
  }

  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase().trim();
    filtered = filtered.filter(m => 
      m.title.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      (m.genres && m.genres.some(g => g.toLowerCase().includes(q)))
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <h3 style="color:#fff; margin-bottom: 8px;">No movies found</h3>
        <p>Try searching for another keyword or pick a different genre.</p>
      </div>
    `;
    return;
  }

  let html = '';

  filtered.forEach((movie, index) => {
    // Insert a native sponsored ad card at position 3 for monetization
    if (index === 3) {
      html += `
        <div class="native-ad-card">
          <div>
            <span class="ad-badge">SPONSORED</span>
            <div class="native-ad-icon">🛡️</div>
            <h4>NordVPN 74% Deal</h4>
            <p>Stream buffer-free with zero ISP logs & 6000+ servers worldwide.</p>
          </div>
          <a href="https://nordvpn.com" target="_blank" rel="noopener noreferrer" class="btn-sponsor-alt" onclick="if(window.AdsManager) AdsManager.trackClick();">
            Unlock Deal &rarr;
          </a>
        </div>
      `;
    }

    const inList = isMovieInWatchlist(movie.id);

    html += `
      <div class="movie-card" data-id="${movie.id}">
        <a href="watch.html?id=${encodeURIComponent(movie.id)}" class="poster-container">
          <img src="${movie.poster}" alt="${movie.title}" loading="lazy" />
          <div class="poster-overlay">
            <div class="btn-card-play">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <span class="card-badge-quality">${movie.quality || 'HD'}</span>
          <span class="card-badge-rating">★ ${movie.rating ? movie.rating.toFixed(1) : '8.0'}</span>
        </a>
        <div class="movie-info">
          <div>
            <a href="watch.html?id=${encodeURIComponent(movie.id)}" class="movie-card-title" title="${movie.title}">
              ${movie.title}
            </a>
            <div class="movie-card-meta">
              <span>${movie.year || '2024'}</span>
              <span>${movie.duration || 'Full'}</span>
            </div>
            <div class="movie-card-genres">
              ${movie.genres ? movie.genres.join(' • ') : 'Cinema'}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

// Update Watchlist UI & Badges
function updateWatchlistUI() {
  const countBadge = document.getElementById('watchlist-count');
  const list = getWatchlist();
  if (countBadge) {
    countBadge.textContent = list.length;
    countBadge.style.display = list.length > 0 ? 'inline-block' : 'none';
  }
}

// Render Watchlist Modal Content
function renderWatchlistModal() {
  const container = document.getElementById('watchlist-modal-items');
  if (!container) return;

  const list = getWatchlist();
  const movies = allMovies.filter(m => list.includes(m.id));

  if (movies.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        Your watchlist is currently empty. Click "+ Add to Watchlist" on any movie to save it here!
      </div>
    `;
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px;">';
  movies.forEach(m => {
    html += `
      <div style="background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-glass);">
        <a href="watch.html?id=${encodeURIComponent(m.id)}">
          <img src="${m.poster}" alt="${m.title}" style="width: 100%; aspect-ratio: 2/3; object-fit: cover;" />
        </a>
        <div style="padding: 10px;">
          <h5 style="color:#fff; font-size: 0.9rem; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.title}</h5>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
            <span style="color: var(--accent-gold);">★ ${m.rating}</span>
            <button onclick="removeAndRefreshWatchlist('${m.id}')" style="color: #ff4b55; font-size: 0.75rem;">Remove</button>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

window.removeAndRefreshWatchlist = function(movieId) {
  toggleWatchlist(movieId);
  renderWatchlistModal();
  renderMoviesGrid();
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadMovies();

  // Search input
  const searchInput = document.getElementById('movie-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderMoviesGrid();
    });
  }

  // Genre pills
  const genrePills = document.querySelectorAll('.genre-pill');
  genrePills.forEach(pill => {
    pill.addEventListener('click', () => {
      genrePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentGenre = pill.getAttribute('data-genre') || 'all';
      renderMoviesGrid();
    });
  });

  // Watchlist modal open/close
  const watchlistBtn = document.getElementById('open-watchlist-modal');
  const modalBackdrop = document.getElementById('watchlist-modal');
  const closeModalBtn = document.getElementById('close-watchlist-modal');

  if (watchlistBtn && modalBackdrop) {
    watchlistBtn.addEventListener('click', () => {
      renderWatchlistModal();
      modalBackdrop.classList.add('active');
    });
  }

  if (closeModalBtn && modalBackdrop) {
    closeModalBtn.addEventListener('click', () => {
      modalBackdrop.classList.remove('active');
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('active');
      }
    });
  }
});
