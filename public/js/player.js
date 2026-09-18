// Movie redx - Streaming Player & Watch Room Logic

let currentMedia = null;
let currentMediaType = 'movie'; // 'movie' or 'tv'
let currentTmdbId = null;
let currentCustomId = null;
let currentSeason = 1;
let currentEpisode = 1;
let currentServerIndex = 0;
let availableServers = [];
let prerollTimer = null;
let prerollSecondsLeft = 5;

const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const TMDB_AVATAR_BASE = 'https://image.tmdb.org/t/p/w185';
const CONTINUE_WATCHING_KEY = 'movieredx_continue_watching';
const WATCHLIST_KEY = 'movieredx_watchlist';

// Default Fallback Streaming Embed Servers
const DEFAULT_SERVERS = [
  // 🌐 Global High-Speed Streaming Servers (First)
  {
    id: 'vidsrc',
    name: 'Server 1',
    movieTemplate: 'https://vidsrc.to/embed/movie/{id}',
    tvTemplate: 'https://vidsrc.to/embed/tv/{id}/{s}/{e}',
    type: 'embed'
  },
  {
    id: 'vidlink',
    name: 'Server 2',
    movieTemplate: 'https://vidlink.pro/movie/{id}',
    tvTemplate: 'https://vidlink.pro/tv/{id}/{s}/{e}',
    type: 'embed'
  },
  {
    id: 'twoembed',
    name: 'Server 3',
    movieTemplate: 'https://www.2embed.cc/embed/{id}',
    tvTemplate: 'https://www.2embed.cc/embedtv/{id}&s={s}&e={e}',
    type: 'embed'
  },
  {
    id: 'autoembed',
    name: 'Server 4',
    movieTemplate: 'https://player.autoembed.cc/embed/movie/{id}',
    tvTemplate: 'https://player.autoembed.cc/embed/tv/{id}/{s}/{e}',
    type: 'embed'
  },
  {
    id: 'smashystream',
    name: 'Server 5',
    movieTemplate: 'https://embed.smashystream.com/playere.php?tmdb={id}',
    tvTemplate: 'https://embed.smashystream.com/playere.php?tmdb={id}&season={s}&episode={e}',
    type: 'embed'
  },
  {
    id: 'moviesapi',
    name: 'Server 6',
    movieTemplate: 'https://moviesapi.club/movie/{id}',
    tvTemplate: 'https://moviesapi.club/tv/{id}-{s}-{e}',
    type: 'embed'
  },

  // 🇮🇳 Working Dedicated Hindi & Multi-Audio Streaming Servers (In Last)
  {
    id: 'multiembed_hindi',
    name: 'Server 1 (Hindi)',
    movieTemplate: 'https://multiembed.mov/?video_id={id}&tmdb=1',
    tvTemplate: 'https://multiembed.mov/?video_id={id}&tmdb=1&s={s}&e={e}',
    type: 'embed',
    lang: 'hi'
  },
  {
    id: 'vidlink_hindi',
    name: 'Server 2 (Hindi)',
    movieTemplate: 'https://vidlink.pro/movie/{id}?primaryLang=hi&info=false&autoplay=true',
    tvTemplate: 'https://vidlink.pro/tv/{id}/{s}/{e}?primaryLang=hi&info=false&autoplay=true',
    type: 'embed',
    lang: 'hi'
  }
];

let currentLangParam = ''; // 'hi' or ''

// Parse URL Parameters
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const tmdbParam = params.get('tmdb');
  const typeParam = params.get('type') || 'movie';
  const idParam = params.get('id');
  const seasonParam = parseInt(params.get('s'), 10) || 1;
  const episodeParam = parseInt(params.get('e'), 10) || 1;
  const langParam = params.get('lang') || '';

  currentTmdbId = tmdbParam;
  currentMediaType = typeParam;
  currentCustomId = idParam;
  currentSeason = seasonParam;
  currentEpisode = episodeParam;
  currentLangParam = langParam;

  if (!currentTmdbId && !currentCustomId) {
    // Default fallback to popular movie (e.g. Fight Club / Inception)
    currentTmdbId = '550';
  }
}

