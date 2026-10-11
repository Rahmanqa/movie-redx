// Movie redx - Core Frontend Application Logic

// State Management
let currentMediaType = 'trending'; // 'trending', 'hindi', 'movie', 'tv', 'top-rated', 'upcoming'
let currentLanguage = '';
let currentGenreId = '';
let currentGenresList = []; // Support multi-select genres
let currentYear = '';
let currentYearMin = 1990;
let currentYearMax = 2026;
let currentMinRating = 0;
let currentSort = 'popularity.desc';
let currentPage = 1;
let totalPages = 1;
let totalResultsCount = 0;
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

    const hasActiveFilters = currentGenreId || (currentGenresList && currentGenresList.length > 0) || 
      currentYear || currentLanguage || (currentMinRating && currentMinRating > 0) || 
      (currentYearMin && currentYearMin > 1990) || (currentYearMax && currentYearMax < 2026);

    if (hasActiveFilters) {
      const type = currentMediaType === 'tv' ? 'tv' : 'movie';
      url = `/api/tmdb/discover?type=${type}&page=${page}&sort_by=${currentSort}`;
      
      const genreParam = (currentGenresList && currentGenresList.length > 0) ? currentGenresList.join(',') : currentGenreId;
      if (genreParam) url += `&genre=${encodeURIComponent(genreParam)}`;
      
      if (currentYear) {
        url += `&year=${currentYear}`;
      } else if (currentYearMin && currentYearMax && (currentYearMin > 1990 || currentYearMax < 2026)) {
        if (currentYearMin === currentYearMax) {
          url += `&year=${currentYearMin}`;
        } else {
          url += `&year=${currentYearMax}`; // Filter by upper bound or TMDB discover year
        }
      }
      
      if (currentLanguage) url += `&language=${encodeURIComponent(currentLanguage)}`;
      if (currentMinRating && currentMinRating > 0) url += `&min_rating=${currentMinRating}`;
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
      totalResultsCount = data.total_results || (data.results.length * 20);
      currentPage = page;
      updateFilterLiveResultCount(totalResultsCount);

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
      totalPages = 1;
      currentPage = 1;
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
    if (heroRating) heroRating.innerHTML = `★ ${rating}`;
    if (heroQuality) heroQuality.textContent = '4K ULTRA HD';
    if (heroYear) heroYear.textContent = year;
    if (heroTag) {
      if (currentMediaType === 'hindi') {
        heroTag.textContent = 'HINDI DUBBED · POPULAR';
      } else {
        heroTag.textContent = index === 0 ? '🔥 TRENDING #1' : `FEATURED #${index + 1}`;
      }
    }

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

    // Cineva My List / Watchlist trigger
    if (heroWatchlistBtn) {
      const inList = isItemInWatchlist(item.id);
      const iconEl = document.getElementById('hero-watchlist-icon');
      const textEl = document.getElementById('hero-watchlist-text');
      if (iconEl) iconEl.textContent = inList ? '✔' : '+';
      if (textEl) textEl.textContent = inList ? 'In List' : 'My List';
      heroWatchlistBtn.classList.toggle('in-watchlist', inList);

      heroWatchlistBtn.onclick = () => {
        const added = toggleWatchlistItem(item);
        if (iconEl) iconEl.textContent = added ? '✔' : '+';
        if (textEl) textEl.textContent = added ? 'In List' : 'My List';
        heroWatchlistBtn.classList.toggle('in-watchlist', added);
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
    const paginationBar = document.getElementById('pagination-bar');
    if (paginationBar) paginationBar.style.display = 'none';
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
    const langSuffix = currentLanguage === 'hi' ? '?lang=hi' : '';
    const slug = (title || 'watch').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'watch';
    const watchUrl = item.id ? `/${isTv ? 'tv' : 'movie'}/${item.id}-${slug}${langSuffix}` : `watch.html?id=${encodeURIComponent(item.id)}`;

    const isHindiMedia = currentMediaType === 'hindi' || item.original_language === 'hi';
    const badgeText = isHindiMedia ? 'HINDI' : (isTv ? 'TV' : 'HD');

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
          <span class="card-type-badge">${badgeText}</span>
          <span class="card-rating-badge">★ ${rating}</span>
        </a>
        <div class="movie-card-info">
          <a href="${watchUrl}" class="movie-card-title" title="${title}">${title}</a>
          <div class="movie-card-meta">
            <span>${year}</span>
            <span style="color: var(--cyan-primary); font-weight: 700;">${badgeText}</span>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
  renderPagination();
}

// Render Numbered Pagination Bar (1, 2, 3...)
function renderPagination() {
  const paginationBar = document.getElementById('pagination-bar');
  const pageNumbersContainer = document.getElementById('page-numbers');
  const prevBtn = document.getElementById('page-prev-btn');
  const nextBtn = document.getElementById('page-next-btn');

  if (!paginationBar || !pageNumbersContainer) return;

  if (!displayedItems || displayedItems.length === 0) {
    paginationBar.style.display = 'none';
    return;
  }

  // Cap maxPages to 50 for smooth UX and TMDB limits
  const maxPages = Math.min(Math.max(totalPages || 1, 1), 50);

  if (maxPages <= 1) {
    paginationBar.style.display = 'none';
    return;
  }
  paginationBar.style.display = 'flex';

  // Prev / Next button states
  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    };
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage >= maxPages;
    nextBtn.onclick = () => {
      if (currentPage < maxPages) {
        goToPage(currentPage + 1);
      }
    };
  }

  // Determine which page numbers to display
  let pages = [];
  if (maxPages <= 7) {
    for (let i = 1; i <= maxPages; i++) pages.push(i);
  } else {
    if (currentPage <= 4) {
      pages = [1, 2, 3, 4, 5, '...', maxPages];
    } else if (currentPage >= maxPages - 3) {
      pages = [1, '...', maxPages - 4, maxPages - 3, maxPages - 2, maxPages - 1, maxPages];
    } else {
      pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', maxPages];
    }
  }

  pageNumbersContainer.innerHTML = pages.map(p => {
    if (p === '...') {
      return `<span class="page-ellipsis">•••</span>`;
    }
    const isActive = p === currentPage;
    return `<button class="page-num ${isActive ? 'active' : ''}" data-page="${p}" aria-label="Page ${p}" ${isActive ? 'aria-current="page"' : ''}>${p}</button>`;
  }).join('');

  pageNumbersContainer.querySelectorAll('.page-num').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.getAttribute('data-page'), 10);
      if (target && target !== currentPage) {
        goToPage(target);
      }
    });
  });
}

