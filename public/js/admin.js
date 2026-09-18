// Movie redx - Admin Control Suite Logic

let currentAdminPin = sessionStorage.getItem('movieredx_admin_pin') || '';
let adminMovies = [];
let adminSettings = {};
let editingMovieId = null;

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// Check Auth on Page Load
async function checkAuth() {
  if (!currentAdminPin) {
    showLoginLock();
    return;
  }

  try {
    const res = await fetch('/api/verify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: currentAdminPin })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        hideLoginLock();
        loadAllAdminData();
        return;
      }
    }
    throw new Error('PIN invalid');
  } catch (err) {
    sessionStorage.removeItem('movieredx_admin_pin');
    currentAdminPin = '';
    showLoginLock('Invalid PIN. Please try again (Default: 8084)');
  }
}

function showLoginLock(errMsg = '') {
  document.getElementById('admin-lock-screen').style.display = 'block';
  document.getElementById('admin-main-content').style.display = 'none';
  const errEl = document.getElementById('admin-login-error');
  if (errEl) {
    errEl.textContent = errMsg;
    errEl.style.display = errMsg ? 'block' : 'none';
  }
}

function hideLoginLock() {
  document.getElementById('admin-lock-screen').style.display = 'none';
  document.getElementById('admin-main-content').style.display = 'block';
}

// Load All Data
async function loadAllAdminData() {
  await Promise.all([loadAdminMovies(), loadAdminSettings()]);
  updateMetrics();
}

async function loadAdminMovies() {
  try {
    const res = await fetch('/api/movies');
    const data = await res.json();
    if (data.success && data.movies) {
      adminMovies = data.movies;
      renderAdminMoviesTable();
    }
  } catch (err) {
    console.error('Failed to load movies for admin:', err);
  }
}

async function loadAdminSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      adminSettings = data.settings;
      populateSettingsForms();
      renderStreamingServersEditor();
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Update Top Metrics
function updateMetrics() {
  const totalMoviesEl = document.getElementById('metric-total-movies');
  const impEl = document.getElementById('metric-impressions');
  const earnEl = document.getElementById('metric-earnings');

  if (totalMoviesEl) totalMoviesEl.textContent = adminMovies.length;

  const analytics = adminSettings.analytics || { totalImpressions: 3420, estimatedEarnings: 12.48 };
  if (impEl) impEl.textContent = (analytics.totalImpressions || 3420).toLocaleString();
  if (earnEl) earnEl.textContent = `$${(analytics.estimatedEarnings || 12.48).toFixed(2)}`;
}

// --- TMDB 1-CLICK IMPORTER ---
window.searchTmdbToImport = async function() {
  const input = document.getElementById('tmdb-import-search-input');
  const container = document.getElementById('tmdb-search-results');
  if (!input || !container) return;

  const query = input.value.trim();
  if (!query) return;

  container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-muted);">Searching TMDB for "${query}"...</div>`;

  try {
    const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      let html = '';
      data.results.slice(0, 12).forEach(item => {
        const title = item.title || item.name || 'Untitled';
        const isTv = item.media_type === 'tv' || Boolean(item.name);
        const releaseDate = item.release_date || item.first_air_date || '';
        const year = releaseDate ? releaseDate.split('-')[0] : '2024';
        const rating = (item.vote_average || 8.0).toFixed(1);
        const posterUrl = item.poster_path ? TMDB_IMG_BASE + item.poster_path : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300';
        const backdropUrl = item.backdrop_path ? TMDB_BACKDROP_BASE + item.backdrop_path : '';

        // Check if already in curated catalog
        const isCurated = adminMovies.some(m => String(m.tmdbId) === String(item.id) || m.id === `tmdb-${item.id}`);

        html += `
          <div class="tmdb-import-card">
            <img src="${posterUrl}" alt="${title}" class="tmdb-import-thumb" />
            <div class="tmdb-import-info">
              <div>
                <h5>${title}</h5>
                <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:8px;">
                  <span style="color:var(--accent-gold);">★ ${rating}</span> • <span>${year}</span> • <span>${isTv ? 'TV' : 'MOVIE'}</span>
                </div>
              </div>
              <div style="display:flex; flex-direction:column; gap:6px;">
                <button class="btn-play-hero" style="font-size:0.75rem; padding:6px 10px; border-radius:4px; justify-content:center;" onclick="importTmdbTitle(${item.id}, '${title.replace(/'/g, "\\'")}', '${isTv ? 'tv' : 'movie'}', '${posterUrl}', '${backdropUrl}', ${rating}, '${year}', false)">
                  ${isCurated ? '✔ In Catalog' : '+ Add to Catalog'}
                </button>
                <button class="btn-trailer-hero" style="font-size:0.72rem; padding:4px 8px; border-radius:4px; justify-content:center;" onclick="importTmdbTitle(${item.id}, '${title.replace(/'/g, "\\'")}', '${isTv ? 'tv' : 'movie'}', '${posterUrl}', '${backdropUrl}', ${rating}, '${year}', true)">
                  ⭐ Feature on Hero Banner
                </button>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-muted);">No TMDB results found for "${query}".</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #ff4b55;">Error querying TMDB: ${err.message}</div>`;
  }
};

window.importTmdbTitle = async function(tmdbId, title, mediaType, poster, backdrop, rating, year, isFeatured) {
  try {
    const res = await fetch('/api/movies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': currentAdminPin
      },
      body: JSON.stringify({
        tmdbId,
        mediaType,
        title,
        year: Number(year) || 2024,
        rating: Number(rating) || 8.0,
        quality: '4K ULTRA HD',
        poster,
        backdrop,
        featured: isFeatured,
        trending: true,
        genres: ['Action', 'Cinema']
      })
    });

    const data = await res.json();
    if (data.success) {
      alert(`"${title}" has been successfully imported to Movie redx catalog!`);
      loadAdminMovies();
      updateMetrics();
    } else {
      alert('Error saving movie: ' + data.message);
    }
  } catch (err) {
    alert('Failed to import movie: ' + err.message);
  }
};

