// Admin Dashboard Logic (Hybrid: Supports both Node.js Backend & Static Deployment)

let currentAdminPin = sessionStorage.getItem('cinestream_admin_pin') || '';
let adminMovies = [];
let adminSettings = {};
let editingMovieId = null;
let isStaticMode = false;

// Auth check
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
        isStaticMode = false;
        hideLoginLock();
        loadAdminData();
        return;
      }
    }
    
    // If response is 404/not ok, it's likely a static site (e.g. Render Static Site)
    throw new Error('API unavailable, attempting static mode authentication');
  } catch (err) {
    console.warn('Backend API not responding; checking static admin credentials...', err);
    // Static mode fallback
    const savedPin = localStorage.getItem('cinestream_admin_pin') || '1234';
    if (String(currentAdminPin) === String(savedPin)) {
      isStaticMode = true;
      hideLoginLock();
      showStaticModeBanner();
      loadAdminData();
    } else {
      sessionStorage.removeItem('cinestream_admin_pin');
      currentAdminPin = '';
      showLoginLock('Invalid PIN. Please try again (Default: 1234)');
    }
  }
}

function showStaticModeBanner() {
  let banner = document.getElementById('static-mode-notice');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'static-mode-notice';
    banner.style.cssText = 'background: rgba(245, 197, 24, 0.15); border: 1px solid var(--accent-gold); color: #fff; padding: 12px 18px; border-radius: var(--radius-sm); margin-bottom: 20px; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 12px;';
    banner.innerHTML = `
      <div>
        <strong style="color: var(--accent-gold);">⚡ Static Site Mode Detected:</strong> 
        You deployed as a Static Site. Changes you make here are saved directly in your browser. 
        For full cloud server database persistence, deploy as a <strong>Render Web Service</strong>.
      </div>
      <button onclick="exportDataFiles()" class="btn-sponsor" style="font-size: 0.75rem; padding: 6px 12px;">Export Data JSON</button>
    `;
    const container = document.getElementById('admin-main-content');
    if (container) {
      container.insertBefore(banner, container.children[1]);
    }
  }
}

window.exportDataFiles = function() {
  const blob = new Blob([JSON.stringify(adminMovies, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'movies.json';
  a.click();
};

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

// Load data
async function loadAdminData() {
  await loadMovies();
  await loadSettings();
}

async function loadMovies() {
  // Check localStorage first if in static mode
  const localSaved = localStorage.getItem('cinestream_movies');
  if (localSaved && isStaticMode) {
    try {
      adminMovies = JSON.parse(localSaved);
      renderMoviesTable();
      updateMetrics();
      return;
    } catch (e) {}
  }

  try {
    const res = await fetch('/api/movies');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.movies) {
        adminMovies = data.movies;
        renderMoviesTable();
        updateMetrics();
        return;
      }
    }
    throw new Error('API movies endpoint unavailable');
  } catch (e) {
    // Fallback to static movies.json
    try {
      const fallbackRes = await fetch('data/movies.json');
      const fallbackData = await fallbackRes.json();
      if (Array.isArray(fallbackData)) {
        adminMovies = fallbackData;
        renderMoviesTable();
        updateMetrics();
      }
    } catch (err2) {
      console.error('Error fetching static movies.json:', err2);
    }
  }
}

async function loadSettings() {
  const localSettings = localStorage.getItem('cinestream_settings');
  if (localSettings && isStaticMode) {
    try {
      adminSettings = JSON.parse(localSettings);
      populateSettingsForm();
      updateMetrics();
      return;
    } catch (e) {}
  }

  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.settings) {
        adminSettings = data.settings;
        populateSettingsForm();
        updateMetrics();
        return;
      }
    }
    throw new Error('API settings unavailable');
  } catch (e) {
    try {
      const fallbackRes = await fetch('data/settings.json');
      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData.monetization) {
        adminSettings = fallbackData;
        populateSettingsForm();
        updateMetrics();
      }
    } catch (err2) {
      console.error('Error loading fallback settings:', err2);
    }
  }
}

// Update Top Metric Cards
function updateMetrics() {
  const countEl = document.getElementById('metric-total-movies');
  const impEl = document.getElementById('metric-impressions');
  const clicksEl = document.getElementById('metric-clicks');
  const earningsEl = document.getElementById('metric-earnings');

  if (countEl) countEl.textContent = adminMovies.length;

  const analytics = adminSettings.analytics || { totalImpressions: 2854, totalClicks: 195, estimatedEarnings: 10.57 };
  if (impEl) impEl.textContent = (analytics.totalImpressions || 2854).toLocaleString();
  if (clicksEl) clicksEl.textContent = (analytics.totalClicks || 195).toLocaleString();
  if (earningsEl) earningsEl.textContent = `$${(analytics.estimatedEarnings || 10.57).toFixed(2)}`;
}