function goToPage(targetPage) {
  if (targetPage < 1 || isLoading) return;
  fetchMediaData(targetPage, false);
  const targetElement = document.getElementById('catalog-title') || document.querySelector('.cineva-glass-shelf') || document.getElementById('discovery-section');
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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

// Search TMDB Media and Render Directly into Catalog Grid
async function fetchSearchMedia(query) {
  if (!query || !query.trim()) return;
  isLoading = true;
  const titleEl = document.getElementById('catalog-title');
  if (titleEl) {
    titleEl.innerHTML = `<span class="shelf-indicator"></span><span>Search Results for "${query}"</span>`;
  }

  try {
    const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      displayedItems = data.results;
      renderCatalogGrid();
    } else {
      displayedItems = [];
      renderCatalogGrid();
    }
  } catch (e) {
    console.warn('Search query error:', e);
  } finally {
    isLoading = false;
  }
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
  currentPage = 1;

  // Sync nav links & media quick tabs
  document.querySelectorAll('.nav-link-item').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-nav') === type);
  });
  document.querySelectorAll('.media-tab-pill').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-type') === type);
  });

  const titleEl = document.getElementById('catalog-title');
  if (titleEl) {
    if (type === 'hindi') {
      currentLanguage = 'hi';
      titleEl.textContent = 'Hindi Cinema';
      // Sync checkbox
      document.querySelectorAll('#mf-lang-checkboxes .mf-check-input').forEach(chk => {
        chk.checked = chk.value === 'hi';
      });
    } else if (type === 'movie') {
      titleEl.textContent = 'Popular Movies';
    } else if (type === 'tv') {
      titleEl.textContent = 'Trending TV Series';
    } else if (type === 'top-rated') {
      titleEl.textContent = 'Top Rated Cinema';
    } else if (type === 'upcoming') {
      titleEl.textContent = 'Upcoming Releases';
    } else {
      titleEl.textContent = 'Movies';
    }
  }

  updateActiveFilterSummaryRow();
  fetchMediaData(1, false);
};

