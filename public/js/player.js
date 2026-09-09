// Watch Room & Video Player Logic

let currentMovie = null;
let currentServerIndex = 0;
let prerollTimer = null;
let prerollSecondsLeft = 6;
let prerollSkipAllowed = false;

// Get movie ID from URL
function getMovieIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || 'tears-of-steel';
}

// Fetch Movie Details (with static fallback)
async function loadWatchRoom() {
  const movieId = getMovieIdFromUrl();
  try {
    const res = await fetch(`/api/movies/${encodeURIComponent(movieId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.movie) {
      currentMovie = data.movie;
      document.title = `${currentMovie.title} - Watch Free on CineStream`;
      renderMovieDetails(currentMovie);
      renderRelatedMovies(data.related || []);
      setupServers(currentMovie.servers || []);
      initPrerollAd();
      return;
    }
  } catch (err) {
    console.warn('API single movie failed, falling back to static data/movies.json...', err);
    try {
      const fallbackRes = await fetch('data/movies.json');
      const fallbackMovies = await fallbackRes.json();
      const movie = fallbackMovies.find(m => m.id === movieId);
      if (movie) {
        currentMovie = movie;
        document.title = `${currentMovie.title} - Watch Free on CineStream`;
        renderMovieDetails(currentMovie);
        const related = fallbackMovies.filter(m => m.id !== movie.id).slice(0, 5);
        renderRelatedMovies(related);
        setupServers(currentMovie.servers || []);
        initPrerollAd();
        return;
      }
    } catch (e2) {
      console.error('Failed static fallback in watch room:', e2);
    }
    document.getElementById('video-stage').innerHTML = `
      <div style="padding: 60px; text-align: center; color: #fff;">
        <h2>Movie Not Found</h2>
        <p style="color: var(--text-muted); margin: 12px 0 20px;">The requested movie does not exist or has been removed.</p>
        <a href="index.html" class="btn-primary" style="display: inline-flex;">Back to Home</a>
      </div>
    `;
  }
}

// Render Movie Info
function renderMovieDetails(movie) {
  const titleEl = document.getElementById('watch-title');
  const ratingEl = document.getElementById('watch-rating');
  const qualityEl = document.getElementById('watch-quality');
  const yearEl = document.getElementById('watch-year');
  const durationEl = document.getElementById('watch-duration');
  const genresEl = document.getElementById('watch-genres');
  const descEl = document.getElementById('watch-desc');

  if (titleEl) titleEl.textContent = movie.title;
  if (ratingEl) ratingEl.innerHTML = `★ ${movie.rating ? movie.rating.toFixed(1) : '8.5'}`;
  if (qualityEl) qualityEl.textContent = movie.quality || 'HD 1080p';
  if (yearEl) yearEl.textContent = movie.year || '2024';
  if (durationEl) durationEl.textContent = movie.duration || 'Feature';
  if (genresEl) genresEl.textContent = movie.genres ? movie.genres.join(' • ') : 'Action';
  if (descEl) descEl.textContent = movie.description;
}

// Render Related Movies in Sidebar
function renderRelatedMovies(relatedList) {
  const listEl = document.getElementById('sidebar-movies-list');
  if (!listEl) return;

  if (relatedList.length === 0) {
    listEl.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No related titles right now.</p>`;
    return;
  }

  let html = '';
  relatedList.forEach(m => {
    html += `
      <a href="watch.html?id=${encodeURIComponent(m.id)}" class="sidebar-movie-item">
        <div class="sidebar-movie-thumb">
          <img src="${m.poster}" alt="${m.title}" loading="lazy" />
        </div>
        <div class="sidebar-movie-info">
          <h5>${m.title}</h5>
          <div class="meta">
            <span style="color: var(--accent-gold);">★ ${m.rating ? m.rating.toFixed(1) : '8.0'}</span> • ${m.year}
          </div>
        </div>
      </a>
    `;
  });
  listEl.innerHTML = html;
}

// Setup Multi-Server Switching
function setupServers(servers) {
  const container = document.getElementById('servers-list');
  if (!container) return;

  if (servers.length === 0) {
    servers = [{ name: 'Server 1 (HD)', type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }];
  }

  let html = '';
  servers.forEach((s, idx) => {
    html += `
      <button class="server-btn ${idx === 0 ? 'active' : ''}" onclick="switchServer(${idx})">
        ${s.name || `Server ${idx + 1}`}
      </button>
    `;
  });
  container.innerHTML = html;
  loadStreamSource(servers[0]);
}

window.switchServer = function(index) {
  if (!currentMovie || !currentMovie.servers) return;
  const servers = currentMovie.servers;
  if (!servers[index]) return;

  currentServerIndex = index;
  document.querySelectorAll('.server-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === index);
  });

  loadStreamSource(servers[index]);
};