// Initialize Watch Room
async function initWatchRoom() {
  parseUrlParams();
  await loadServerConfigs();

  // If lang=hi in URL, auto-select first Hindi server
  if (currentLangParam === 'hi') {
    const hindiIdx = availableServers.findIndex(s => s.lang === 'hi');
    if (hindiIdx >= 0) currentServerIndex = hindiIdx;
  }

  if (currentTmdbId) {
    await loadTmdbMedia(currentTmdbId, currentMediaType);
  } else if (currentCustomId) {
    await loadCustomMedia(currentCustomId);
  }

  initPrerollAd();
}

function sortServersGlobalFirst(servers) {
  const globals = [];
  const hindis = [];
  servers.forEach(s => {
    const isHindi = s.lang === 'hi' || /hindi/i.test(s.id) || /hindi/i.test(s.name);
    if (isHindi) {
      hindis.push(s);
    } else {
      globals.push(s);
    }
  });
  return [...globals, ...hindis];
}

// Load Stream Servers from Settings
async function loadServerConfigs() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings && Array.isArray(data.settings.streamServers) && data.settings.streamServers.length > 0) {
      availableServers = sortServersGlobalFirst(data.settings.streamServers);
      return;
    }
  } catch (e) {
    console.warn('Using default stream server templates:', e);
  }
  availableServers = sortServersGlobalFirst(DEFAULT_SERVERS);
}


// Fetch TMDB Media (Movie or TV Show)
async function loadTmdbMedia(id, type) {
  try {
    const endpoint = type === 'tv' ? `/api/tmdb/tv/${id}` : `/api/tmdb/movie/${id}`;
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const media = type === 'tv' ? data.tv : data.movie;
    currentMedia = media;

    // Document Title
    const title = media.title || media.name || 'Movie';
    document.title = `${title} - Watch Free on MOVIE REDX`;

    // Render metadata & cast
    renderMediaInfo(media, type);
    renderCast(media.cast || []);
    renderSimilar(media.similar || [], type);

    // If TV show, setup seasons and episodes
    if (type === 'tv' && media.seasons) {
      setupTvShowPanel(media);
    }

    // Setup servers
    renderServerButtons();
    loadActiveStreamServer();

    // Save to Continue Watching
    saveContinueWatchingProgress(media, type);

  } catch (err) {
    console.error('Failed to load TMDB media:', err);
    // Try fallback
    loadCustomMedia(id);
  }
}

// Fetch Local / Custom Media
async function loadCustomMedia(id) {
  try {
    const res = await fetch(`/api/movies/${encodeURIComponent(id)}`);
    const data = await res.json();
    if (data.success && data.movie) {
      currentMedia = data.movie;
      document.title = `${currentMedia.title} - Watch Free on MOVIE REDX`;
      renderMediaInfo(currentMedia, 'movie');
      renderSimilar(data.related || [], 'movie');

      if (currentMedia.servers && currentMedia.servers.length > 0) {
        availableServers = currentMedia.servers;
      }
      renderServerButtons();
      loadActiveStreamServer();
      saveContinueWatchingProgress(currentMedia, 'movie');
    }
  } catch (err) {
    console.error('Failed to load custom media:', err);
  }
}

