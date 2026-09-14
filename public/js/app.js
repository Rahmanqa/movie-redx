// Movie redx - Core Frontend Application Logic

// State Management
let currentMediaType = 'trending'; // 'trending', 'hindi', 'movie', 'tv', 'top-rated', 'upcoming'
let currentLanguage = '';
let currentGenreId = '';
let currentYear = '';
let currentSort = 'popularity.desc';
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let displayedItems = [];
let heroItems = [];
let currentHeroIndex = 0;
let heroTimer = null;
let searchDebounceTimer = null;

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const WATCHLIST_KEY = 'movieredx_watchlist';
const CONTINUE_WATCHING_KEY = 'movieredx_continue_watching';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('Service Worker registration skipped/failed:', err);
    });
  });
}

// Watchlist Helpers
function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveWatchlist(list) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  updateWatchlistBadge();
}

function isItemInWatchlist(id) {
  return getWatchlist().some(item => String(item.id) === String(id));
}

function toggleWatchlistItem(item) {
  let list = getWatchlist();
  const exists = list.some(x => String(x.id) === String(item.id));
  if (exists) {
    list = list.filter(x => String(x.id) !== String(item.id));
  } else {
    list.unshift({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      poster: item.poster,
      vote_average: item.vote_average || item.rating || 8.0,
      release_date: item.release_date || item.first_air_date || item.year,
      media_type: item.media_type || (item.name ? 'tv' : 'movie')
    });
  }
  saveWatchlist(list);
  return !exists;
}