// --- CURATED MOVIES TABLE ---
function renderAdminMoviesTable() {
  const tbody = document.getElementById('admin-movies-tbody');
  if (!tbody) return;

  if (adminMovies.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:var(--text-muted);">No curated titles yet. Use the TMDB Importer or Add Custom Stream button above!</td></tr>';
    return;
  }

  let html = '';
  adminMovies.forEach(m => {
    html += `
      <tr>
        <td>
          <img src="${m.poster}" alt="${m.title}" style="width:40px; height:58px; object-fit:cover; border-radius:4px;" />
        </td>
        <td>
          <div style="font-weight:700; color:#fff;">${m.title}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary);">${m.genres ? m.genres.join(', ') : ''}</div>
        </td>
        <td>${m.year || 2024}</td>
        <td><span style="color:var(--accent-gold); font-weight:700;">★ ${m.rating}</span></td>
        <td>${m.featured ? '<span class="badge-redx" style="font-size:0.65rem;">HERO BANNER</span>' : '<span style="color:var(--text-muted); font-size:0.75rem;">Standard</span>'}</td>
        <td>
          <div style="display:flex; gap:8px;">
            <button class="player-action-btn" style="padding:4px 8px; font-size:0.75rem;" onclick="openEditCustomMovieModal('${m.id}')">Edit</button>
            <button class="player-action-btn" style="padding:4px 8px; font-size:0.75rem; color:#ff4b55; border-color:rgba(255,75,85,0.3);" onclick="deleteMovie('${m.id}', '${m.title.replace(/'/g, "\\'")}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// Open Add Custom Movie Modal
window.openAddMovieModal = function() {
  editingMovieId = null;
  document.getElementById('admin-movie-modal-title').textContent = 'Add Custom Movie / Stream';
  document.getElementById('admin-custom-movie-form').reset();
  document.getElementById('admin-movie-modal').classList.add('active');
};

// Open Edit Custom Movie Modal
window.openEditCustomMovieModal = function(id) {
  const m = adminMovies.find(x => x.id === id);
  if (!m) return;
  editingMovieId = id;

  document.getElementById('admin-movie-modal-title').textContent = 'Edit Movie';
  document.getElementById('cust-title').value = m.title || '';
  document.getElementById('cust-year').value = m.year || 2024;
  document.getElementById('cust-rating').value = m.rating || 8.0;
  document.getElementById('cust-quality').value = m.quality || '4K ULTRA HD';
  document.getElementById('cust-duration').value = m.duration || '1h 45m';
  document.getElementById('cust-genres').value = m.genres ? m.genres.join(', ') : '';
  document.getElementById('cust-desc').value = m.description || '';
  document.getElementById('cust-poster').value = m.poster || '';
  document.getElementById('cust-backdrop').value = m.backdrop || '';

  const s1 = m.servers?.find(s => s.type === 'video');
  const s2 = m.servers?.find(s => s.type === 'embed');
  document.getElementById('cust-videourl').value = s1 ? s1.url : '';
  document.getElementById('cust-embedurl').value = s2 ? s2.url : '';
  document.getElementById('cust-featured').checked = Boolean(m.featured);
  document.getElementById('cust-trending').checked = Boolean(m.trending);

  document.getElementById('admin-movie-modal').classList.add('active');
};

window.closeAdminMovieModal = function() {
  document.getElementById('admin-movie-modal').classList.remove('active');
};

// Save Custom Movie Handler
async function saveCustomMovie(e) {
  e.preventDefault();

  const title = document.getElementById('cust-title').value.trim();
  const year = Number(document.getElementById('cust-year').value);
  const rating = Number(document.getElementById('cust-rating').value);
  const quality = document.getElementById('cust-quality').value.trim();
  const duration = document.getElementById('cust-duration').value.trim();
  const genres = document.getElementById('cust-genres').value.split(',').map(g => g.trim()).filter(Boolean);
  const description = document.getElementById('cust-desc').value.trim();
  const poster = document.getElementById('cust-poster').value.trim();
  const backdrop = document.getElementById('cust-backdrop').value.trim();
  const videoUrl = document.getElementById('cust-videourl').value.trim();
  const embedUrl = document.getElementById('cust-embedurl').value.trim();
  const featured = document.getElementById('cust-featured').checked;
  const trending = document.getElementById('cust-trending').checked;

  const payload = {
    title,
    year,
    rating,
    quality,
    duration,
    genres,
    description,
    poster,
    backdrop,
    videoUrl,
    embedUrl,
    featured,
    trending
  };

  const url = editingMovieId ? `/api/movies/${editingMovieId}` : '/api/movies';
  const method = editingMovieId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': currentAdminPin
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      closeAdminMovieModal();
      loadAdminMovies();
      updateMetrics();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    alert('Failed to save: ' + err.message);
  }
}

// Delete Movie Handler
window.deleteMovie = async function(id, title) {
  if (!confirm(`Are you sure you want to delete "${title}" from curated catalog?`)) return;

  try {
    const res = await fetch(`/api/movies/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': currentAdminPin }
    });
    const data = await res.json();
    if (data.success) {
      loadAdminMovies();
      updateMetrics();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Error deleting: ' + err.message);
  }
};

