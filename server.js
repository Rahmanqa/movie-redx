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

const DATA_DIR = path.join(__dirname, 'data');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

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

// Auth middleware for admin actions
function checkAdminAuth(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.body.pin || req.query.pin;
  const settings = readJson(SETTINGS_FILE, { adminPin: '1234' });
  if (!pin || String(pin) !== String(settings.adminPin)) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Admin PIN' });
  }
  next();
}

// --- API ROUTES ---

// 1. Verify Admin PIN
app.post('/api/verify-admin', (req, res) => {
  const { pin } = req.body;
  const settings = readJson(SETTINGS_FILE, { adminPin: '1234' });
  if (pin && String(pin) === String(settings.adminPin)) {
    return res.json({ success: true, message: 'PIN verified successfully' });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin PIN' });
});

// 2. Get All Movies (with search, genre filtering)
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

// 3. Get Single Movie
app.get('/api/movies/:id', (req, res) => {
  const movies = readJson(MOVIES_FILE, []);
  const movie = movies.find(m => m.id === req.params.id);
  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found' });
  }
  // Also get related movies
  const related = movies
    .filter(m => m.id !== movie.id && m.genres && movie.genres && m.genres.some(g => movie.genres.includes(g)))
    .slice(0, 6);

  res.json({ success: true, movie, related });
});

// 4. Create New Movie (Admin)
app.post('/api/movies', checkAdminAuth, (req, res) => {
  const movies = readJson(MOVIES_FILE, []);
  const { title, year, rating, duration, quality, genres, description, poster, backdrop, videoUrl, embedUrl, featured, trending } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
  
  const servers = [];
  if (videoUrl) {
    servers.push({
      name: 'Server 1 (Primary HD)',
      type: 'video',
      url: videoUrl
    });
  }
  if (embedUrl) {
    servers.push({
      name: 'Server 2 (Embed Stream)',
      type: 'embed',
      url: embedUrl
    });
  }
  if (servers.length === 0) {
    servers.push({
      name: 'Server 1 (Sample Stream)',
      type: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    });
  }

  const newMovie = {
    id,
    title,
    year: Number(year) || new Date().getFullYear(),
    rating: Number(rating) || 8.0,
    duration: duration || '1h 30m',
    quality: quality || '1080p FULL HD',
    genres: Array.isArray(genres) ? genres : (genres ? genres.split(',').map(g => g.trim()) : ['Action']),
    description: description || 'No synopsis provided.',
    poster: poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    backdrop: backdrop || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600&auto=format&fit=crop&q=80',
    featured: Boolean(featured),
    trending: Boolean(trending),
    servers
  };

  movies.unshift(newMovie);
  writeJson(MOVIES_FILE, movies);

  res.status(201).json({ success: true, message: 'Movie created successfully', movie: newMovie });
});

// 5. Update Movie (Admin)
app.put('/api/movies/:id', checkAdminAuth, (req, res) => {
  const movies = readJson(MOVIES_FILE, []);
  const index = movies.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Movie not found' });
  }

  const current = movies[index];
  const { title, year, rating, duration, quality, genres, description, poster, backdrop, videoUrl, embedUrl, featured, trending } = req.body;

  const servers = [...current.servers];
  if (videoUrl) {
    const s1 = servers.find(s => s.type === 'video');
    if (s1) s1.url = videoUrl;
    else servers.unshift({ name: 'Server 1 (Primary HD)', type: 'video', url: videoUrl });
  }
  if (embedUrl) {
    const s2 = servers.find(s => s.type === 'embed');
    if (s2) s2.url = embedUrl;
    else servers.push({ name: 'Server 2 (Embed Stream)', type: 'embed', url: embedUrl });
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
    servers
  };

  movies[index] = updatedMovie;
  writeJson(MOVIES_FILE, movies);

  res.json({ success: true, message: 'Movie updated successfully', movie: updatedMovie });
});

// 6. Delete Movie (Admin)
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

// 7. Get Settings & Monetization Configuration
app.get('/api/settings', (req, res) => {
  const settings = readJson(SETTINGS_FILE, {});
  // Hide actual PIN from public GET
  const publicSettings = {
    ...settings,
    adminPinSet: Boolean(settings.adminPin)
  };
  delete publicSettings.adminPin;
  res.json({ success: true, settings: publicSettings });
});

// 8. Update Settings & Monetization (Admin)
app.post('/api/settings', checkAdminAuth, (req, res) => {
  const settings = readJson(SETTINGS_FILE, {});
  const { siteName, adminPin, monetization } = req.body;

  if (siteName) settings.siteName = siteName;
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

// 9. Impression & Click Tracker (Monetization analytics)
app.post('/api/impressions', (req, res) => {
  const { type } = req.body; // 'impression' or 'click'
  const settings = readJson(SETTINGS_FILE, {});
  if (!settings.analytics) {
    settings.analytics = { totalImpressions: 0, totalClicks: 0, estimatedRpm: 3.50, estimatedEarnings: 0 };
  }

  if (type === 'click') {
    settings.analytics.totalClicks = (settings.analytics.totalClicks || 0) + 1;
    // Each ad click adds value
    settings.analytics.estimatedEarnings = parseFloat((settings.analytics.estimatedEarnings + 0.15).toFixed(2));
  } else {
    settings.analytics.totalImpressions = (settings.analytics.totalImpressions || 0) + 1;
    // Calculate RPM ($3.50 per 1000 views)
    const rpm = settings.analytics.estimatedRpm || 3.50;
    settings.analytics.estimatedEarnings = parseFloat((settings.analytics.totalImpressions * (rpm / 1000) + (settings.analytics.totalClicks * 0.15)).toFixed(2));
  }

  writeJson(SETTINGS_FILE, settings);
  res.json({ success: true, analytics: settings.analytics });
});

// Fallback HTML routing
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
  console.log(`🎬 CineStream Movie Platform is running!`);
  console.log(`🌐 Website URL:  http://localhost:${PORT}`);
  console.log(`📺 Watch Room:   http://localhost:${PORT}/watch.html?id=tears-of-steel`);
  console.log(`⚙️  Admin Panel:  http://localhost:${PORT}/admin.html (Default PIN: 1234)`);
  console.log(`⚖️  DMCA Page:    http://localhost:${PORT}/dmca.html`);
  console.log(`====================================================`);
});