function loadStreamSource(server) {
  const videoEl = document.getElementById('main-video-player');
  const iframeEl = document.getElementById('main-iframe-player');

  if (server.type === 'embed') {
    videoEl.pause();
    videoEl.style.display = 'none';
    iframeEl.style.display = 'block';
    iframeEl.src = server.url;
  } else {
    iframeEl.src = '';
    iframeEl.style.display = 'none';
    videoEl.style.display = 'block';
    videoEl.src = server.url;
    videoEl.load();
  }
}

// Pre-Roll Ad Implementation
async function initPrerollAd() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    const prerollConfig = data?.settings?.monetization?.preRoll;

    const overlay = document.getElementById('preroll-overlay');
    if (!overlay) return;

    if (!prerollConfig || !prerollConfig.enabled) {
      overlay.classList.add('hidden');
      startMoviePlayback();
      return;
    }

    // Populate Pre-roll data
    const titleEl = document.getElementById('preroll-sponsor-title');
    const descEl = document.getElementById('preroll-sponsor-desc');
    const ctaBtn = document.getElementById('preroll-cta-btn');
    const timerText = document.getElementById('preroll-timer-text');
    const skipBtn = document.getElementById('preroll-skip-btn');

    if (titleEl) titleEl.textContent = prerollConfig.sponsorTitle || 'Sponsor Promotion';
    if (descEl) descEl.textContent = prerollConfig.sponsorDescription || 'Exclusive deal for stream viewers!';
    if (ctaBtn) {
      ctaBtn.textContent = prerollConfig.ctaText || 'Learn More →';
      ctaBtn.href = prerollConfig.sponsorUrl || 'https://www.expressvpn.com';
      ctaBtn.onclick = () => {
        if (window.AdsManager) AdsManager.trackClick();
      };
    }

    prerollSecondsLeft = prerollConfig.duration || 6;
    prerollSkipAllowed = false;

    if (skipBtn) {
      skipBtn.classList.remove('ready');
      skipBtn.textContent = `Skip Ad in ${prerollSecondsLeft}s`;
      skipBtn.onclick = null;
    }

    if (timerText) {
      timerText.textContent = `Video begins in ${prerollSecondsLeft}s`;
    }

    // Log impression for video ad
    if (window.AdsManager) AdsManager.trackImpression();

    // Start Countdown
    if (prerollTimer) clearInterval(prerollTimer);
    prerollTimer = setInterval(() => {
      prerollSecondsLeft--;

      if (prerollSecondsLeft > 0) {
        if (timerText) timerText.textContent = `Video begins in ${prerollSecondsLeft}s`;
        if (skipBtn) skipBtn.textContent = `Skip Ad in ${prerollSecondsLeft}s`;
      } else {
        clearInterval(prerollTimer);
        prerollSkipAllowed = true;
        if (timerText) timerText.textContent = `Ad completed. Enjoy your movie!`;
        if (skipBtn) {
          skipBtn.classList.add('ready');
          skipBtn.textContent = `Skip Ad \u25B6`;
          skipBtn.onclick = () => {
            endPrerollAndPlay();
          };
        }
        // Auto start after 1 additional second
        setTimeout(() => {
          endPrerollAndPlay();
        }, 1200);
      }
    }, 1000);

  } catch (e) {
    console.error('Error initializing preroll ad:', e);
    const overlay = document.getElementById('preroll-overlay');
    if (overlay) overlay.classList.add('hidden');
    startMoviePlayback();
  }
}

function endPrerollAndPlay() {
  if (prerollTimer) clearInterval(prerollTimer);
  const overlay = document.getElementById('preroll-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.opacity = '1';
      startMoviePlayback();
    }, 300);
  } else {
    startMoviePlayback();
  }
}

function startMoviePlayback() {
  const video = document.getElementById('main-video-player');
  if (video && video.style.display !== 'none') {
    video.play().catch(e => {
      // Autoplay with sound might be blocked by browser policy; user clicks play
      console.log('Autoplay deferred for user interaction:', e);
    });
  }
}

// Cinema Mode (Lights Off)
window.toggleCinemaMode = function() {
  document.body.classList.toggle('cinema-mode');
  const btn = document.getElementById('cinema-toggle-btn');
  if (btn) {
    const isCinema = document.body.classList.contains('cinema-mode');
    btn.innerHTML = isCinema 
      ? `<span>💡 Lights On</span>` 
      : `<span>🌙 Cinema Mode</span>`;
  }
};

// Fullscreen
window.toggleFullscreen = function() {
  const container = document.getElementById('video-stage');
  if (!container) return;

  if (!document.fullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadWatchRoom();
});