// --- STREAMING SERVERS EDITOR ---
function renderStreamingServersEditor() {
  const container = document.getElementById('servers-list-inputs');
  if (!container) return;

  const servers = adminSettings.streamServers || [
    { id: 'vidsrc', name: 'Server 1 (VidSrc Fast HD)', movieTemplate: 'https://vidsrc.to/embed/movie/{id}', tvTemplate: 'https://vidsrc.to/embed/tv/{id}/{s}/{e}' },
    { id: 'vidlink', name: 'Server 2 (VidLink Ultra 4K)', movieTemplate: 'https://vidlink.pro/movie/{id}', tvTemplate: 'https://vidlink.pro/tv/{id}/{s}/{e}' },
    { id: 'twoembed', name: 'Server 3 (2Embed Multi-Sub)', movieTemplate: 'https://www.2embed.cc/embed/{id}', tvTemplate: 'https://www.2embed.cc/embedtv/{id}&s={s}&e={e}' },
    { id: 'autoembed', name: 'Server 4 (AutoEmbed Player)', movieTemplate: 'https://player.autoembed.cc/embed/movie/{id}', tvTemplate: 'https://player.autoembed.cc/embed/tv/{id}/{s}/{e}' }
  ];

  let html = '';
  servers.forEach((s, idx) => {
    html += `
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-glass); border-radius:var(--radius-sm); padding:14px; margin-bottom:12px;">
        <div style="font-weight:700; color:#fff; margin-bottom:8px;">Stream Provider #${idx + 1}</div>
        <div class="form-grid-2">
          <div class="form-group">
            <label>Server Display Name</label>
            <input type="text" class="form-input server-name-input" value="${s.name}" required>
          </div>
          <div class="form-group">
            <label>Provider ID</label>
            <input type="text" class="form-input server-id-input" value="${s.id}" required>
          </div>
          <div class="form-group full">
            <label>Movie Embed Template ({id} = TMDB ID)</label>
            <input type="text" class="form-input server-movie-input" value="${s.movieTemplate}" required>
          </div>
          <div class="form-group full">
            <label>TV Show Embed Template ({id} = TMDB ID, {s} = Season, {e} = Episode)</label>
            <input type="text" class="form-input server-tv-input" value="${s.tvTemplate || ''}">
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Save Streaming Servers
async function saveStreamingServers(e) {
  e.preventDefault();

  const nameInputs = document.querySelectorAll('.server-name-input');
  const idInputs = document.querySelectorAll('.server-id-input');
  const movieInputs = document.querySelectorAll('.server-movie-input');
  const tvInputs = document.querySelectorAll('.server-tv-input');

  const updatedServers = [];
  for (let i = 0; i < nameInputs.length; i++) {
    updatedServers.push({
      id: idInputs[i].value.trim(),
      name: nameInputs[i].value.trim(),
      movieTemplate: movieInputs[i].value.trim(),
      tvTemplate: tvInputs[i].value.trim(),
      type: 'embed'
    });
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': currentAdminPin
      },
      body: JSON.stringify({ streamServers: updatedServers })
    });

    const data = await res.json();
    if (data.success) {
      alert('Streaming Servers updated successfully!');
      loadAdminSettings();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Error saving servers: ' + err.message);
  }
}

// --- MONETIZATION & ADS ---
function populateSettingsForms() {
  const m = adminSettings.monetization || {};

  // Pre-roll
  const pr = m.preRoll || {};
  document.getElementById('set-preroll-enabled').checked = Boolean(pr.enabled);
  document.getElementById('set-preroll-duration').value = pr.duration || 5;
  document.getElementById('set-preroll-title').value = pr.sponsorTitle || '';
  document.getElementById('set-preroll-desc').value = pr.sponsorDescription || '';
  document.getElementById('set-preroll-url').value = pr.sponsorUrl || '';
  document.getElementById('set-preroll-cta').value = pr.ctaText || '';

  // Top Banner
  const bt = m.bannerTop || {};
  document.getElementById('set-bannertop-enabled').checked = Boolean(bt.enabled);
  document.getElementById('set-bannertop-html').value = bt.html || '';

  // Sidebar Banner
  const bs = m.bannerSidebar || {};
  document.getElementById('set-bannersidebar-enabled').checked = Boolean(bs.enabled);
  document.getElementById('set-bannersidebar-html').value = bs.html || '';

  // Player Bottom Banner
  const bp = m.bannerPlayerBottom || {};
  document.getElementById('set-bannerplayer-enabled').checked = Boolean(bp.enabled);
  document.getElementById('set-bannerplayer-html').value = bp.html || '';

  // Adsterra Dedicated Units
  const adst = m.adsterra || {};
  const elSocial = document.getElementById('set-adsterra-socialbar');
  const elPop = document.getElementById('set-adsterra-popunder');
  const elLead = document.getElementById('set-adsterra-leaderboard');
  const elSide = document.getElementById('set-adsterra-sidebar');
  const elDirect = document.getElementById('set-adsterra-directlink');
  if (elSocial) elSocial.value = adst.socialBarScript || '';
  if (elPop) elPop.value = adst.popunderScript || '';
  if (elLead) elLead.value = adst.leaderboardCode || '';
  if (elSide) elSide.value = adst.sidebarCode || '';
  if (elDirect) elDirect.value = adst.directLinkUrl || '';

  // Custom Script
  document.getElementById('set-custom-script').value = m.customScript || '';

  // TMDB Key & Site Name
  if (adminSettings.tmdbApiKey) {
    document.getElementById('set-tmdb-key').value = adminSettings.tmdbApiKey;
  }
  if (adminSettings.siteName) {
    document.getElementById('set-site-name').value = adminSettings.siteName;
  }
}

// Save Monetization Settings
async function saveMonetization(e) {
  e.preventDefault();
  const alertEl = document.getElementById('monetization-alert');

  const payload = {
    monetization: {
      preRoll: {
        enabled: document.getElementById('set-preroll-enabled').checked,
        duration: Number(document.getElementById('set-preroll-duration').value) || 5,
        sponsorTitle: document.getElementById('set-preroll-title').value.trim(),
        sponsorDescription: document.getElementById('set-preroll-desc').value.trim(),
        sponsorUrl: document.getElementById('set-preroll-url').value.trim(),
        ctaText: document.getElementById('set-preroll-cta').value.trim()
      },
      bannerTop: {
        enabled: document.getElementById('set-bannertop-enabled').checked,
        html: document.getElementById('set-bannertop-html').value
      },
      bannerSidebar: {
        enabled: document.getElementById('set-bannersidebar-enabled').checked,
        html: document.getElementById('set-bannersidebar-html').value
      },
      bannerPlayerBottom: {
        enabled: document.getElementById('set-bannerplayer-enabled').checked,
        html: document.getElementById('set-bannerplayer-html').value
      },
      adsterra: {
        enabled: true,
        socialBarScript: document.getElementById('set-adsterra-socialbar') ? document.getElementById('set-adsterra-socialbar').value.trim() : '',
        popunderScript: document.getElementById('set-adsterra-popunder') ? document.getElementById('set-adsterra-popunder').value.trim() : '',
        leaderboardCode: document.getElementById('set-adsterra-leaderboard') ? document.getElementById('set-adsterra-leaderboard').value.trim() : '',
        sidebarCode: document.getElementById('set-adsterra-sidebar') ? document.getElementById('set-adsterra-sidebar').value.trim() : '',
        directLinkUrl: document.getElementById('set-adsterra-directlink') ? document.getElementById('set-adsterra-directlink').value.trim() : ''
      },
      customScript: document.getElementById('set-custom-script').value
    }
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': currentAdminPin
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      alertEl.style.display = 'block';
      alertEl.textContent = 'Monetization and Ad placements saved successfully!';
      setTimeout(() => alertEl.style.display = 'none', 3500);
      loadAdminSettings();
    }
  } catch (err) {
    alert('Error saving ads: ' + err.message);
  }
}

// Test TMDB Connection
window.testTmdbConnection = async function() {
  const key = document.getElementById('set-tmdb-key').value.trim();
  if (!key) {
    alert('Please enter a TMDB API Key first.');
    return;
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${key}&page=1`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      alert(`✅ TMDB API Connection Successful! Successfully connected to The Movie Database.`);
    } else {
      alert(`❌ TMDB API Error: ${data.status_message || 'Invalid API Key'}`);
    }
  } catch (err) {
    alert('❌ Connection failed: ' + err.message);
  }
};