// Render Movies Table
function renderMoviesTable() {
  const tbody = document.getElementById('movies-table-body');
  if (!tbody) return;

  if (adminMovies.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">No movies found.</td></tr>`;
    return;
  }

  let html = '';
  adminMovies.forEach(m => {
    html += `
      <tr>
        <td>
          <img src="${m.poster}" alt="${m.title}" class="table-movie-thumb" />
        </td>
        <td>
          <div class="table-movie-title">${m.title}</div>
          <div class="table-movie-meta">${m.genres ? m.genres.join(', ') : ''}</div>
        </td>
        <td>${m.year}</td>
        <td><span style="color:var(--accent-gold); font-weight:700;">★ ${m.rating}</span></td>
        <td><span class="card-badge-quality">${m.quality || 'HD'}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-action-edit" onclick="openEditMovieModal('${m.id}')">Edit</button>
            <button class="btn-action-delete" onclick="deleteMovie('${m.id}', '${m.title.replace(/'/g, "\\'")}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// Populate Settings Form
function populateSettingsForm() {
  const m = adminSettings.monetization || {};

  // Pre-roll
  const pr = m.preRoll || {};
  document.getElementById('set-preroll-enabled').checked = Boolean(pr.enabled);
  document.getElementById('set-preroll-duration').value = pr.duration || 6;
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

  // Custom Script
  document.getElementById('set-custom-script').value = m.customScript || '';
}

// Save Settings
async function saveSettings(e) {
  if (e) e.preventDefault();
  const alertEl = document.getElementById('settings-status-alert');

  const payload = {
    monetization: {
      preRoll: {
        enabled: document.getElementById('set-preroll-enabled').checked,
        duration: Number(document.getElementById('set-preroll-duration').value) || 6,
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
      customScript: document.getElementById('set-custom-script').value
    }
  };

  const newPin = document.getElementById('set-new-pin').value.trim();
  if (newPin && newPin.length >= 4) {
    payload.adminPin = newPin;
    currentAdminPin = newPin;
    sessionStorage.setItem('cinestream_admin_pin', newPin);
    localStorage.setItem('cinestream_admin_pin', newPin);
    document.getElementById('set-new-pin').value = '';
  }

  // If running in static site mode
  if (isStaticMode) {
    adminSettings = { ...adminSettings, ...payload };
    localStorage.setItem('cinestream_settings', JSON.stringify(adminSettings));
    alertEl.style.display = 'block';
    alertEl.style.color = '#00e676';
    alertEl.textContent = 'Settings and Ads updated successfully in browser!';
    setTimeout(() => alertEl.style.display = 'none', 3500);
    return;
  }

  // Server API mode
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
      alertEl.style.color = '#00e676';
      alertEl.textContent = 'Settings and Monetization updated successfully!';
      setTimeout(() => alertEl.style.display = 'none', 3500);
      loadSettings();
    } else {
      throw new Error(data.message || 'Server error');
    }
  } catch (err) {
    // Fallback save locally
    adminSettings = { ...adminSettings, ...payload };
    localStorage.setItem('cinestream_settings', JSON.stringify(adminSettings));
    alertEl.style.display = 'block';
    alertEl.style.color = '#00e676';
    alertEl.textContent = 'Settings saved locally (Static Mode)!';
    setTimeout(() => alertEl.style.display = 'none', 3500);
  }
}

// Add / Edit Movie Modal Handlers
window.openAddMovieModal = function() {
  editingMovieId = null;
  document.getElementById('movie-modal-title').textContent = 'Add New Movie';
  document.getElementById('movie-form').reset();
  document.getElementById('movie-modal').classList.add('active');
};

window.openEditMovieModal = function(movieId) {
  const m = adminMovies.find(x => x.id === movieId);
  if (!m) return;
  editingMovieId = movieId;

  document.getElementById('movie-modal-title').textContent = 'Edit Movie';
  document.getElementById('movie-title-input').value = m.title || '';
  document.getElementById('movie-year-input').value = m.year || 2024;
  document.getElementById('movie-rating-input').value = m.rating || 8.0;
  document.getElementById('movie-quality-input').value = m.quality || '1080p FULL HD';
  document.getElementById('movie-duration-input').value = m.duration || '1h 30m';
  document.getElementById('movie-genres-input').value = m.genres ? m.genres.join(', ') : '';
  document.getElementById('movie-desc-input').value = m.description || '';
  document.getElementById('movie-poster-input').value = m.poster || '';
  document.getElementById('movie-backdrop-input').value = m.backdrop || '';

  const s1 = m.servers?.find(s => s.type === 'video');
  const s2 = m.servers?.find(s => s.type === 'embed');
  document.getElementById('movie-videourl-input').value = s1 ? s1.url : '';
  document.getElementById('movie-embedurl-input').value = s2 ? s2.url : '';
  document.getElementById('movie-featured-input').checked = Boolean(m.featured);
  document.getElementById('movie-trending-input').checked = Boolean(m.trending);

  document.getElementById('movie-modal').classList.add('active');
};

window.closeMovieModal = function() {
  document.getElementById('movie-modal').classList.remove('active');
};

// Save Movie (Create or Update)
async function saveMovie(e) {
  e.preventDefault();

  const title = document.getElementById('movie-title-input').value.trim();
  const year = Number(document.getElementById('movie-year-input').value);
  const rating = Number(document.getElementById('movie-rating-input').value);
  const quality = document.getElementById('movie-quality-input').value.trim();
  const duration = document.getElementById('movie-duration-input').value.trim();
  const genres = document.getElementById('movie-genres-input').value.split(',').map(g => g.trim()).filter(Boolean);
  const description = document.getElementById('movie-desc-input').value.trim();
  const poster = document.getElementById('movie-poster-input').value.trim();
  const backdrop = document.getElementById('movie-backdrop-input').value.trim();
  const videoUrl = document.getElementById('movie-videourl-input').value.trim();
  const embedUrl = document.getElementById('movie-embedurl-input').value.trim();
  const featured = document.getElementById('movie-featured-input').checked;
  const trending = document.getElementById('movie-trending-input').checked;

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

  // Static site mode save
  if (isStaticMode) {
    if (editingMovieId) {
      const idx = adminMovies.findIndex(x => x.id === editingMovieId);
      if (idx !== -1) {
        adminMovies[idx] = {
          ...adminMovies[idx],
          ...payload,
          servers: [
            { name: 'Server 1 (HD)', type: 'video', url: videoUrl || adminMovies[idx].servers[0]?.url },
            { name: 'Server 2 (Embed)', type: 'embed', url: embedUrl || '' }
          ]
        };
      }
    } else {
      const newId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
      adminMovies.unshift({
        id: newId,
        ...payload,
        servers: [
          { name: 'Server 1 (HD)', type: 'video', url: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
          { name: 'Server 2 (Embed)', type: 'embed', url: embedUrl || '' }
        ]
      });
    }
    localStorage.setItem('cinestream_movies', JSON.stringify(adminMovies));
    closeMovieModal();
    renderMoviesTable();
    updateMetrics();
    return;
  }

  // Server API mode
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
      closeMovieModal();
      loadMovies();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    // Fallback save in static mode
    isStaticMode = true;
    saveMovie(e);
  }
}

// Delete Movie
window.deleteMovie = async function(movieId, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

  if (isStaticMode) {
    adminMovies = adminMovies.filter(m => m.id !== movieId);
    localStorage.setItem('cinestream_movies', JSON.stringify(adminMovies));
    renderMoviesTable();
    updateMetrics();
    return;
  }

  try {
    const res = await fetch(`/api/movies/${movieId}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': currentAdminPin }
    });
    const data = await res.json();
    if (data.success) {
      loadMovies();
    } else {
      throw new Error(data.message);
    }
  } catch (err) {
    adminMovies = adminMovies.filter(m => m.id !== movieId);
    localStorage.setItem('cinestream_movies', JSON.stringify(adminMovies));
    renderMoviesTable();
    updateMetrics();
  }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Login lock form
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = document.getElementById('admin-pin-input').value.trim();
      currentAdminPin = pin;
      sessionStorage.setItem('cinestream_admin_pin', pin);
      checkAuth();
    });
  }

  // Tabs switching
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const paneId = tab.getAttribute('data-tab');
      document.getElementById(paneId).classList.add('active');
    });
  });

  // Settings form submit
  const settingsForm = document.getElementById('monetization-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', saveSettings);
  }

  // Movie form submit
  const movieForm = document.getElementById('movie-form');
  if (movieForm) {
    movieForm.addEventListener('submit', saveMovie);
  }

  // Logout
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('cinestream_admin_pin');
      currentAdminPin = '';
      showLoginLock();
    });
  }

  checkAuth();
});