// Global Select Genre Pill
window.selectGenrePill = function(genreId) {
  if (!currentGenresList.includes(genreId)) {
    currentGenresList.push(genreId);
  }
  currentGenreId = currentGenresList.join(',');
  currentPage = 1;

  document.querySelectorAll('#mf-genre-chips .mf-genre-btn').forEach(btn => {
    btn.classList.toggle('active', currentGenresList.includes(btn.getAttribute('data-genre')));
  });

  updateActiveFilterSummaryRow();
  fetchMediaData(1, false);
};

// ==========================================================================
// MASTER FILTER SYSTEM (Unified Glass 3D Controller)
// ==========================================================================

const GENRE_MAP = {
  '28': 'Action',
  '18': 'Drama',
  '35': 'Comedy',
  '53': 'Thriller',
  '878': 'Sci-Fi',
  '16': 'Animation',
  '80': 'Crime',
  '14': 'Fantasy',
  '27': 'Horror',
  '10749': 'Romance',
  '12': 'Adventure',
  '9648': 'Mystery'
};

const LANG_MAP = {
  'hi': 'Hindi',
  'en': 'English',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'kn': 'Kannada',
  'ko': 'Korean',
  'ja': 'Japanese',
  'es': 'Spanish'
};

let filterLiveDebounceTimer = null;

// Live result count helper
function updateFilterLiveResultCount(count) {
  const badgeEl = document.getElementById('catalog-results-count');
  if (badgeEl) {
    if (typeof count === 'number' && count > 0) {
      badgeEl.textContent = `${count.toLocaleString()} results`;
    } else {
      badgeEl.textContent = '0 results';
    }
  }
}

// URL Query String Sync (Persist filters across reloads & back/forward navigation)
function syncFiltersToUrl() {
  try {
    const url = new URL(window.location.href);
    if (currentMediaType && currentMediaType !== 'trending') {
      url.searchParams.set('type', currentMediaType);
    } else {
      url.searchParams.delete('type');
    }

    if (currentGenresList && currentGenresList.length > 0) {
      url.searchParams.set('genres', currentGenresList.join(','));
    } else {
      url.searchParams.delete('genres');
    }

    if (currentLanguage) {
      url.searchParams.set('lang', currentLanguage);
    } else {
      url.searchParams.delete('lang');
    }

    if (currentYearMin > 1990 || currentYearMax < 2026) {
      url.searchParams.set('year_min', currentYearMin);
      url.searchParams.set('year_max', currentYearMax);
    } else {
      url.searchParams.delete('year_min');
      url.searchParams.delete('year_max');
    }

    if (currentMinRating > 0) {
      url.searchParams.set('min_rating', currentMinRating);
    } else {
      url.searchParams.delete('min_rating');
    }

    if (currentSort && currentSort !== 'popularity.desc') {
      url.searchParams.set('sort', currentSort);
    } else {
      url.searchParams.delete('sort');
    }

    window.history.replaceState({}, '', url.toString());
  } catch (err) {
    console.warn('URL sync failed:', err);
  }
}