// Save General Settings
async function saveGeneralSettings(e) {
  e.preventDefault();

  const tmdbApiKey = document.getElementById('set-tmdb-key').value.trim();
  const siteName = document.getElementById('set-site-name').value.trim();
  const newPin = document.getElementById('set-new-pin').value.trim();

  const payload = {};
  if (tmdbApiKey) payload.tmdbApiKey = tmdbApiKey;
  if (siteName) payload.siteName = siteName;
  if (newPin && newPin.length >= 4) {
    payload.adminPin = newPin;
    currentAdminPin = newPin;
    sessionStorage.setItem('movieredx_admin_pin', newPin);
    document.getElementById('set-new-pin').value = '';
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': currentAdminPin
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      alert('Settings & Security updated successfully!');
      loadAdminSettings();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Failed to save settings: ' + err.message);
  }
}

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  // Login form
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = document.getElementById('admin-pin-input').value.trim();
      currentAdminPin = pin;
      sessionStorage.setItem('movieredx_admin_pin', pin);
      checkAuth();
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('movieredx_admin_pin');
      currentAdminPin = '';
      showLoginLock();
    });
  }

  // Tabs switching
  document.querySelectorAll('.admin-nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-pane').forEach(p => p.style.display = 'none');

      tab.classList.add('active');
      const targetPane = document.getElementById(tab.getAttribute('data-tab'));
      if (targetPane) targetPane.style.display = 'block';
    });
  });

  // Forms
  const customMovieForm = document.getElementById('admin-custom-movie-form');
  if (customMovieForm) customMovieForm.addEventListener('submit', saveCustomMovie);

  const serversForm = document.getElementById('servers-config-form');
  if (serversForm) serversForm.addEventListener('submit', saveStreamingServers);

  const monetizationForm = document.getElementById('admin-monetization-form');
  if (monetizationForm) monetizationForm.addEventListener('submit', saveMonetization);

  const settingsForm = document.getElementById('admin-settings-form');
  if (settingsForm) settingsForm.addEventListener('submit', saveGeneralSettings);

  checkAuth();
});