// Render Media Info
function renderMediaInfo(media, type) {
  const titleEl = document.getElementById('media-title');
  const ratingEl = document.getElementById('media-rating');
  const qualityEl = document.getElementById('media-quality');
  const yearEl = document.getElementById('media-year');
  const runtimeEl = document.getElementById('media-runtime');
  const genresEl = document.getElementById('media-genres');
  const synopsisEl = document.getElementById('media-synopsis');
  const watchlistBtn = document.getElementById('media-watchlist-btn');
  const trailerBtn = document.getElementById('watch-trailer-trigger');

  const title = media.title || media.name || 'Untitled';
  const releaseDate = media.release_date || media.first_air_date || (media.year ? String(media.year) : '2024');
  const year = releaseDate ? releaseDate.split('-')[0] : '2024';
  const rating = (media.vote_average || media.rating || 8.5).toFixed(1);

  let runtime = '1h 45m';
  if (media.runtime) {
    const hrs = Math.floor(media.runtime / 60);
    const mins = media.runtime % 60;
    runtime = `${hrs > 0 ? hrs + 'h ' : ''}${mins}m`;
  } else if (media.episode_run_time && media.episode_run_time.length > 0) {
    runtime = `${media.episode_run_time[0]}m / ep`;
  } else if (media.duration) {
    runtime = media.duration;
  }

  let genres = 'Action, Cinema';
  if (media.genres && Array.isArray(media.genres)) {
    genres = media.genres.map(g => typeof g === 'object' ? g.name : g).join(' • ');
  }

  if (titleEl) titleEl.textContent = title;
  if (ratingEl) ratingEl.innerHTML = `★ ${rating} TMDB`;
  if (qualityEl) qualityEl.textContent = media.quality || '4K ULTRA HD';
  if (yearEl) yearEl.textContent = year;
  if (runtimeEl) runtimeEl.textContent = runtime;
  if (genresEl) genresEl.textContent = genres;
  if (synopsisEl) synopsisEl.textContent = media.overview || media.description || 'Enjoy watching in full HD quality with fast streaming servers.';

  // Watchlist button
  if (watchlistBtn) {
    const inList = isItemInWatchlist(media.id);
    watchlistBtn.textContent = inList ? '✔' : '+';
    watchlistBtn.style.background = inList ? 'var(--primary)' : 'rgba(255,255,255,0.1)';

    watchlistBtn.onclick = () => {
      let list = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
      const exists = list.some(x => String(x.id) === String(media.id));
      if (exists) {
        list = list.filter(x => String(x.id) !== String(media.id));
        watchlistBtn.textContent = '+';
        watchlistBtn.style.background = 'rgba(255,255,255,0.1)';
      } else {
        list.unshift({
          id: media.id,
          title,
          poster_path: media.poster_path,
          poster: media.poster,
          vote_average: media.vote_average || media.rating || 8.0,
          release_date: releaseDate,
          media_type: type
        });
        watchlistBtn.textContent = '✔';
        watchlistBtn.style.background = 'var(--primary)';
      }
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    };
  }

  // Trailer button
  if (trailerBtn) {
    trailerBtn.onclick = () => {
      const trailer = media.videos?.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || media.videos?.[0];
      const modal = document.getElementById('trailer-modal');
      const iframe = document.getElementById('trailer-iframe');
      const modalTitle = document.getElementById('trailer-title');

      if (modal && iframe) {
        if (modalTitle) modalTitle.textContent = `${title} — Official Trailer`;
        if (trailer && trailer.key) {
          iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
        } else {
          iframe.src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(title + ' official trailer')}&autoplay=1`;
        }
        modal.classList.add('active');
      }
    };
  }
}

function isItemInWatchlist(id) {
  try {
    const list = JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
    return list.some(x => String(x.id) === String(id));
  } catch (e) {
    return false;
  }
}

// Render Cast Carousel
function renderCast(castList) {
  const scroller = document.getElementById('cast-scroller');
  const section = document.getElementById('cast-section');
  if (!scroller || !section) return;

  if (!castList || castList.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  let html = '';
  castList.slice(0, 12).forEach(person => {
    const avatarUrl = person.profile_path ? TMDB_AVATAR_BASE + person.profile_path : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    html += `
      <div class="cast-card">
        <img src="${avatarUrl}" alt="${person.name}" class="cast-avatar" loading="lazy" />
        <div class="cast-name" title="${person.name}">${person.name}</div>
        <div class="cast-character" title="${person.character || ''}">${person.character || 'Cast'}</div>
      </div>
    `;
  });
  scroller.innerHTML = html;
}

// Render Similar / Recommended in Sidebar
function renderSimilar(similarList, type) {
  const container = document.getElementById('sidebar-recommendations');
  if (!container) return;

  if (!similarList || similarList.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.82rem;">No recommendations available.</p>';
    return;
  }

  let html = '';
  similarList.slice(0, 8).forEach(item => {
    const title = item.title || item.name || 'Movie';
    const releaseDate = item.release_date || item.first_air_date || (item.year ? String(item.year) : '2024');
    const year = releaseDate ? releaseDate.split('-')[0] : '2024';
    const rating = (item.vote_average || item.rating || 8.0).toFixed(1);
    const posterUrl = item.poster_path ? TMDB_IMG_BASE + item.poster_path : (item.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200');
    const isTv = type === 'tv' || Boolean(item.name);
    const watchUrl = item.id ? `watch.html?tmdb=${item.id}${isTv ? '&type=tv' : ''}` : `watch.html?id=${encodeURIComponent(item.id)}`;

    html += `
      <a href="${watchUrl}" class="sidebar-item">
        <img src="${posterUrl}" alt="${title}" class="sidebar-thumb" loading="lazy" />
        <div class="sidebar-info">
          <h5>${title}</h5>
          <div class="sidebar-meta">
            <span style="color:var(--accent-gold);">★ ${rating}</span> • <span>${year}</span>
          </div>
        </div>
      </a>
    `;
  });
  container.innerHTML = html;
}

// TV Series Panel & Episode Grid
function setupTvShowPanel(media) {
  const panel = document.getElementById('tv-panel');
  const seasonSelect = document.getElementById('season-selector');
  if (!panel || !seasonSelect) return;

  panel.style.display = 'block';

  // Populate Seasons
  const validSeasons = (media.seasons || []).filter(s => s.season_number > 0);
  seasonSelect.innerHTML = '';

  validSeasons.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.season_number;
    opt.textContent = `Season ${s.season_number} (${s.episode_count} eps)`;
    if (s.season_number === currentSeason) opt.selected = true;
    seasonSelect.appendChild(opt);
  });

  seasonSelect.onchange = (e) => {
    currentSeason = parseInt(e.target.value, 10);
    currentEpisode = 1;
    updateEpisodeGrid(currentSeason);
    loadActiveStreamServer();
    updateUrlParams();
  };

  updateEpisodeGrid(currentSeason);
}

function updateEpisodeGrid(seasonNum) {
  const grid = document.getElementById('episodes-grid');
  const label = document.getElementById('episode-count-label');
  if (!grid || !currentMedia) return;

  const currentSeasonData = currentMedia.seasons?.find(s => s.season_number === seasonNum);
  const totalEps = currentSeasonData?.episode_count || 12;

  if (label) label.textContent = `Season ${seasonNum} • ${totalEps} Episodes`;

  let html = '';
  for (let ep = 1; ep <= totalEps; ep++) {
    const isActive = ep === currentEpisode;
    html += `
      <button class="episode-btn ${isActive ? 'active' : ''}" onclick="selectEpisode(${seasonNum}, ${ep})">
        E${ep}
      </button>
    `;
  }
  grid.innerHTML = html;
}

window.selectEpisode = function(seasonNum, epNum) {
  currentSeason = seasonNum;
  currentEpisode = epNum;

  document.querySelectorAll('.episode-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', (idx + 1) === epNum);
  });

  loadActiveStreamServer();
  updateUrlParams();
  if (currentMedia) saveContinueWatchingProgress(currentMedia, currentMediaType);
};

function updateUrlParams() {
  const url = new URL(window.location);
  if (currentTmdbId) url.searchParams.set('tmdb', currentTmdbId);
  if (currentMediaType === 'tv') {
    url.searchParams.set('type', 'tv');
    url.searchParams.set('s', currentSeason);
    url.searchParams.set('e', currentEpisode);
  }
  window.history.replaceState({}, '', url);
}

// Server Switcher Buttons
function renderServerButtons() {
  const container = document.getElementById('stream-servers-list');
  if (!container) return;

  let globalCounter = 0;
  let hindiCounter = 0;

  let html = '';
  availableServers.forEach((server, idx) => {
    let displayName = '';
    const isHindi = server.lang === 'hi' || /hindi/i.test(server.id) || /hindi/i.test(server.name);
    
    if (isHindi) {
      hindiCounter++;
      displayName = `Server ${hindiCounter} (Hindi)`;
    } else {
      globalCounter++;
      displayName = `Server ${globalCounter}`;
    }

    html += `
      <button class="server-btn ${idx === currentServerIndex ? 'active' : ''} ${isHindi ? 'server-hindi-btn' : ''}" onclick="switchStreamServer(${idx})" title="Stream on ${displayName}">
        ${displayName}
      </button>
    `;
  });
  container.innerHTML = html;
}

window.switchStreamServer = function(index) {
  if (!availableServers[index]) return;
  currentServerIndex = index;

  document.querySelectorAll('.server-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === index);
  });

  loadActiveStreamServer();
};

window.switchNextServer = function() {
  if (!availableServers || availableServers.length <= 1) return;
  const nextIdx = (currentServerIndex + 1) % availableServers.length;
  switchStreamServer(nextIdx);
};

// Web Audio API & Volume Booster
let audioContext = null;
let audioGainNode = null;
let currentVolumeBoostLevel = 1; // 1 = Normal (100%), 2 = 200%, 3 = 300%

window.boostAudioVolume = function() {
  const btn = document.getElementById('volume-boost-btn');
  const videoEl = document.getElementById('html5-video-player');

  // Cycle boost level: 1 -> 2 -> 3 -> 1
  if (currentVolumeBoostLevel === 1) {
    currentVolumeBoostLevel = 2;
  } else if (currentVolumeBoostLevel === 2) {
    currentVolumeBoostLevel = 3;
  } else {
    currentVolumeBoostLevel = 1;
  }

  const boostLabel = currentVolumeBoostLevel === 1 ? '🔊 Boost Volume (+200%)' : (currentVolumeBoostLevel === 2 ? '🔊 Boosted 200% 🔥' : '🔊 Maximum 300% ⚡');
  if (btn) btn.innerHTML = `<span>${boostLabel}</span>`;

  // If HTML5 video is active, apply Web Audio Gain
  if (videoEl && videoEl.style.display !== 'none') {
    try {
      if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
        const source = audioContext.createMediaElementSource(videoEl);
        audioGainNode = audioContext.createGain();
        source.connect(audioGainNode);
        audioGainNode.connect(audioContext.destination);
      }
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      if (audioGainNode) {
        audioGainNode.gain.value = currentVolumeBoostLevel === 1 ? 1.0 : (currentVolumeBoostLevel === 2 ? 2.2 : 3.5);
      }
      videoEl.volume = 1.0;
      videoEl.muted = false;
    } catch (e) {
      console.log('Audio boost note:', e.message);
    }
  } else {
    // For embedded iframe streams, remind user to un-mute inside the player and turn up volume or switch server
    if (currentVolumeBoostLevel > 1) {
      alert(`🔊 Audio Boost Active (${currentVolumeBoostLevel * 100}%): Please also ensure the sound icon inside the movie player is unmuted and your device volume is turned up! If audio remains quiet, switch to Server 2 or Server 3.`);
    }
  }
};

function loadActiveStreamServer() {
  const server = availableServers[currentServerIndex] || availableServers[0];
  if (!server) return;

  const iframeEl = document.getElementById('embed-iframe-player');
  const videoEl = document.getElementById('html5-video-player');

  // If server is direct video file
  if (server.type === 'video' && server.url) {
    if (iframeEl) {
      iframeEl.src = '';
      iframeEl.style.display = 'none';
    }
    if (videoEl) {
      videoEl.style.display = 'block';
      videoEl.src = server.url;
      videoEl.load();
    }
    return;
  }

  // Otherwise embed server
  if (videoEl) {
    videoEl.pause();
    videoEl.style.display = 'none';
  }

  if (iframeEl) {
    iframeEl.style.display = 'block';
    const tmdbId = currentTmdbId || currentCustomId || '550';
    const imdbId = currentMedia?.imdb_id || currentMedia?.external_ids?.imdb_id || tmdbId;
    let embedUrl = '';

    if (currentMediaType === 'tv') {
      const template = server.tvTemplate || server.movieTemplate || 'https://vidsrc.to/embed/tv/{id}/{s}/{e}';
      embedUrl = template
        .replace(/{id}/g, tmdbId)
        .replace(/{imdb}/g, imdbId)
        .replace(/{s}/g, currentSeason)
        .replace(/{e}/g, currentEpisode);
    } else {
      const template = server.movieTemplate || 'https://vidsrc.to/embed/movie/{id}';
      embedUrl = template
        .replace(/{id}/g, tmdbId)
        .replace(/{imdb}/g, imdbId);
    }

    iframeEl.src = embedUrl;
  }
}

// Pre-Roll Ad Logic
async function initPrerollAd() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    const prerollConfig = data?.settings?.monetization?.preRoll;

    const overlay = document.getElementById('preroll-overlay');
    if (!overlay) return;

    if (!prerollConfig || !prerollConfig.enabled) {
      overlay.classList.add('hidden');
      return;
    }

    const titleEl = document.getElementById('preroll-title');
    const descEl = document.getElementById('preroll-desc');
    const ctaBtn = document.getElementById('preroll-cta');
    const timerText = document.getElementById('preroll-timer');
    const skipBtn = document.getElementById('preroll-skip-btn');

    if (titleEl && prerollConfig.sponsorTitle) titleEl.textContent = prerollConfig.sponsorTitle;
    if (descEl && prerollConfig.sponsorDescription) descEl.textContent = prerollConfig.sponsorDescription;
    if (ctaBtn) {
      ctaBtn.textContent = prerollConfig.ctaText || 'Claim Free Pass →';
      ctaBtn.href = prerollConfig.sponsorUrl || 'https://www.profitableratecpmnetwork.com/xwh0p4b11?key=28302daec5dfcaa4dd7345a78366434a';
      ctaBtn.onclick = () => {
        if (window.AdsManager) AdsManager.trackClick();
      };
    }

    prerollSecondsLeft = prerollConfig.duration || 5;

    if (timerText) timerText.textContent = `Playback starts in ${prerollSecondsLeft}s`;
    if (skipBtn) {
      skipBtn.classList.remove('ready');
      skipBtn.textContent = `Skip Ad in ${prerollSecondsLeft}s`;
    }

    if (window.AdsManager) AdsManager.trackImpression();

    if (prerollTimer) clearInterval(prerollTimer);
    prerollTimer = setInterval(() => {
      prerollSecondsLeft--;
      if (prerollSecondsLeft > 0) {
        if (timerText) timerText.textContent = `Playback starts in ${prerollSecondsLeft}s`;
        if (skipBtn) skipBtn.textContent = `Skip Ad in ${prerollSecondsLeft}s`;
      } else {
        clearInterval(prerollTimer);
        if (timerText) timerText.textContent = `Enjoy your movie stream!`;
        if (skipBtn) {
          skipBtn.classList.add('ready');
          skipBtn.textContent = `Skip Ad \u25B6`;
          skipBtn.onclick = closePreroll;
        }
        setTimeout(closePreroll, 1000);
      }
    }, 1000);

  } catch (e) {
    const overlay = document.getElementById('preroll-overlay');
    if (overlay) overlay.classList.add('hidden');
  }
}

function closePreroll() {
  if (prerollTimer) clearInterval(prerollTimer);
  const overlay = document.getElementById('preroll-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.style.opacity = '1';
    }, 300);
  }
}

// Continue Watching Persistence
function saveContinueWatchingProgress(media, type) {
  try {
    let list = JSON.parse(localStorage.getItem(CONTINUE_WATCHING_KEY)) || [];
    const id = media.id;
    // Remove if already in list
    list = list.filter(x => String(x.id) !== String(id));

    list.unshift({
      id: media.id,
      tmdbId: currentTmdbId,
      type: type,
      title: media.title || media.name || 'Untitled',
      poster: media.poster_path || media.poster,
      backdrop: media.backdrop_path || media.backdrop,
      season: currentSeason,
      episode: currentEpisode,
      progress: Math.floor(Math.random() * 30) + 40,
      timestamp: Date.now()
    });

    localStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(list.slice(0, 10)));
  } catch (e) {
    console.error('Error saving continue watching:', e);
  }
}

// Cinema Mode
window.toggleCinemaMode = function() {
  document.body.classList.toggle('cinema-mode');
  const btn = document.getElementById('cinema-mode-btn');
  if (btn) {
    const isCinema = document.body.classList.contains('cinema-mode');
    btn.innerHTML = isCinema ? `<span>💡 Normal</span>` : `<span>🌙 Cinema</span>`;
  }
};

// Fullscreen Player
window.togglePlayerFullscreen = function() {
  const box = document.getElementById('player-box');
  if (!box) return;

  if (!document.fullscreenElement) {
    if (box.requestFullscreen) box.requestFullscreen();
    else if (box.webkitRequestFullscreen) box.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
};

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initWatchRoom();

  const closeTrailerBtn = document.getElementById('close-trailer-modal');
  if (closeTrailerBtn) {
    closeTrailerBtn.addEventListener('click', () => {
      const modal = document.getElementById('trailer-modal');
      const iframe = document.getElementById('trailer-iframe');
      if (modal) modal.classList.remove('active');
      if (iframe) iframe.src = '';
    });
  }
});