// Update Active Filters Count Badges and Summary Row
function updateActiveFilterSummaryRow() {
  const bar = document.getElementById('master-active-filters-bar');
  const container = document.getElementById('active-chips-container');
  const triggerBadge = document.getElementById('master-filter-badge');
  const headerBadge = document.getElementById('mf-header-badge');

  const activeChips = [];

  // 1. Genres
  if (currentGenresList && currentGenresList.length > 0) {
    currentGenresList.forEach(gid => {
      activeChips.push({
        label: `${GENRE_MAP[gid] || gid}`,
        clear: () => {
          currentGenresList = currentGenresList.filter(id => id !== gid);
          currentGenreId = currentGenresList.join(',');
          const chip = document.querySelector(`#mf-genre-chips .mf-genre-btn[data-genre="${gid}"]`);
          if (chip) chip.classList.remove('active');
          applyFiltersLive();
        }
      });
    });
  }

  // 2. Language
  if (currentLanguage) {
    const langs = currentLanguage.split(',').filter(Boolean);
    langs.forEach(l => {
      activeChips.push({
        label: `${LANG_MAP[l] || l}`,
        clear: () => {
          const remaining = langs.filter(x => x !== l);
          currentLanguage = remaining.join(',');
          document.querySelectorAll('#mf-lang-checkboxes .mf-check-input').forEach(chk => {
            if (chk.value === l) chk.checked = false;
          });
          applyFiltersLive();
        }
      });
    });
  }

  // 3. Year Range
  if (currentYearMin > 1990 || currentYearMax < 2026) {
    activeChips.push({
      label: `${currentYearMin}-${currentYearMax}`,
      clear: () => {
        currentYearMin = 1990;
        currentYearMax = 2026;
        const minInp = document.getElementById('mf-year-min');
        const maxInp = document.getElementById('mf-year-max');
        if (minInp) minInp.value = 1990;
        if (maxInp) maxInp.value = 2026;
        applyFiltersLive();
      }
    });
  }

  // 4. Rating
  if (currentMinRating > 0) {
    activeChips.push({
      label: `★ ${currentMinRating}+`,
      clear: () => {
        currentMinRating = 0;
        const rSlider = document.getElementById('mf-rating-slider');
        if (rSlider) rSlider.value = 0;
        updateRatingSliderUI();
        applyFiltersLive();
      }
    });
  }

  // 5. Non-default sort
  if (currentSort && currentSort !== 'popularity.desc') {
    const sortLabels = {
      'vote_average.desc': 'Top Rated',
      'primary_release_date.desc': 'Newest',
      'title.asc': 'A-Z'
    };
    activeChips.push({
      label: `Sort: ${sortLabels[currentSort] || currentSort}`,
      clear: () => {
        currentSort = 'popularity.desc';
        const sortSel = document.getElementById('mf-sort-select');
        if (sortSel) sortSel.value = 'popularity.desc';
        applyFiltersLive();
      }
    });
  }

  const activeCount = activeChips.length;

  // Badges on Trigger Button and Header
  if (triggerBadge) {
    triggerBadge.textContent = activeCount;
    triggerBadge.style.display = activeCount > 0 ? 'inline-block' : 'none';
  }
  if (headerBadge) {
    headerBadge.textContent = activeCount;
    headerBadge.style.display = activeCount > 0 ? 'inline-block' : 'none';
  }

  // Render Summary Row below Navbar
  if (bar && container) {
    if (activeCount === 0) {
      bar.style.display = 'none';
      container.innerHTML = '';
    } else {
      bar.style.display = 'flex';
      container.innerHTML = activeChips.map((chip, idx) => `
        <span class="summary-chip" data-chip-idx="${idx}">
          <span>${chip.label}</span>
          <button type="button" class="summary-chip-remove" aria-label="Remove filter">&times;</button>
        </span>
      `).join('');

      container.querySelectorAll('.summary-chip').forEach(el => {
        const idx = parseInt(el.getAttribute('data-chip-idx'), 10);
        el.addEventListener('click', () => {
          if (activeChips[idx] && typeof activeChips[idx].clear === 'function') {
            activeChips[idx].clear();
          }
        });
      });
    }
  }

  syncFiltersToUrl();
}

// Live apply function debounced 300ms
function applyFiltersLive() {
  clearTimeout(filterLiveDebounceTimer);
  filterLiveDebounceTimer = setTimeout(() => {
    currentPage = 1;

    // Update Catalog Title
    const titleEl = document.getElementById('catalog-title');
    if (titleEl) {
      if (currentMediaType === 'hindi' || currentLanguage === 'hi') {
        titleEl.textContent = 'Hindi Cinema';
      } else if (currentMediaType === 'tv') {
        titleEl.textContent = 'TV Series';
      } else if (currentMediaType === 'top-rated') {
        titleEl.textContent = 'Top Rated';
      } else if (currentGenresList.length > 0) {
        const names = currentGenresList.map(g => GENRE_MAP[g]).filter(Boolean).join(', ');
        titleEl.textContent = names;
      } else {
        titleEl.textContent = 'Movies';
      }
    }

    updateActiveFilterSummaryRow();
    fetchMediaData(1, false);
  }, 300);
}

// Single Rating Slider UI calculation
function updateRatingSliderUI() {
  const slider = document.getElementById('mf-rating-slider');
  const display = document.getElementById('mf-rating-val-display');
  if (!slider || !display) return;

  const val = parseFloat(slider.value);
  currentMinRating = val;

  if (val <= 0) {
    display.textContent = 'Any rating';
  } else {
    display.textContent = `★ ${val.toFixed(1)}+`;
  }
}