function updateWatchlistBadge() {
  const badge = document.getElementById('watchlist-badge');
  const count = getWatchlist().length;
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// Continue Watching Helpers
function getContinueWatching() {
  try {
    return JSON.parse(localStorage.getItem(CONTINUE_WATCHING_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function renderContinueWatching() {
  const section = document.getElementById('continue-watching-section');
  const grid = document.getElementById('continue-grid');
  if (!section || !grid) return;

  const items = getContinueWatching();
  if (items.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  let html = '';
  items.slice(0, 6).forEach(item => {
    const backdropUrl = item.backdrop ? (item.backdrop.startsWith('http') ? item.backdrop : TMDB_BACKDROP_BASE + item.backdrop) : (item.poster ? (item.poster.startsWith('http') ? item.poster : TMDB_IMG_BASE + item.poster) : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500');
    const watchUrl = item.tmdbId ? `watch.html?tmdb=${item.tmdbId}${item.type === 'tv' ? `&type=tv&s=${item.season || 1}&e=${item.episode || 1}` : ''}` : `watch.html?id=${encodeURIComponent(item.id)}`;

    html += `
      <div class="continue-card">
        <a href="${watchUrl}">
          <div class="continue-thumb">
            <img src="${backdropUrl}" alt="${item.title}" loading="lazy" />
            <div class="card-poster-overlay">
              <div class="card-play-btn" style="width: 40px; height: 40px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div class="continue-progress-bar">
              <div class="continue-progress-fill" style="width: ${item.progress || 50}%"></div>
            </div>
          </div>
        </a>
        <div style="padding: 8px 10px;">
          <h5 style="font-size: 0.82rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h5>
          <div style="display:flex; justify-content:space-between; font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">
            <span>${item.type === 'tv' ? `S${item.season || 1} E${item.episode || 1}` : 'Movie'}</span>
            <span style="color: var(--primary-glow);">${item.progress ? `${Math.round(item.progress)}% watched` : 'Resume'}</span>
          </div>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

window.clearContinueWatching = function() {
  localStorage.removeItem(CONTINUE_WATCHING_KEY);
  renderContinueWatching();
};

// Main Data Fetcher
async function fetchMediaData(page = 1, append = false) {
  if (isLoading) return;
  isLoading = true;

  const btnLoadMore = document.getElementById('btn-load-more');
  if (btnLoadMore) btnLoadMore.textContent = 'Loading titles...';

  try {
    let url = '';

    if (currentMediaType === 'hindi') {
      // Fetch BOTH: Hindi-language originals AND India-trending (includes Hindi dubbed Hollywood)
      const hindiUrl = `/api/tmdb/discover?type=movie&language=hi&page=${page}&sort_by=${currentSort}${currentGenreId ? '&genre=' + currentGenreId : ''}${currentYear ? '&year=' + currentYear : ''}`;
      const indiaUrl = `/api/tmdb/trending?type=movie&time=week&region=IN&page=${page}`;

      const [hindiRes, indiaRes] = await Promise.allSettled([fetch(hindiUrl), fetch(indiaUrl)]);

      let hindiResults = [];
      let indiaResults = [];

      if (hindiRes.status === 'fulfilled' && hindiRes.value.ok) {
        const d = await hindiRes.value.json();
        hindiResults = d.results || [];
        totalPages = d.total_pages || 100;
        currentPage = page;
      }
      if (indiaRes.status === 'fulfilled' && indiaRes.value.ok) {
        const d = await indiaRes.value.json();
        indiaResults = d.results || [];
      }

      // Merge and deduplicate by id
      const seen = new Set();
      const merged = [];
      [...hindiResults, ...indiaResults].forEach(item => {
        if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
      });

      if (merged.length > 0) {
        if (append) {
          displayedItems = [...displayedItems, ...merged];
        } else {
          displayedItems = merged;
          heroItems = merged.slice(0, 6);
          setupHeroSpotlight();
        }
        renderCatalogGrid();
      } else if (!append) {
        loadLocalFallback();
      }

      isLoading = false;
      if (btnLoadMore) btnLoadMore.textContent = 'Load More Titles';
      return;
    }

    if (currentGenreId || currentYear || currentLanguage) {
      const type = currentMediaType === 'tv' ? 'tv' : 'movie';
      url = `/api/tmdb/discover?type=${type}&page=${page}&sort_by=${currentSort}`;
      if (currentGenreId) url += `&genre=${currentGenreId}`;
      if (currentYear) url += `&year=${currentYear}`;
      if (currentLanguage) url += `&language=${currentLanguage}`;
    } else if (currentMediaType === 'trending') {
      url = `/api/tmdb/trending?type=all&time=day&page=${page}`;
    } else if (currentMediaType === 'movie') {
      url = `/api/tmdb/popular?type=movie&page=${page}`;
    } else if (currentMediaType === 'tv') {
      url = `/api/tmdb/popular?type=tv&page=${page}`;
    } else if (currentMediaType === 'top-rated') {
      url = `/api/tmdb/top-rated?type=movie&page=${page}`;
    } else if (currentMediaType === 'upcoming') {
      url = `/api/tmdb/upcoming?page=${page}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      totalPages = data.total_pages || 100;
      currentPage = page;

      if (append) {
        displayedItems = [...displayedItems, ...data.results];
      } else {
        displayedItems = data.results;
        // If first page of trending, setup hero spotlight
        if (page === 1 && (currentMediaType === 'trending' || currentMediaType === 'movie')) {
          heroItems = data.results.slice(0, 6);
          setupHeroSpotlight();
        }
      }
      renderCatalogGrid();
    } else {
      if (!append) {
        // Fallback to local catalog if TMDB returns empty
        loadLocalFallback();
      }
    }
  } catch (err) {
    console.warn('TMDB Fetch failed, falling back to local database:', err);
    if (!append) loadLocalFallback();
  } finally {
    isLoading = false;
    if (btnLoadMore) btnLoadMore.textContent = 'Load More Titles';
  }
}


// Fallback to local curated catalog
async function loadLocalFallback() {
  try {
    const res = await fetch('/api/movies');
    const data = await res.json();
    if (data.success && data.movies) {
      displayedItems = data.movies;
      heroItems = data.movies.filter(m => m.featured).length > 0 ? data.movies.filter(m => m.featured) : data.movies.slice(0, 4);
      setupHeroSpotlight();
      renderCatalogGrid();
    }
  } catch (e) {
    console.error('Local fallback failed:', e);
  }
}

// Hero Spotlight Slider
function setupHeroSpotlight() {
  if (!heroItems || heroItems.length === 0) return;

  function renderHero(index) {
    const item = heroItems[index];
    if (!item) return;

    const heroBackdrop = document.getElementById('hero-backdrop');
    const heroTitle = document.getElementById('hero-title');
    const heroOverview = document.getElementById('hero-overview');
    const heroRating = document.getElementById('hero-rating');
    const heroQuality = document.getElementById('hero-quality');
    const heroYear = document.getElementById('hero-year');
    const heroTag = document.getElementById('hero-tag');
    const heroPlayBtn = document.getElementById('hero-play-btn');
    const heroTrailerBtn = document.getElementById('hero-trailer-btn');
    const heroWatchlistBtn = document.getElementById('hero-watchlist-toggle');

    const title = item.title || item.name || 'Featured Movie';
    const releaseDate = item.release_date || item.first_air_date || (item.year ? String(item.year) : '2024');
    const year = releaseDate ? releaseDate.split('-')[0] : '2024';
    const rating = (item.vote_average || item.rating || 8.5).toFixed(1);
    const backdropUrl = item.backdrop_path ? TMDB_BACKDROP_BASE + item.backdrop_path : (item.backdrop || item.poster || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600');

    if (heroBackdrop) heroBackdrop.style.backgroundImage = `url('${backdropUrl}')`;
    if (heroTitle) heroTitle.textContent = title;
    if (heroOverview) heroOverview.textContent = item.overview || item.description || 'Watch now in full HD quality.';
    if (heroRating) heroRating.innerHTML = `★ ${rating} TMDB`;
    if (heroQuality) heroQuality.textContent = '4K ULTRA HD';
    if (heroYear) heroYear.textContent = year;
    if (heroTag) heroTag.textContent = index === 0 ? '🔥 TRENDING #1' : `FEATURED #${index + 1}`;

    const isTv = item.media_type === 'tv' || Boolean(item.name);
    const heroLangSuffix = currentMediaType === 'hindi' ? '&lang=hi' : '';
    const watchUrl = item.id ? (String(item.id).startsWith('tmdb-') ? `watch.html?tmdb=${item.id.replace('tmdb-', '')}${isTv ? '&type=tv' : ''}${heroLangSuffix}` : `watch.html?tmdb=${item.id}${isTv ? '&type=tv' : ''}${heroLangSuffix}`) : `watch.html?id=${encodeURIComponent(item.id)}`;

    if (heroPlayBtn) heroPlayBtn.href = watchUrl;

    // Trailer modal trigger
    if (heroTrailerBtn) {
      heroTrailerBtn.onclick = () => {
        openTrailerModal(item.id, title, isTv);
      };
    }

    // Watchlist trigger
    if (heroWatchlistBtn) {
      const inList = isItemInWatchlist(item.id);
      heroWatchlistBtn.textContent = inList ? '✔' : '+';
      heroWatchlistBtn.style.background = inList ? 'var(--primary)' : 'rgba(255,255,255,0.1)';
      heroWatchlistBtn.onclick = () => {
        const added = toggleWatchlistItem(item);
        heroWatchlistBtn.textContent = added ? '✔' : '+';
        heroWatchlistBtn.style.background = added ? 'var(--primary)' : 'rgba(255,255,255,0.1)';
      };
    }
  }

  renderHero(currentHeroIndex);

  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    currentHeroIndex = (currentHeroIndex + 1) % heroItems.length;
    renderHero(currentHeroIndex);
  }, 8000);
}

// Render Movies Grid
function renderCatalogGrid() {
  const grid = document.getElementById('movies-grid');
  if (!grid) return;

  if (displayedItems.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <h3 style="color:#fff; margin-bottom: 8px;">No titles found</h3>
        <p>Try searching for a different keyword or select another genre filter.</p>
      </div>
    `;
    return;
  }

  let html = '';

  displayedItems.forEach((item, index) => {
    const title = item.title || item.name || 'Untitled';
    const isTv = item.media_type === 'tv' || Boolean(item.name);
    const releaseDate = item.release_date || item.first_air_date || (item.year ? String(item.year) : '2024');
    const year = releaseDate ? releaseDate.split('-')[0] : '2024';
    const rating = (item.vote_average || item.rating || 8.0).toFixed(1);
    const posterUrl = item.poster_path ? TMDB_IMG_BASE + item.poster_path : (item.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500');
    const langSuffix = currentMediaType === 'hindi' ? '&lang=hi' : '';
    const watchUrl = item.id ? `watch.html?tmdb=${item.id}${isTv ? '&type=tv' : ''}${langSuffix}` : `watch.html?id=${encodeURIComponent(item.id)}`;

    html += `
      <div class="movie-card" data-id="${item.id}">
        <a href="${watchUrl}" class="card-poster-wrap">
          <img src="${posterUrl}" alt="${title}" class="card-poster-img" loading="lazy" />
          <div class="card-poster-overlay">
            <div class="card-play-btn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <span class="card-type-badge">${isTv ? 'TV' : 'HD'}</span>
          <span class="card-rating-badge">★ ${rating}</span>
        </a>
        <div class="movie-card-info">
          <a href="${watchUrl}" class="movie-card-title" title="${title}">${title}</a>
          <div class="movie-card-meta">
            <span>${year}</span>
            <span style="color: var(--primary-glow); font-weight: 700;">Free 4K</span>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

// Live Instant Search with TMDB
function initSearch() {
  const input = document.getElementById('movie-search-input');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

    if (query.length < 2) {
      dropdown.classList.remove('active');
      dropdown.innerHTML = '';
      return;
    }

    searchDebounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
          let html = '';
          data.results.slice(0, 8).forEach(item => {
            const title = item.title || item.name || 'Untitled';
            const isTv = item.media_type === 'tv' || Boolean(item.name);
            const releaseDate = item.release_date || item.first_air_date || '';
            const year = releaseDate ? releaseDate.split('-')[0] : '';
            const rating = (item.vote_average || 8.0).toFixed(1);
            const posterUrl = item.poster_path ? TMDB_IMG_BASE + item.poster_path : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200';
            const watchUrl = `watch.html?tmdb=${item.id}${isTv ? '&type=tv' : ''}`;

            html += `
              <a href="${watchUrl}" class="search-result-item">
                <img src="${posterUrl}" alt="${title}" class="search-result-thumb" />
                <div class="search-result-details">
                  <div class="search-result-title">${title}</div>
                  <div class="search-result-meta">
                    <span style="color: var(--accent-gold);">★ ${rating}</span>
                    <span>•</span>
                    <span>${year || (isTv ? 'TV Series' : 'Movie')}</span>
                    <span>•</span>
                    <span style="color: var(--primary-glow);">${isTv ? 'TV' : 'MOVIE'}</span>
                  </div>
                </div>
              </a>
            `;
          });
          dropdown.innerHTML = html;
          dropdown.classList.add('active');
        } else {
          dropdown.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No matches found for "${query}"</div>`;
          dropdown.classList.add('active');
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
}

// Trailer Modal Handler
async function openTrailerModal(id, title, isTv) {
  const modal = document.getElementById('trailer-modal');
  const iframe = document.getElementById('trailer-iframe');
  const titleEl = document.getElementById('trailer-title');

  if (!modal || !iframe) return;
  if (titleEl) titleEl.textContent = `${title} — Official Trailer`;

  try {
    const endpoint = isTv ? `/api/tmdb/tv/${id}` : `/api/tmdb/movie/${id}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    const media = isTv ? data.tv : data.movie;

    const trailer = media?.videos?.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || media?.videos?.[0];
    if (trailer && trailer.key) {
      iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
      modal.classList.add('active');
    } else {
      iframe.src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(title + ' official trailer')}&autoplay=1`;
      modal.classList.add('active');
    }
  } catch (err) {
    iframe.src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(title + ' official trailer')}&autoplay=1`;
    modal.classList.add('active');
  }
}

function closeTrailerModal() {
  const modal = document.getElementById('trailer-modal');
  const iframe = document.getElementById('trailer-iframe');
  if (modal) modal.classList.remove('active');
  if (iframe) iframe.src = '';
}

// Watchlist Modal Handler
function renderWatchlistModal() {
  const container = document.getElementById('watchlist-modal-content');
  if (!container) return;

  const list = getWatchlist();
  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">★</div>
        <h4 style="color:#fff; margin-bottom: 6px;">Your Watchlist is Empty</h4>
        <p style="font-size: 0.85rem;">Save your favorite movies and TV series to watch later anytime!</p>
      </div>
    `;
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 14px;">';
  list.forEach(item => {
    const posterUrl = item.poster_path ? TMDB_IMG_BASE + item.poster_path : (item.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300');
    const watchUrl = `watch.html?tmdb=${item.id}${item.media_type === 'tv' ? '&type=tv' : ''}`;

    html += `
      <div style="background: var(--bg-card); border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-glass);">
        <a href="${watchUrl}">
          <img src="${posterUrl}" alt="${item.title}" style="width:100%; aspect-ratio:2/3; object-fit: cover;" />
        </a>
        <div style="padding: 8px;">
          <h5 style="color:#fff; font-size: 0.8rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</h5>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <span style="color:var(--accent-gold); font-size:0.75rem;">★ ${item.vote_average ? Number(item.vote_average).toFixed(1) : '8.0'}</span>
            <button onclick="removeWatchlistItem('${item.id}')" style="color: #ff4b55; font-size: 0.75rem;">Remove</button>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

window.removeWatchlistItem = function(id) {
  let list = getWatchlist().filter(x => String(x.id) !== String(id));
  saveWatchlist(list);
  renderWatchlistModal();
};

// Global Switch Media Type
window.switchMediaType = function(type) {
  currentMediaType = type;
  currentGenreId = '';
  currentPage = 1;

  document.querySelectorAll('.media-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-type') === type);
  });
  document.querySelectorAll('.genre-pill').forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-genre') === '');
  });

  const titleEl = document.getElementById('catalog-title');
  if (titleEl) {
    if (type === 'hindi') {
      currentLanguage = 'hi';
      titleEl.innerHTML = '<span class="shelf-indicator"></span><span>🇮🇳 Bollywood & Hindi Cinema</span>';
      const langSelect = document.getElementById('filter-language');
      if (langSelect) langSelect.value = 'hi';
    } else if (type === 'movie') {
      titleEl.innerHTML = '<span class="shelf-indicator"></span><span>Popular Movies</span>';
    } else if (type === 'tv') {
      titleEl.innerHTML = '<span class="shelf-indicator"></span><span>Trending TV Series</span>';
    } else if (type === 'top-rated') {
      titleEl.innerHTML = '<span class="shelf-indicator"></span><span>Top Rated Cinema</span>';
    } else if (type === 'upcoming') {
      titleEl.innerHTML = '<span class="shelf-indicator"></span><span>Upcoming Releases</span>';
    } else {
      titleEl.innerHTML = '<span class="shelf-indicator"></span><span>Trending Now</span>';
    }
  }

  fetchMediaData(1, false);
};

// Global Select Genre Pill
window.selectGenrePill = function(genreId) {
  currentGenreId = genreId;
  currentPage = 1;

  document.querySelectorAll('.genre-pill').forEach(p => {
    p.classList.toggle('active', p.getAttribute('data-genre') === genreId);
  });

  fetchMediaData(1, false);
};

// Secret Hidden Admin Triggers (Hidden from normal users)
function initHiddenAdminTrigger() {
  let logoTapCount = 0;
  let tapResetTimer = null;

  const logoTrigger = document.getElementById('brand-logo-trigger');
  const footerTrigger = document.getElementById('footer-copyright-trigger');

  function registerAdminTap() {
    logoTapCount++;
    if (tapResetTimer) clearTimeout(tapResetTimer);

    if (logoTapCount >= 5) {
      window.location.href = 'admin.html';
      return;
    }

    tapResetTimer = setTimeout(() => {
      logoTapCount = 0;
    }, 3000);
  }

  if (logoTrigger) {
    logoTrigger.addEventListener('click', (e) => {
      // If holding Alt key or tapped 5 times
      if (e.altKey) {
        e.preventDefault();
        window.location.href = 'admin.html';
      } else {
        logoTapCount++;
        if (logoTapCount >= 5) {
          e.preventDefault();
          window.location.href = 'admin.html';
        }
      }
    });
  }

  if (footerTrigger) {
    footerTrigger.addEventListener('click', registerAdminTap);
  }

  // Keyboard shortcut: Ctrl + Shift + A
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      window.location.href = 'admin.html';
    }
  });
}

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  updateWatchlistBadge();
  renderContinueWatching();
  fetchMediaData(1, false);
  initSearch();
  initHiddenAdminTrigger();

  // Media tabs click
  document.querySelectorAll('.media-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.getAttribute('data-type');
      switchMediaType(type);
    });
  });

  // Language filter select
  const langSelect = document.getElementById('filter-language');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      currentLanguage = e.target.value;
      if (currentLanguage === 'hi') {
        currentMediaType = 'hindi';
      }
      fetchMediaData(1, false);
    });
  }

  // Genre pills click
  document.querySelectorAll('.genre-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const genre = pill.getAttribute('data-genre');
      selectGenrePill(genre);
    });
  });

  // Filter Year & Sort
  const yearSelect = document.getElementById('filter-year');
  if (yearSelect) {
    yearSelect.addEventListener('change', (e) => {
      currentYear = e.target.value;
      fetchMediaData(1, false);
    });
  }

  const sortSelect = document.getElementById('filter-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      fetchMediaData(1, false);
    });
  }

  // Load More Button
  const btnLoadMore = document.getElementById('btn-load-more');
  if (btnLoadMore) {
    btnLoadMore.addEventListener('click', () => {
      fetchMediaData(currentPage + 1, true);
    });
  }

  // Watchlist Modal Listeners
  const openWatchlistBtn = document.getElementById('open-watchlist-btn');
  const mobileWatchlistTab = document.getElementById('mobile-watchlist-tab');
  const watchlistModal = document.getElementById('watchlist-modal');
  const closeWatchlistBtn = document.getElementById('close-watchlist-modal');

  function openWatchlist() {
    renderWatchlistModal();
    if (watchlistModal) watchlistModal.classList.add('active');
  }

  if (openWatchlistBtn) openWatchlistBtn.addEventListener('click', openWatchlist);
  if (mobileWatchlistTab) mobileWatchlistTab.addEventListener('click', openWatchlist);
  if (closeWatchlistBtn) closeWatchlistBtn.addEventListener('click', () => watchlistModal.classList.remove('active'));

  // Mobile Search Tab
  const mobileSearchTab = document.getElementById('mobile-search-tab');
  if (mobileSearchTab) {
    mobileSearchTab.addEventListener('click', () => {
      const input = document.getElementById('movie-search-input');
      if (input) {
        input.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Trailer Modal Close
  const closeTrailerBtn = document.getElementById('close-trailer-modal');
  if (closeTrailerBtn) closeTrailerBtn.addEventListener('click', closeTrailerModal);

  // Close modals on overlay click
  [watchlistModal, document.getElementById('trailer-modal')].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          if (modal.id === 'trailer-modal') closeTrailerModal();
        }
      });
    }
  });
});
