const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

const DATA_DIR = path.join(__dirname, 'data');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON
function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

// Helper to write JSON
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Get TMDB API Key from settings or environment
function getTmdbApiKey() {
  const settings = readJson(SETTINGS_FILE, {});
  return process.env.TMDB_API_KEY || settings.tmdbApiKey || '8265bd1679663a7ea12ac168da84d2e8';
}

// TMDB Fetch Helper with Error Handling
async function fetchTmdb(endpoint, params = {}) {
  const apiKey = getTmdbApiKey();
  const queryParams = new URLSearchParams({
    api_key: apiKey,
    include_adult: 'false',
    language: 'en-US',
    ...params
  });
  
  const url = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB HTTP Error: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`TMDB API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// Auth middleware for admin actions
function checkAdminAuth(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.body.pin || req.query.pin;
  const settings = readJson(SETTINGS_FILE, { adminPin: '8084' });
  if (!pin || String(pin).trim() !== String(settings.adminPin).trim()) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Admin PIN' });
  }
  next();
}

// --- TMDB PROXY API ROUTES ---

// 1. TMDB Trending (Movies, TV Shows, All)
app.get('/api/tmdb/trending', async (req, res) => {
  try {
    const type = req.query.type || 'all'; // movie, tv, all
    const timeWindow = req.query.time || 'day'; // day, week
    const page = req.query.page || 1;
    const region = req.query.region || '';
    const extraParams = { page };
    if (region) extraParams.region = region;
    const data = await fetchTmdb(`/trending/${type}/${timeWindow}`, extraParams);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch trending from TMDB', error: err.message });
  }
});

// 2. TMDB Popular Movies / TV
app.get('/api/tmdb/popular', async (req, res) => {
  try {
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const page = req.query.page || 1;
    const data = await fetchTmdb(`/${type}/popular`, { page });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch popular from TMDB', error: err.message });
  }
});

// 3. TMDB Top Rated
app.get('/api/tmdb/top-rated', async (req, res) => {
  try {
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const page = req.query.page || 1;
    const data = await fetchTmdb(`/${type}/top_rated`, { page });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch top rated from TMDB', error: err.message });
  }
});

// 4. TMDB Upcoming Movies
app.get('/api/tmdb/upcoming', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await fetchTmdb('/movie/upcoming', { page });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming from TMDB', error: err.message });
  }
});

// 5. TMDB Genres List
app.get('/api/tmdb/genres', async (req, res) => {
  try {
    const movieGenres = await fetchTmdb('/genre/movie/list');
    const tvGenres = await fetchTmdb('/genre/tv/list');
    res.json({
      success: true,
      movieGenres: movieGenres.genres || [],
      tvGenres: tvGenres.genres || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch genres from TMDB', error: err.message });
  }
});

// 6. TMDB Discover / Filter (by genre, year, sort, language)
app.get('/api/tmdb/discover', async (req, res) => {
  try {
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const params = {
      page: req.query.page || 1,
      sort_by: req.query.sort_by || 'popularity.desc'
    };

    if (req.query.genre) {
      params.with_genres = req.query.genre;
    }
    if (req.query.year) {
      if (type === 'movie') params.primary_release_year = req.query.year;
      else params.first_air_date_year = req.query.year;
    }
    if (req.query.min_rating) {
      params['vote_average.gte'] = req.query.min_rating;
    }
    if (req.query.language || req.query.with_original_language) {
      params.with_original_language = req.query.language || req.query.with_original_language;
    }
    if (req.query.region) {
      params.region = req.query.region;
    }

    const data = await fetchTmdb(`/discover/${type}`, params);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to discover media from TMDB', error: err.message });
  }
});

// 7. TMDB Live Multi Search (Movies, TV Shows)
app.get('/api/tmdb/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || !query.trim()) {
      return res.json({ success: true, results: [] });
    }
    const page = req.query.page || 1;
    const type = req.query.type; // 'movie', 'tv', or 'multi'
    const endpoint = type === 'movie' ? '/search/movie' : (type === 'tv' ? '/search/tv' : '/search/multi');
    const data = await fetchTmdb(endpoint, { query: query.trim(), page });
    
    // Filter out people from multi search results
    let results = data.results || [];
    if (!type || type === 'multi') {
      results = results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    }

    res.json({ success: true, page: data.page, total_pages: data.total_pages, total_results: data.total_results, results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to search TMDB', error: err.message });
  }
});

// 8. TMDB Movie Full Details (Credits, Videos/Trailers, Similar)
app.get('/api/tmdb/movie/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [details, credits, videos, similar] = await Promise.all([
      fetchTmdb(`/movie/${id}`),
      fetchTmdb(`/movie/${id}/credits`).catch(() => ({ cast: [], crew: [] })),
      fetchTmdb(`/movie/${id}/videos`).catch(() => ({ results: [] })),
      fetchTmdb(`/movie/${id}/similar`).catch(() => ({ results: [] }))
    ]);

    res.json({
      success: true,
      movie: {
        ...details,
        cast: credits.cast ? credits.cast.slice(0, 12) : [],
        videos: videos.results || [],
        similar: similar.results ? similar.results.slice(0, 10) : []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch movie details from TMDB', error: err.message });
  }
});

// 9. TMDB TV Show Details (Seasons, Credits, Videos, Similar)
app.get('/api/tmdb/tv/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [details, credits, videos, similar] = await Promise.all([
      fetchTmdb(`/tv/${id}`),
      fetchTmdb(`/tv/${id}/credits`).catch(() => ({ cast: [], crew: [] })),
      fetchTmdb(`/tv/${id}/videos`).catch(() => ({ results: [] })),
      fetchTmdb(`/tv/${id}/similar`).catch(() => ({ results: [] }))
    ]);

    res.json({
      success: true,
      tv: {
        ...details,
        cast: credits.cast ? credits.cast.slice(0, 12) : [],
        videos: videos.results || [],
        similar: similar.results ? similar.results.slice(0, 10) : []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch TV details from TMDB', error: err.message });
  }
});

// 10. TMDB TV Show Season Details (Episodes)
app.get('/api/tmdb/tv/:id/season/:season_number', async (req, res) => {
  try {
    const { id, season_number } = req.params;
    const data = await fetchTmdb(`/tv/${id}/season/${season_number}`);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch TV season details from TMDB', error: err.message });
  }
});

// --- ADMIN & LOCAL MOVIES API ROUTES ---

// 11. Verify Admin PIN
app.post('/api/verify-admin', (req, res) => {
  const { pin } = req.body;
  const settings = readJson(SETTINGS_FILE, { adminPin: '1234' });
  if (pin && String(pin).trim() === String(settings.adminPin).trim()) {
    return res.json({ success: true, message: 'Admin verified successfully' });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
});

// 12. Get All Curated Movies
app.get('/api/movies', (req, res) => {
  let movies = readJson(MOVIES_FILE, []);
  const { search, genre, sort, featured, trending } = req.query;

  if (search) {
    const q = search.toLowerCase();
    movies = movies.filter(m => 
      m.title.toLowerCase().includes(q) || 
      (m.description && m.description.toLowerCase().includes(q)) ||
      (m.genres && m.genres.some(g => g.toLowerCase().includes(q)))
    );
  }

  if (genre && genre !== 'all') {
    movies = movies.filter(m => 
      m.genres && m.genres.map(g => g.toLowerCase()).includes(genre.toLowerCase())
    );
  }

  if (featured === 'true') {
    movies = movies.filter(m => m.featured);
  }

  if (trending === 'true') {
    movies = movies.filter(m => m.trending);
  }

  if (sort === 'rating') {
    movies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'year') {
    movies.sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (sort === 'title') {
    movies.sort((a, b) => a.title.localeCompare(b.title));
  }

  res.json({ success: true, count: movies.length, movies });
});

// 13. Get Single Curated Movie
app.get('/api/movies/:id', (req, res) => {
  const movies = readJson(MOVIES_FILE, []);
  const movie = movies.find(m => m.id === req.params.id);
  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found' });
  }
  const related = movies
    .filter(m => m.id !== movie.id && m.genres && movie.genres && m.genres.some(g => movie.genres.includes(g)))
    .slice(0, 6);

  res.json({ success: true, movie, related });
});

// 14. Create / Import Movie (Admin)
app.post('/api/movies', checkAdminAuth, (req, res) => {
  const movies = readJson(MOVIES_FILE, []);
  const { 
    tmdbId, 
    mediaType, 
    title, 
    year, 
    rating, 
    duration, 
    quality, 
    genres, 
    description, 
    poster, 
    backdrop, 
    videoUrl, 
    embedUrl, 
    featured, 
    trending,
    servers 
  } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const id = tmdbId ? `tmdb-${tmdbId}` : (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4));
  
  // Prepare stream servers
  let movieServers = Array.isArray(servers) ? servers : [];
  if (movieServers.length === 0) {
    if (videoUrl) {
      movieServers.push({ name: 'Server 1 (Primary HD)', type: 'video', url: videoUrl });
    }
    if (embedUrl) {
      movieServers.push({ name: 'Server 2 (Embed Stream)', type: 'embed', url: embedUrl });
    }
  }

  const newMovie = {
    id,
    tmdbId: tmdbId || null,
    mediaType: mediaType || 'movie',
    title,
    year: Number(year) || new Date().getFullYear(),
    rating: Number(rating) || 8.0,
    duration: duration || '1h 45m',
    quality: quality || '1080p FULL HD',
    genres: Array.isArray(genres) ? genres : (genres ? genres.split(',').map(g => g.trim()) : ['Action']),
    description: description || 'No synopsis provided.',
    poster: poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    backdrop: backdrop || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600&auto=format&fit=crop&q=80',
    featured: Boolean(featured),
    trending: Boolean(trending),
    servers: movieServers
  };

  // Prevent duplicate by id
  const existingIdx = movies.findIndex(m => m.id === id);
  if (existingIdx !== -1) {
    movies[existingIdx] = newMovie;
  } else {
    movies.unshift(newMovie);
  }

  writeJson(MOVIES_FILE, movies);
  res.status(201).json({ success: true, message: 'Movie saved successfully', movie: newMovie });
});

// 15. Update Movie (Admin)
app.put('/api/movies/:id', checkAdminAuth, (req, res) => {
  const movies = readJson(MOVIES_FILE, []);
  const index = movies.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Movie not found' });
  }

  const current = movies[index];
  const { title, year, rating, duration, quality, genres, description, poster, backdrop, videoUrl, embedUrl, featured, trending, servers } = req.body;

  let updatedServers = Array.isArray(servers) ? servers : [...(current.servers || [])];
  if (videoUrl) {
    const s1 = updatedServers.find(s => s.type === 'video');
    if (s1) s1.url = videoUrl;
    else updatedServers.unshift({ name: 'Server 1 (Primary HD)', type: 'video', url: videoUrl });
  }
  if (embedUrl) {
    const s2 = updatedServers.find(s => s.type === 'embed');
    if (s2) s2.url = embedUrl;
    else updatedServers.push({ name: 'Server 2 (Embed Stream)', type: 'embed', url: embedUrl });
  }

  const updatedMovie = {
    ...current,
    title: title || current.title,
    year: year ? Number(year) : current.year,
    rating: rating ? Number(rating) : current.rating,
    duration: duration || current.duration,
    quality: quality || current.quality,
    genres: genres ? (Array.isArray(genres) ? genres : genres.split(',').map(g => g.trim())) : current.genres,
    description: description || current.description,
    poster: poster || current.poster,
    backdrop: backdrop || current.backdrop,
    featured: featured !== undefined ? Boolean(featured) : current.featured,
    trending: trending !== undefined ? Boolean(trending) : current.trending,
    servers: updatedServers
  };

  movies[index] = updatedMovie;
  writeJson(MOVIES_FILE, movies);
  res.json({ success: true, message: 'Movie updated successfully', movie: updatedMovie });
});

// 16. Delete Movie (Admin)
app.delete('/api/movies/:id', checkAdminAuth, (req, res) => {
  let movies = readJson(MOVIES_FILE, []);
  const initialLength = movies.length;
  movies = movies.filter(m => m.id !== req.params.id);
  if (movies.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Movie not found' });
  }

  writeJson(MOVIES_FILE, movies);
  res.json({ success: true, message: 'Movie deleted successfully' });
});

// 17. Get Settings (Public config + Stream Servers)
app.get('/api/settings', (req, res) => {
  const settings = readJson(SETTINGS_FILE, {});
  // Hide actual Master PIN from public GET
  const publicSettings = {
    ...settings,
    adminPinSet: Boolean(settings.adminPin)
  };
  delete publicSettings.adminPin;
  res.json({ success: true, settings: publicSettings });
});

// 18. Update Settings (Admin)
app.post('/api/settings', checkAdminAuth, (req, res) => {
  const settings = readJson(SETTINGS_FILE, {});
  const { siteName, adminPin, tmdbApiKey, streamServers, monetization } = req.body;

  if (siteName) settings.siteName = siteName;
  if (tmdbApiKey) settings.tmdbApiKey = tmdbApiKey.trim();
  if (Array.isArray(streamServers)) settings.streamServers = streamServers;
  if (adminPin && String(adminPin).trim().length >= 4) {
    settings.adminPin = String(adminPin).trim();
  }
  if (monetization) {
    settings.monetization = {
      ...settings.monetization,
      ...monetization
    };
  }

  writeJson(SETTINGS_FILE, settings);
  res.json({ success: true, message: 'Settings updated successfully', settings });
});

// 19. Impression & Click Tracker (Monetization analytics)
app.post('/api/impressions', (req, res) => {
  const { type } = req.body;
  const settings = readJson(SETTINGS_FILE, {});
  if (!settings.analytics) {
    settings.analytics = { totalImpressions: 0, totalClicks: 0, estimatedRpm: 3.65, estimatedEarnings: 0 };
  }

  if (type === 'click') {
    settings.analytics.totalClicks = (settings.analytics.totalClicks || 0) + 1;
    settings.analytics.estimatedEarnings = parseFloat(((settings.analytics.estimatedEarnings || 0) + 0.15).toFixed(2));
  } else {
    settings.analytics.totalImpressions = (settings.analytics.totalImpressions || 0) + 1;
    const rpm = settings.analytics.estimatedRpm || 3.65;
    settings.analytics.estimatedEarnings = parseFloat(((settings.analytics.totalImpressions * (rpm / 1000)) + ((settings.analytics.totalClicks || 0) * 0.15)).toFixed(2));
  }

  writeJson(SETTINGS_FILE, settings);
  res.json({ success: true, analytics: settings.analytics });
});

// Page routes
app.get('/watch', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'watch.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/dmca', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dmca.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎬 MOVIE REDX Platform is running!`);
  console.log(`🌐 Website URL:  http://localhost:${PORT}`);
  console.log(`📺 Watch Room:   http://localhost:${PORT}/watch.html?tmdb=550`);
  console.log(`⚙️  Admin Panel:  http://localhost:${PORT}/admin.html (Master PIN: 8084)`);
  console.log(`⚖️  DMCA Page:    http://localhost:${PORT}/dmca.html`);
  console.log(`====================================================`);
});