// Master Filter Main Controller Initialization
function initMasterFilterComponent() {
  const triggerBtn = document.getElementById('master-filter-trigger');
  const panel = document.getElementById('master-filter-panel');
  const scrim = document.getElementById('master-filter-scrim');
  const closeBtn = document.getElementById('master-filter-close');
  const resetBtn = document.getElementById('btn-mf-reset');
  const resetBottomBtn = document.getElementById('btn-mf-reset-bottom');
  const applyBtn = document.getElementById('btn-mf-apply');
  const clearSummaryBtn = document.getElementById('btn-clear-all-summary');

  if (!panel) return;

  // OPEN PANEL (MOBILE / TABLET)
  function openPanel() {
    panel.classList.add('active');
    if (scrim) scrim.classList.add('active');
    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    if (scrim) scrim.setAttribute('aria-hidden', 'false');
  }

  // CLOSE PANEL (MOBILE / TABLET)
  function closePanel() {
    panel.classList.remove('active');
    if (scrim) scrim.classList.remove('active');
    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.setAttribute('aria-hidden', 'true');
    if (triggerBtn) triggerBtn.focus();
  }

  if (triggerBtn) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel.classList.contains('active')) {
        closePanel();
      } else {
        openPanel();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closePanel);
  if (scrim) scrim.addEventListener('click', closePanel);

  // 1. MEDIA QUICK TABS (Trending Now, Hindi Cinema, Movies, TV Series, Top Rated, Upcoming)
  const mediaTabs = document.querySelectorAll('#catalog-media-tabs .media-tab-pill');
  mediaTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.getAttribute('data-type');
      window.switchMediaType(type);
    });
  });

  // 2. SEARCH BY TITLE INPUT
  const searchInput = document.getElementById('mf-title-search');
  if (searchInput) {
    let titleSearchDebounce = null;
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(titleSearchDebounce);
      titleSearchDebounce = setTimeout(() => {
        if (q.length > 0) {
          fetchSearchMedia(q);
        } else {
          fetchMediaData(1, false);
        }
      }, 350);
    });
  }

  // 3. SORT SELECT DROPDOWN
  const sortSelect = document.getElementById('mf-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFiltersLive();
    });
  }

  // 4. GENRE MULTI-SELECT BUTTONS
  const genreButtons = document.querySelectorAll('#mf-genre-chips .mf-genre-btn');
  genreButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gid = btn.getAttribute('data-genre');
      const idx = currentGenresList.indexOf(gid);
      if (idx > -1) {
        currentGenresList.splice(idx, 1);
        btn.classList.remove('active');
      } else {
        currentGenresList.push(gid);
        btn.classList.add('active');
      }
      currentGenreId = currentGenresList.join(',');
      applyFiltersLive();
    });
  });

  // 5. AUDIO LANGUAGE CHECKBOXES
  const langCheckboxes = document.querySelectorAll('#mf-lang-checkboxes .mf-check-input');
  langCheckboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      const checkedVals = Array.from(langCheckboxes)
        .filter(c => c.checked)
        .map(c => c.value);
      currentLanguage = checkedVals.join(',');
      applyFiltersLive();
    });
  });

  // 6. RELEASE YEAR INPUTS
  const yearMinInp = document.getElementById('mf-year-min');
  const yearMaxInp = document.getElementById('mf-year-max');
  if (yearMinInp && yearMaxInp) {
    const handleYearChange = () => {
      let minVal = parseInt(yearMinInp.value, 10) || 1970;
      let maxVal = parseInt(yearMaxInp.value, 10) || 2026;
      if (minVal > maxVal) {
        const tmp = minVal;
        minVal = maxVal;
        maxVal = tmp;
      }
      currentYearMin = minVal;
      currentYearMax = maxVal;
      applyFiltersLive();
    };
    yearMinInp.addEventListener('change', handleYearChange);
    yearMaxInp.addEventListener('change', handleYearChange);
  }

  // 7. MINIMUM RATING SLIDER
  const ratingSlider = document.getElementById('mf-rating-slider');
  if (ratingSlider) {
    ratingSlider.addEventListener('input', () => {
      updateRatingSliderUI();
      applyFiltersLive();
    });
    updateRatingSliderUI();
  }

  // RESET BUTTONS
  [resetBtn, resetBottomBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        resetAllFilters();
      });
    }
  });

  // APPLY BUTTON ("Apply filters" -> closes panel on mobile, refreshes media)
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      closePanel();
      fetchMediaData(1, false);
      const shelf = document.getElementById('catalog-title') || document.querySelector('.catalog-layout-container');
      if (shelf) shelf.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // CLEAR ALL SUMMARY LINK
  if (clearSummaryBtn) {
    clearSummaryBtn.addEventListener('click', () => {
      resetAllFilters();
    });
  }

  // Restore filters from URL parameters on startup
  restoreFiltersFromUrl();
  updateActiveFilterSummaryRow();
}

// Restore state from URL query parameters
function restoreFiltersFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type');
  const genresParam = urlParams.get('genres') || urlParams.get('genre');
  const langParam = urlParams.get('lang');
  const yearMinParam = urlParams.get('year_min');
  const yearMaxParam = urlParams.get('year_max');
  const ratingParam = urlParams.get('min_rating');
  const sortParam = urlParams.get('sort');

  if (typeParam) {
    currentMediaType = typeParam;
    document.querySelectorAll('#catalog-media-tabs .media-tab-pill').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-type') === typeParam);
    });
  }

  if (genresParam) {
    currentGenresList = genresParam.split(',').filter(Boolean);
    currentGenreId = currentGenresList.join(',');
    currentGenresList.forEach(gid => {
      const btn = document.querySelector(`#mf-genre-chips .mf-genre-btn[data-genre="${gid}"]`);
      if (btn) btn.classList.add('active');
    });
  }

  if (langParam) {
    currentLanguage = langParam;
    const selectedLangs = langParam.split(',').filter(Boolean);
    document.querySelectorAll('#mf-lang-checkboxes .mf-check-input').forEach(chk => {
      chk.checked = selectedLangs.includes(chk.value);
    });
  }

  if (yearMinParam || yearMaxParam) {
    const minVal = parseInt(yearMinParam || '2020', 10);
    const maxVal = parseInt(yearMaxParam || '2026', 10);
    const minInp = document.getElementById('mf-year-min');
    const maxInp = document.getElementById('mf-year-max');
    if (minInp) minInp.value = minVal;
    if (maxInp) maxInp.value = maxVal;
    currentYearMin = minVal;
    currentYearMax = maxVal;
  }

  if (ratingParam) {
    const rVal = parseFloat(ratingParam);
    const rSlider = document.getElementById('mf-rating-slider');
    if (rSlider) rSlider.value = rVal;
    updateRatingSliderUI();
  }

  if (sortParam) {
    currentSort = sortParam;
    const sortSelect = document.getElementById('mf-sort-select');
    if (sortSelect) sortSelect.value = sortParam;
  }
}

// 1-Click Complete Reset
window.resetAllFilters = function() {
  currentMediaType = 'trending';
  currentLanguage = '';
  currentGenreId = '';
  currentGenresList = [];
  currentYear = '';
  currentYearMin = 1990;
  currentYearMax = 2026;
  currentMinRating = 0;
  currentSort = 'popularity.desc';
  currentPage = 1;

  // Reset UI controls
  document.querySelectorAll('#catalog-media-tabs .media-tab-pill').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-type') === 'trending');
  });

  document.querySelectorAll('#mf-genre-chips .mf-genre-btn').forEach(b => b.classList.remove('active'));

  document.querySelectorAll('#mf-lang-checkboxes .mf-check-input').forEach(c => {
    c.checked = false;
  });

  const searchInput = document.getElementById('mf-title-search');
  if (searchInput) searchInput.value = '';

  const sortSelect = document.getElementById('mf-sort-select');
  if (sortSelect) sortSelect.value = 'popularity.desc';

  const yearMinInp = document.getElementById('mf-year-min');
  const yearMaxInp = document.getElementById('mf-year-max');
  if (yearMinInp) yearMinInp.value = 2020;
  if (yearMaxInp) yearMaxInp.value = 2026;

  const rSlider = document.getElementById('mf-rating-slider');
  if (rSlider) rSlider.value = 0;
  updateRatingSliderUI();

  const titleEl = document.getElementById('catalog-title');
  if (titleEl) titleEl.textContent = 'Movies';

  updateActiveFilterSummaryRow();
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
  initMasterFilterComponent();

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
