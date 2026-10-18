const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const zlib = require('zlib');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || 'https://movie-redx-1.onrender.com';

// ─── In-memory TMDB response cache ────────────────────────────────────────────
const tmdbCache = new Map(); // key -> { data, expiry }
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
function getCache(key) {
  const entry = tmdbCache.get(key);
  if (entry && Date.now() < entry.expiry) return entry.data;
  if (entry) tmdbCache.delete(key);
  return null;
}
function setCache(key, data) {
  tmdbCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ─── Slug generator ───────────────────────────────────────────────────────────
function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'watch';
}

// ─── Genre name → id and id → slug lookup ─────────────────────────────────────
const GENRE_MAP = [
  { id: 28, name: 'Action', slug: 'action' },
  { id: 12, name: 'Adventure', slug: 'adventure' },
  { id: 16, name: 'Animation', slug: 'animation' },
  { id: 35, name: 'Comedy', slug: 'comedy' },
  { id: 80, name: 'Crime', slug: 'crime' },
  { id: 99, name: 'Documentary', slug: 'documentary' },
  { id: 18, name: 'Drama', slug: 'drama' },
  { id: 10751, name: 'Family', slug: 'family' },
  { id: 14, name: 'Fantasy', slug: 'fantasy' },
  { id: 36, name: 'History', slug: 'history' },
  { id: 27, name: 'Horror', slug: 'horror' },
  { id: 10402, name: 'Music', slug: 'music' },
  { id: 9648, name: 'Mystery', slug: 'mystery' },
  { id: 10749, name: 'Romance', slug: 'romance' },
  { id: 878, name: 'Science Fiction', slug: 'science-fiction' },
  { id: 53, name: 'Thriller', slug: 'thriller' },
  { id: 10752, name: 'War', slug: 'war' },
  { id: 37, name: 'Western', slug: 'western' },
];
function genreSlugToId(slug) {
  return GENRE_MAP.find(g => g.slug === slug)?.id || null;
}
function genreNameBySlug(slug) {
  return GENRE_MAP.find(g => g.slug === slug)?.name || slug;
}

// Security and Isolation Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// Universal Google Search Console HTML File Verification Handler
app.get('/google:code.html', (req, res) => {
  const code = req.params.code;
  res.type('text/html').send(`google-site-verification: google${code}.html`);
});

// Dynamic Sitemap — generates real /movie/:id-:slug and /tv/:id-:slug URLs for Google
app.get('/sitemap.xml', async (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/movies', priority: '0.9', changefreq: 'daily' },
    { url: '/tv', priority: '0.9', changefreq: 'daily' },
    { url: '/hindi-dubbed', priority: '0.95', changefreq: 'daily' },
    { url: '/top-rated', priority: '0.85', changefreq: 'weekly' },
    { url: '/upcoming', priority: '0.85', changefreq: 'daily' },
    { url: '/genre/action', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/adventure', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/animation', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/comedy', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/crime', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/documentary', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/drama', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/family', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/fantasy', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/history', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/horror', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/music', priority: '0.75', changefreq: 'weekly' },
    { url: '/genre/mystery', priority: '0.75', changefreq: 'weekly' },
    { url: '/genre/romance', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/science-fiction', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/thriller', priority: '0.8', changefreq: 'weekly' },
    { url: '/genre/war', priority: '0.75', changefreq: 'weekly' },
    { url: '/genre/western', priority: '0.75', changefreq: 'weekly' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/contact', priority: '0.4', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.4', changefreq: 'monthly' },
    { url: '/terms', priority: '0.4', changefreq: 'monthly' },
    { url: '/dmca', priority: '0.4', changefreq: 'monthly' },
  ];

  let mediaUrls = [];
  try {
    // Fetch 10 lists in parallel — each returns up to 20 items → ~200 unique media URLs
    const lists = await Promise.allSettled([
      fetchTmdb('/movie/popular', { page: 1 }),
      fetchTmdb('/movie/popular', { page: 2 }),
      fetchTmdb('/movie/popular', { page: 3 }),
      fetchTmdb('/movie/top_rated', { page: 1 }),
      fetchTmdb('/movie/top_rated', { page: 2 }),
      fetchTmdb('/movie/upcoming', { page: 1 }),
      fetchTmdb('/movie/now_playing', { page: 1 }),
      fetchTmdb('/tv/popular', { page: 1 }),
      fetchTmdb('/tv/popular', { page: 2 }),
      fetchTmdb('/tv/top_rated', { page: 1 }),
      fetchTmdb('/tv/top_rated', { page: 2 }),
      fetchTmdb('/discover/movie', { with_original_language: 'hi', sort_by: 'popularity.desc', page: 1 }),
      fetchTmdb('/discover/movie', { with_original_language: 'hi', sort_by: 'popularity.desc', page: 2 }),
      fetchTmdb('/discover/movie', { with_original_language: 'hi', sort_by: 'popularity.desc', page: 3 }),
    ]);

    const seen = new Set();
    lists.forEach(({ status, value }, i) => {
      if (status !== 'fulfilled' || !value || !value.results) return;
      const isTv = i >= 7 && i <= 10; // indices for TV lists
      const type = isTv ? 'tv' : 'movie';
      value.results.forEach(it => {
        if (!it || !it.id) return;
        const key = `${type}:${it.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        const title = it.title || it.name || 'watch';
        const slug = slugify(title);
        const mod = (it.release_date || it.first_air_date || today).split('T')[0] || today;
        mediaUrls.push({ url: `/${type}/${it.id}-${slug}`, priority: '0.7', changefreq: 'monthly', lastmod: mod });
      });
    });
  } catch (e) {
    console.error('[Sitemap] TMDB fetch error:', e.message);
  }

  const urlEntry = (u) =>
    `  <url>\n    <loc>${SITE_URL}${u.url}</loc>\n    <lastmod>${u.lastmod || today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticPages.map(u => urlEntry({ ...u, lastmod: today })).join('\n')}
${mediaUrls.map(u => urlEntry(u)).join('\n')}
</urlset>`;

  res.send(xml);
});


app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Homepage SSR: / ──────────────────────────────────────────────────────────
// Must come BEFORE express.static so we can inject SSR content before index.html
// The response is index.html enriched with SSR content (featured movie + rows of poster links)
// so Google can crawl real URLs from view-source. Client JS app loads on top.
app.get('/', async (req, res) => {
  // If any filter/search/sort query params are present → serve with noindex,follow and canonical to base
  const hasQuery = Object.keys(req.query).length > 0;
  if (hasQuery) {
    const indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    let noindexHtml = indexHtml.replace(
      /<meta\s+name=["']robots["'][^>]*>/i,
      '<meta name="robots" content="noindex,follow">'
    );
    noindexHtml = noindexHtml.replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${SITE_URL}/">`
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800');
    return res.send(noindexHtml);
  }

  try {
    // Fetch 3 rows of content in parallel
    const [trending, popular, hindi] = await Promise.all([
      fetchTmdb('/trending/all/day', { page: 1 }),
      fetchTmdb('/movie/popular', { page: 1 }),
      fetchTmdb('/discover/movie', { with_original_language: 'hi', sort_by: 'popularity.desc', page: 1 })
    ]);

    const featured = (trending.results || [])[0];
    const featuredTitle = featured ? (featured.title || featured.name || '') : '';
    const featuredSlug = slugify(featuredTitle);
    const featuredType = featured && featured.media_type === 'tv' ? 'tv' : 'movie';
    const featuredUrl = featured ? `/${featuredType}/${featured.id}-${featuredSlug}` : '/movies';
    const featuredPoster = featured && featured.backdrop_path ? `https://image.tmdb.org/t/p/w1280${featured.backdrop_path}` : '';
    const featuredDesc = truncate(featured ? (featured.overview || '') : '', 155);
    const featuredYear = ((featured && (featured.release_date || featured.first_air_date)) || '').split('-')[0] || '';

    const websiteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'MOVIE REDX',
      url: SITE_URL,
      description: 'A cinema and television guide. Discover movies and TV shows with cast details, trailers, ratings, and streaming information.',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
        'query-input': 'required name=search_term_string'
      }
    };

    // Read index.html and inject SSR content into it
    const indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

    // Build the SSR content block that goes into the page
    const ssrBlock = `
<!-- SSR content for search engines — JS app renders on top -->
<div id="ssr-hero" style="display:none;" aria-hidden="true">
  ${featured ? `
  <h2 style="font-size:2.2rem;font-weight:900;color:#fff;margin-bottom:8px;">
    <a href="${featuredUrl}" style="color:inherit;text-decoration:none;">${escHtml(featuredTitle)}${featuredYear ? ` (${escHtml(featuredYear)})` : ''}</a>
  </h1>
  ${featuredPoster ? `<img src="${escHtml(featuredPoster)}" alt="${escHtml(featuredTitle)} featured image" loading="lazy" style="max-width:100%;border-radius:16px;" width="1280" height="720">` : ''}
  ${featuredDesc ? `<p style="color:#94a3b8;margin:12px 0 20px;">${escHtml(featuredDesc)}</p>` : ''}
  <a href="${featuredUrl}" style="background:linear-gradient(135deg,#e50914,#ff1e27);color:#fff;padding:10px 24px;border-radius:40px;text-decoration:none;font-weight:800;">▶ View Details</a>
  ` : ''}
</div>

<nav aria-label="Trending" style="display:none;" aria-hidden="true">
  <h2>Trending Movies &amp; Shows</h2>
  <div class="ssr-grid">
    ${(trending.results || []).slice(0, 10).map(it => {
      const t = it.title || it.name || 'Movie';
      const s = slugify(t);
      const ty = it.media_type === 'tv' ? 'tv' : 'movie';
      const yr = ((it.release_date || it.first_air_date) || '').split('-')[0] || '';
      return `<a href="/${ty}/${it.id}-${s}">${escHtml(t)}${yr ? ` (${escHtml(yr)})` : ''}</a>`;
    }).join('\n    ')}
  </div>
</nav>

<nav aria-label="Popular Movies" style="display:none;" aria-hidden="true">
  <h2>Popular Movies</h2>
  <div class="ssr-grid">
    ${(popular.results || []).slice(0, 10).map(it => {
      const t = it.title || 'Movie';
      const s = slugify(t);
      const yr = (it.release_date || '').split('-')[0] || '';
      return `<a href="/movie/${it.id}-${s}">${escHtml(t)}${yr ? ` (${escHtml(yr)})` : ''}</a>`;
    }).join('\n    ')}
  </div>
</nav>

<nav aria-label="Hindi Cinema" style="display:none;" aria-hidden="true">
  <h2>Hindi Cinema &amp; Bollywood</h2>
  <div class="ssr-grid">
    ${(hindi.results || []).slice(0, 10).map(it => {
      const t = it.title || 'Movie';
      const s = slugify(t);
      const yr = (it.release_date || '').split('-')[0] || '';
      return `<a href="/movie/${it.id}-${s}">${escHtml(t)}${yr ? ` (${escHtml(yr)})` : ''}</a>`;
    }).join('\n    ')}
  </div>
</nav>
<!-- End SSR content -->`;

    // Inject JSON-LD into head
    const htmlWithJsonLd = indexHtml.replace(
      '</head>',
      `<script type="application/ld+json">${JSON.stringify(websiteJsonLd)}</script>\n  </head>`
    );

    // Inject SSR block after opening body tag
    const finalHtml = htmlWithJsonLd.replace(
      /<body[^>]*>/,
      (match) => match + '\n' + ssrBlock
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800');
    res.send(finalHtml);
  } catch (err) {
    console.error('[SSR /] Error:', err.message);
    // Fallback to plain index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

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

// TMDB Fetch Helper — uses https.get with family:4 (avoids IPv6 ECONNRESET on Windows)
// Retries up to 5 times with exponential backoff; caches results for 6 hours.
async function _singleTmdbFetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      family: 4,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    }, (res) => {
      let stream = res;
      if (res.headers['content-encoding'] === 'gzip') stream = res.pipe(zlib.createGunzip());
      else if (res.headers['content-encoding'] === 'deflate') stream = res.pipe(zlib.createInflate());
      let raw = '';
      stream.on('data', chunk => { raw += chunk; });
      stream.on('end', () => {
        try {
          const data = JSON.parse(raw);
          resolve({ status: res.statusCode, data });
        } catch (e) { reject(e); }
      });
      stream.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('TMDB request timeout')));
  });
}

async function fetchTmdb(endpoint, params = {}) {
  const apiKey = getTmdbApiKey();
  const queryParams = new URLSearchParams({
    api_key: apiKey,
    include_adult: 'false',
    language: 'en-US',
    ...params
  });
  const url = `https://api.themoviedb.org/3${endpoint}?${queryParams.toString()}`;
  const cacheKey = url;

  // Return cached data if fresh
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Retry up to 5 times
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const { status, data } = await _singleTmdbFetch(url);
      if (status === 404) {
        const notFound = { _notFound: true, status: 404 };
        setCache(cacheKey, notFound);
        return notFound;
      }
      if (status >= 400) throw new Error(`TMDB HTTP ${status}`);
      setCache(cacheKey, data);
      return data;
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 150 * attempt));
    }
  }
  console.error(`TMDB API Error [${endpoint}]:`, lastErr.message);
  throw lastErr;
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

// ─── SHARED HTML HELPERS ─────────────────────────────────────────────────────
function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function truncate(str, len) {
  str = String(str || '');
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

function sharedHead({ title, desc, canonical, ogImage, noindex = false, jsonld = '' }) {
  const ogImg = ogImage || `${SITE_URL}/apple-touch-icon.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(desc)}">
  ${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
  <link rel="canonical" href="${escHtml(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MOVIE REDX">
  <meta property="og:url" content="${escHtml(canonical)}">
  <meta property="og:title" content="${escHtml(title)}">
  <meta property="og:description" content="${escHtml(desc)}">
  <meta property="og:image" content="${escHtml(ogImg)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)}">
  <meta name="twitter:description" content="${escHtml(desc)}">
  <meta name="twitter:image" content="${escHtml(ogImg)}">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#e50914">
  <meta name="google-site-verification" content="7rIJDeswNENvkS2VnEYMtSBJF-YZ_qXwIhR5pyKkX4Y">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/style.css">
  ${jsonld}
</head>
<body>`;
}

function sharedNav() {
  return `<header>
  <nav class="navbar">
    <a href="/" class="nav-brand" title="MOVIE REDX">
      <span class="brand-icon-box">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
        </svg>
      </span>
      <div class="brand-title"><span>MOVIE</span><span class="redx-tag">REDX</span></div>
    </a>
    <div class="nav-links">
      <a href="/" class="nav-link-item">Home</a>
      <a href="/movies" class="nav-link-item">Movies</a>
      <a href="/hindi-dubbed" class="nav-link-item">Hindi Dubbed</a>
      <a href="/tv" class="nav-link-item">TV Series</a>
      <a href="/top-rated" class="nav-link-item">Top Rated</a>
    </div>
  </nav>
</header>`;
}

function sharedFooter() {
  return `<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <h3>🎬 MOVIE <span style="color:#e50914;">REDX</span></h3>
      <p>A cinema and television entertainment guide. Explore cast, trailers, ratings, and where to watch.</p>
      
    </div>
    <div class="footer-col">
      <h4>Browse</h4>
      <ul>
        <li><a href="/movies">All Movies</a></li>
        <li><a href="/hindi-dubbed">Hindi Cinema</a></li>
        <li><a href="/tv">TV Shows</a></li>
        <li><a href="/top-rated">Top Rated</a></li>
        <li><a href="/upcoming">Upcoming</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Genres</h4>
      <ul>
        <li><a href="/genre/action">Action</a></li>
        <li><a href="/genre/comedy">Comedy</a></li>
        <li><a href="/genre/drama">Drama</a></li>
        <li><a href="/genre/horror">Horror</a></li>
        <li><a href="/genre/science-fiction">Sci-Fi</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/dmca">DMCA</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p class="site-disclaimer" style="font-size:12px;color:#9aa0a6;text-align:center;margin:12px 0;">
  MOVIE REDX uses third-party resources for movie information, images and trailers; all content belongs to its respective owners.<br>
  We do not host or store any video files on our servers. For any copyright concern, please contact us via our <a href="/dmca.html">DMCA page</a>.
</p>
    <div>&copy; 2026 MOVIE REDX. Entertainment &amp; Cinema Discovery Guide.</div>
    <div><a href="/about" style="color:#64748b">About</a> &bull; <a href="/privacy" style="color:#64748b">Privacy</a> &bull; <a href="/terms" style="color:#64748b">Terms</a> &bull; <a href="/sitemap.xml" style="color:#64748b">Sitemap</a></div>
  </div>
</footer>
<script src="/js/app.js" defer></script>
</body></html>`;
}

function posterCard(item, mediaType) {
  const title = escHtml(item.title || item.name || 'Movie');
  const isTv = mediaType === 'tv' || (!mediaType && !item.title);
  const slug = slugify(item.title || item.name);
  const url = `/${isTv ? 'tv' : 'movie'}/${item.id}-${slug}`;
  const posterSrc = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : '/icon-192.png';
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || '';
  const rating = (item.vote_average || 0).toFixed(1);
  return `<a href="${url}" class="movie-card" style="display:flex;flex-direction:column;text-decoration:none;" title="${title}">
    <div class="card-poster-wrap" style="position:relative;">
      <img src="${escHtml(posterSrc)}" alt="${title} ${escHtml(year)} poster" class="card-poster-img" loading="lazy" width="200" height="300">
      <span class="card-rating-badge">★ ${rating}</span>
      <span class="card-type-badge">${isTv ? 'TV' : 'HD'}</span>
    </div>
    <div class="movie-card-info">
      <div class="movie-card-title">${title}</div>
      <div class="movie-card-meta"><span>${escHtml(year)}</span></div>
    </div>
  </a>`;
}

function breadcrumbJsonLd(items) {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url
    }))
  })}</script>`;
}

function paginationHtml(currentPage, totalPages, baseUrl) {
  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;
  let html = '<nav class="pagination-bar" aria-label="Pages">';
  if (prevPage >= 1) {
    html += `<a href="${baseUrl}?page=${prevPage}" class="page-btn" rel="prev">← Prev</a>`;
  }
  const pageNums = '<span class="page-numbers">';
  html += pageNums;
  const range = [];
  for (let p = Math.max(1, currentPage - 2); p <= Math.min(totalPages, currentPage + 2); p++) range.push(p);
  if (range[0] > 1) html += `<a href="${baseUrl}?page=1" class="page-num">1</a><span class="page-ellipsis">…</span>`;
  range.forEach(p => {
    html += p === currentPage
      ? `<span class="page-num active" aria-current="page">${p}</span>`
      : `<a href="${baseUrl}?page=${p}" class="page-num">${p}</a>`;
  });
  if (range[range.length - 1] < totalPages) html += `<span class="page-ellipsis">…</span><a href="${baseUrl}?page=${totalPages}" class="page-num">${totalPages}</a>`;
  html += '</span>';
  if (nextPage <= totalPages) {
    html += `<a href="${baseUrl}?page=${nextPage}" class="page-btn" rel="next">Next →</a>`;
  }
  html += '</nav>';
  return html;
}

// ─── SSR: /movie/:idSlug ──────────────────────────────────────────────────────
app.get('/movie/:idSlug', async (req, res) => {
  const match = req.params.idSlug.match(/^(\d+)/);
  if (!match) return res.redirect(301, '/movies');
  const tmdbId = match[1];
  const langHint = req.query.lang === 'hi' ? 'Hindi Dubbed' : '';

  try {
    const [details, credits, videos, similar, providers] = await Promise.all([
      fetchTmdb(`/movie/${tmdbId}`),
      fetchTmdb(`/movie/${tmdbId}/credits`).catch(() => ({ cast: [], crew: [] })),
      fetchTmdb(`/movie/${tmdbId}/videos`).catch(() => ({ results: [] })),
      fetchTmdb(`/movie/${tmdbId}/similar`).catch(() => ({ results: [] })),
      fetchTmdb(`/movie/${tmdbId}/watch/providers`).catch(() => ({ results: {} }))
    ]);

    if (!details || details._notFound || !details.id) {
      return res.status(404).send(render404());
    }

    const title = details.title || 'Unknown Movie';
    const year = (details.release_date || '').split('-')[0] || '';
    const slug = slugify(title);
    const canonical = `${SITE_URL}/movie/${tmdbId}-${slug}`;
    const posterUrl = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null;
    const backdropUrl = details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null;
    const overview = details.overview || '';
    const rating = (details.vote_average || 0).toFixed(1);
    const runtime = details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : '';
    const genres = (details.genres || []);
    const director = (credits.crew || []).find(c => c.job === 'Director');
    const cast = (credits.cast || []).slice(0, 10);
    const trailer = (videos.results || []).find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    const similarItems = (similar.results || []).slice(0, 6);
    const providerIN = (providers.results || {}).IN || {};
    const providerUS = (providers.results || {}).US || {};
    const watchProviders = [...(providerIN.flatrate || []), ...(providerUS.flatrate || [])];
    const providerLink = providerIN.link || providerUS.link || null;
    const noindex = !overview;

    const pageTitle = truncate(`${title}${year ? ' (' + year + ')' : ''} — Cast, Trailer & Where to Watch | MOVIE REDX`, 60);
    const metaDesc = truncate(overview || `Explore cast, trailers, and streaming info for ${title}${year ? ' (' + year + ')' : ''} on MOVIE REDX.`, 155);

    const movieJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: title,
      url: canonical,
      datePublished: details.release_date || undefined,
      description: overview || undefined,
      image: posterUrl || undefined,
      genre: genres.map(g => g.name),
      director: director ? { '@type': 'Person', name: director.name } : undefined,
      actor: cast.slice(0, 5).map(c => ({ '@type': 'Person', name: c.name })),
      aggregateRating: details.vote_count > 20 ? {
        '@type': 'AggregateRating',
        ratingValue: rating,
        ratingCount: details.vote_count,
        bestRating: '10',
        worstRating: '0'
      } : undefined,
      trailer: trailer ? {
        '@type': 'VideoObject',
        name: `${title} — Official Trailer`,
        embedUrl: `https://www.youtube.com/embed/${trailer.key}`,
        thumbnailUrl: `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`
      } : undefined
    };

    const breadcrumb = breadcrumbJsonLd([
      { name: 'Home', url: SITE_URL + '/' },
      { name: 'Movies', url: SITE_URL + '/movies' },
      { name: title, url: canonical }
    ]);

    let html = sharedHead({
      title: pageTitle,
      desc: metaDesc,
      canonical,
      ogImage: backdropUrl || posterUrl,
      noindex,
      jsonld: `<script type="application/ld+json">${JSON.stringify(movieJsonLd)}</script>${breadcrumb}`
    });
    html += sharedNav();
    html += `
<main style="max-width:1200px;margin:30px auto;padding:0 20px;" itemscope itemtype="https://schema.org/Movie">
  <div style="display:grid;grid-template-columns:220px 1fr;gap:30px;margin-bottom:40px;">
    ${posterUrl ? `<img src="${escHtml(posterUrl)}" alt="${escHtml(title)} movie poster" width="220" height="330" style="border-radius:16px;width:100%;height:auto;box-shadow:0 16px 48px rgba(0,0,0,.7);" itemprop="image">` : '<div style="width:220px;height:330px;background:#1a2744;border-radius:16px;"></div>'}
    <div>
      <h1 style="font-size:2rem;font-weight:900;color:#fff;margin-bottom:8px;" itemprop="name">${escHtml(title)}${year ? ` <span style="color:#94a3b8;font-weight:400;font-size:1.3rem;">(${escHtml(year)})</span>` : ''}</h1>
      ${details.tagline ? `<p style="color:#00d2ff;font-style:italic;margin-bottom:12px;">"${escHtml(details.tagline)}"</p>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
        <span style="background:rgba(245,197,24,.15);color:#f5c518;border:1px solid rgba(245,197,24,.3);padding:4px 12px;border-radius:20px;font-weight:800;">★ ${escHtml(rating)}</span>
        ${runtime ? `<span style="background:rgba(255,255,255,.08);color:#cbd5e1;padding:4px 12px;border-radius:20px;">${escHtml(runtime)}</span>` : ''}
        ${year ? `<span style="background:rgba(255,255,255,.08);color:#cbd5e1;padding:4px 12px;border-radius:20px;">${escHtml(year)}</span>` : ''}
        ${langHint ? `<span style="background:rgba(229,9,20,.15);color:#ff6b7a;border:1px solid rgba(229,9,20,.3);padding:4px 12px;border-radius:20px;font-weight:700;">${escHtml(langHint)}</span>` : ''}
      </div>
      ${genres.length ? `<div style="margin-bottom:16px;">${genres.map(g => `<a href="/genre/${slugify(g.name)}" style="display:inline-block;background:rgba(0,210,255,.1);border:1px solid rgba(0,210,255,.3);color:#00d2ff;padding:4px 14px;border-radius:20px;margin:3px;text-decoration:none;font-size:.85rem;">${escHtml(g.name)}</a>`).join('')}</div>` : ''}
      ${director ? `<p style="color:#cbd5e1;margin-bottom:8px;"><strong style="color:#fff;">Director:</strong> <span itemprop="director" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${escHtml(director.name)}</span></span></p>` : ''}
      ${overview ? `<p style="color:#94a3b8;line-height:1.8;margin-bottom:20px;" itemprop="description">${escHtml(overview)}</p>` : ''}
      <a href="/watch.html?tmdb=${tmdbId}${langHint ? '&lang=hi' : ''}" class="btn-play-hero" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;padding:12px 28px;border-radius:50px;background:linear-gradient(135deg,#e50914,#ff1e27);color:#fff;font-weight:800;font-size:1rem;box-shadow:0 8px 24px rgba(229,9,20,.4);">
        ▶ Watch Now
      </a>
    </div>
  </div>

  ${cast.length ? `
  <section style="margin-bottom:36px;" aria-label="Cast">
    <h2 style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:16px;">Top Cast</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:14px;">
      ${cast.map(person => `
      <div style="text-align:center;" itemprop="actor" itemscope itemtype="https://schema.org/Person">
        <img src="${person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="${escHtml(person.name)}" width="110" height="165" loading="lazy" style="border-radius:12px;width:100%;height:auto;object-fit:cover;">
        <p style="color:#fff;font-size:.8rem;font-weight:700;margin:6px 0 2px;" itemprop="name">${escHtml(person.name)}</p>
        <p style="color:#64748b;font-size:.72rem;">${escHtml(person.character || '')}</p>
      </div>`).join('')}
    </div>
  </section>` : ''}

  ${trailer ? `
  <section style="margin-bottom:36px;" aria-label="Official Trailer">
    <h2 style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:16px;">Official Trailer</h2>
    <div style="position:relative;aspect-ratio:16/9;background:#000;border-radius:16px;overflow:hidden;">
      <iframe src="https://www.youtube-nocookie.com/embed/${escHtml(trailer.key)}?rel=0&modestbranding=1" title="${escHtml(title)} — Official Trailer" loading="lazy" allowfullscreen style="width:100%;height:100%;border:none;" allow="encrypted-media"></iframe>
    </div>
  </section>` : ''}

  ${watchProviders.length ? `
  <section style="margin-bottom:36px;" aria-label="Where to Watch">
    <h2 style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:16px;">Where to Watch</h2>
    <div style="display:flex;flex-wrap:wrap;gap:12px;">
      ${watchProviders.map(p => `
      <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:8px 16px;">
        ${p.logo_path ? `<img src="https://image.tmdb.org/t/p/original${p.logo_path}" alt="${escHtml(p.provider_name)} logo" width="36" height="36" loading="lazy" style="border-radius:8px;">` : ''}
        <span style="color:#fff;font-weight:600;">${escHtml(p.provider_name)}</span>
      </div>`).join('')}
    </div>
    ${providerLink ? `<p style="margin-top:12px;"><a href="${escHtml(providerLink)}" target="_blank" rel="nofollow noopener" style="color:#00d2ff;">View all providers →</a></p>` : ''}
  </section>` : ''}

  ${similarItems.length ? `
  <section style="margin-bottom:36px;" aria-label="More Like This">
    <h2 style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:16px;">More Like This</h2>
    <div class="movies-grid">${similarItems.map(m => posterCard(m, 'movie')).join('')}</div>
  </section>` : ''}
</main>`;
    html += sharedFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.send(html);
  } catch (err) {
    console.error('[SSR /movie] Error:', err.message);
    res.status(500).send(render500());
  }
});

// ─── SSR: /tv/:idSlug ─────────────────────────────────────────────────────────
app.get('/tv/:idSlug', async (req, res) => {
  const match = req.params.idSlug.match(/^(\d+)/);
  if (!match) return res.redirect(301, '/tv');
  const tmdbId = match[1];
  const langHint = req.query.lang === 'hi' ? 'Hindi Dubbed' : '';

  try {
    const [details, credits, videos, similar, providers] = await Promise.all([
      fetchTmdb(`/tv/${tmdbId}`),
      fetchTmdb(`/tv/${tmdbId}/credits`).catch(() => ({ cast: [], crew: [] })),
      fetchTmdb(`/tv/${tmdbId}/videos`).catch(() => ({ results: [] })),
      fetchTmdb(`/tv/${tmdbId}/similar`).catch(() => ({ results: [] })),
      fetchTmdb(`/tv/${tmdbId}/watch/providers`).catch(() => ({ results: {} }))
    ]);

    if (!details || details._notFound || !details.id) {
      return res.status(404).send(render404());
    }

    const title = details.name || 'Unknown Series';
    const year = (details.first_air_date || '').split('-')[0] || '';
    const slug = slugify(title);
    const canonical = `${SITE_URL}/tv/${tmdbId}-${slug}`;
    const posterUrl = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null;
    const backdropUrl = details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null;
    const overview = details.overview || '';
    const rating = (details.vote_average || 0).toFixed(1);
    const genres = (details.genres || []);
    const creators = (details.created_by || []);
    const cast = (credits.cast || []).slice(0, 10);
    const trailer = (videos.results || []).find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    const similarItems = (similar.results || []).slice(0, 6);
    const providerIN = (providers.results || {}).IN || {};
    const providerUS = (providers.results || {}).US || {};
    const watchProviders = [...(providerIN.flatrate || []), ...(providerUS.flatrate || [])];
    const providerLink = providerIN.link || providerUS.link || null;
    const noindex = !overview;
    const seasons = details.number_of_seasons;

    const pageTitle = truncate(`${title}${year ? ' (' + year + ')' : ''} — Episodes, Cast & Where to Watch | MOVIE REDX`, 60);
    const metaDesc = truncate(overview || `Watch ${title}${year ? ' (' + year + ')' : ''} — streaming info, cast, and episodes on MOVIE REDX.`, 155);

    const tvJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TVSeries',
      name: title,
      url: canonical,
      datePublished: details.first_air_date || undefined,
      description: overview || undefined,
      image: posterUrl || undefined,
      genre: genres.map(g => g.name),
      creator: creators.map(c => ({ '@type': 'Person', name: c.name })),
      actor: cast.slice(0, 5).map(c => ({ '@type': 'Person', name: c.name })),
      numberOfSeasons: seasons || undefined,
      aggregateRating: details.vote_count > 10 ? {
        '@type': 'AggregateRating',
        ratingValue: rating,
        ratingCount: details.vote_count,
        bestRating: '10',
        worstRating: '0'
      } : undefined
    };

    const breadcrumb = breadcrumbJsonLd([
      { name: 'Home', url: SITE_URL + '/' },
      { name: 'TV Shows', url: SITE_URL + '/tv' },
      { name: title, url: canonical }
    ]);

    let html = sharedHead({
      title: pageTitle,
      desc: metaDesc,
      canonical,
      ogImage: backdropUrl || posterUrl,
      noindex,
      jsonld: `<script type="application/ld+json">${JSON.stringify(tvJsonLd)}</script>${breadcrumb}`
    });
    html += sharedNav();
    html += `
<main style="max-width:1200px;margin:30px auto;padding:0 20px;">
  <div style="display:grid;grid-template-columns:220px 1fr;gap:30px;margin-bottom:40px;">
    ${posterUrl ? `<img src="${escHtml(posterUrl)}" alt="${escHtml(title)} TV series poster" width="220" height="330" style="border-radius:16px;width:100%;height:auto;box-shadow:0 16px 48px rgba(0,0,0,.7);" loading="lazy">` : '<div style="width:220px;height:330px;background:#1a2744;border-radius:16px;"></div>'}
    <div>
      <h1 style="font-size:2rem;font-weight:900;color:#fff;margin-bottom:8px;">${escHtml(title)}${year ? ` <span style="color:#94a3b8;font-weight:400;font-size:1.3rem;">(${escHtml(year)})</span>` : ''}</h1>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
        <span style="background:rgba(245,197,24,.15);color:#f5c518;border:1px solid rgba(245,197,24,.3);padding:4px 12px;border-radius:20px;font-weight:800;">★ ${escHtml(rating)}</span>
        ${seasons ? `<span style="background:rgba(255,255,255,.08);color:#cbd5e1;padding:4px 12px;border-radius:20px;">${escHtml(String(seasons))} Season${seasons > 1 ? 's' : ''}</span>` : ''}
        ${langHint ? `<span style="background:rgba(229,9,20,.15);color:#ff6b7a;border:1px solid rgba(229,9,20,.3);padding:4px 12px;border-radius:20px;font-weight:700;">${escHtml(langHint)}</span>` : ''}
      </div>
      ${genres.length ? `<div style="margin-bottom:16px;">${genres.map(g => `<a href="/genre/${slugify(g.name)}" style="display:inline-block;background:rgba(0,210,255,.1);border:1px solid rgba(0,210,255,.3);color:#00d2ff;padding:4px 14px;border-radius:20px;margin:3px;text-decoration:none;font-size:.85rem;">${escHtml(g.name)}</a>`).join('')}</div>` : ''}
      ${creators.length ? `<p style="color:#cbd5e1;margin-bottom:8px;"><strong style="color:#fff;">Created by:</strong> ${creators.map(c => escHtml(c.name)).join(', ')}</p>` : ''}
      ${overview ? `<p style="color:#94a3b8;line-height:1.8;margin-bottom:20px;">${escHtml(overview)}</p>` : ''}
      <a href="/watch.html?tmdb=${tmdbId}&type=tv${langHint ? '&lang=hi' : ''}" class="btn-play-hero" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;padding:12px 28px;border-radius:50px;background:linear-gradient(135deg,#e50914,#ff1e27);color:#fff;font-weight:800;font-size:1rem;box-shadow:0 8px 24px rgba(229,9,20,.4);">
        ▶ Watch Now
      </a>
    </div>
  </div>

  ${cast.length ? `
  <section style="margin-bottom:36px;" aria-label="Cast">
    <h2 style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:16px;">Top Cast</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:14px;">
      ${cast.map(person => `
      <div style="text-align:center;">
        <img src="${person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="${escHtml(person.name)}" width="110" height="165" loading="lazy" style="border-radius:12px;width:100%;height:auto;object-fit:cover;">
        <p style="color:#fff;font-size:.8rem;font-weight:700;margin:6px 0 2px;">${escHtml(person.name)}</p>
        <p style="color:#64748b;font-size:.72rem;">${escHtml(person.character || '')}</p>
      </div>`).join('')}
    </div>
  </section>` : ''}

  ${trailer ? `
  <section style="margin-bottom:36px;" aria-label="Official Trailer">
    <h2 style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:16px;">Official Trailer</h2>
    <div style="position:relative;aspect-ratio:16/9;background:#000;border-radius:16px;overflow:hidden;">
      <iframe src="https://www.youtube-nocookie.com/embed/${escHtml(trailer.key)}?rel=0&modestbranding=1" title="${escHtml(title)} — Official Trailer" loading="lazy" allowfullscreen style="width:100%;height:100%;border:none;" allow="encrypted-media"></iframe>
    </div>
  </section>` : ''}

  ${watchProviders.length ? `
  <section style="margin-bottom:36px;" aria-label="Where to Watch">
    <h2 style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:16px;">Where to Watch</h2>
    <div style="display:flex;flex-wrap:wrap;gap:12px;">
      ${watchProviders.map(p => `
      <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:8px 16px;">
        ${p.logo_path ? `<img src="https://image.tmdb.org/t/p/original${p.logo_path}" alt="${escHtml(p.provider_name)} logo" width="36" height="36" loading="lazy" style="border-radius:8px;">` : ''}
        <span style="color:#fff;font-weight:600;">${escHtml(p.provider_name)}</span>
      </div>`).join('')}
    </div>
    ${providerLink ? `<p style="margin-top:12px;"><a href="${escHtml(providerLink)}" target="_blank" rel="nofollow noopener" style="color:#00d2ff;">View all providers →</a></p>` : ''}
  </section>` : ''}

  ${similarItems.length ? `
  <section style="margin-bottom:36px;" aria-label="You May Also Like">
    <h2 style="font-size:1.3rem;font-weight:700;color:#fff;margin-bottom:16px;">You May Also Like</h2>
    <div class="movies-grid">${similarItems.map(m => posterCard(m, 'tv')).join('')}</div>
  </section>` : ''}
</main>`;
    html += sharedFooter();

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.send(html);
  } catch (err) {
    console.error('[SSR /tv] Error:', err.message);
    res.status(500).send(render500());
  }
});

// ─── Helper: render category page ─────────────────────────────────────────────
async function renderCategoryPage(req, res, { pageTitle, metaDesc, canonical, heading, subheading, breadcrumbs, noindex = false, tmdbEndpoint, tmdbParams = {}, mediaType = 'movie', currentPage = 1 }) {
  const hasFilter = req && req.query && Object.keys(req.query).some(k => k !== 'page');
  const params = { page: currentPage, ...tmdbParams };
  const data = await fetchTmdb(tmdbEndpoint, params);
  const items = (data.results || []);
  const totalPages = Math.min(data.total_pages || 1, 500);

  const breadcrumb = breadcrumbJsonLd(breadcrumbs);
  const ogImage = items[0]?.backdrop_path ? `https://image.tmdb.org/t/p/w780${items[0].backdrop_path}` : null;

  let html = sharedHead({
    title: truncate(pageTitle, 60),
    desc: truncate(metaDesc, 155),
    canonical,
    ogImage,
    noindex: Boolean(noindex || currentPage > 1 || hasFilter),
    jsonld: breadcrumb
  });
  html += sharedNav();
  html += `
<main style="max-width:1200px;margin:30px auto;padding:0 20px;">
  <h1 style="font-size:1.8rem;font-weight:900;color:#fff;margin-bottom:6px;">${escHtml(heading)}</h1>
  ${subheading ? `<p style="color:#94a3b8;margin-bottom:20px;">${escHtml(subheading)}</p>` : ''}
  <div class="movies-grid">${items.map(m => posterCard(m, mediaType)).join('')}</div>
  ${paginationHtml(currentPage, totalPages, canonical)}
</main>`;
  html += sharedFooter();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=3600');
  res.send(html);
}

// ─── SSR: /movies ─────────────────────────────────────────────────────────────
app.get('/movies', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const canonical = `${SITE_URL}/movies`;
  try {
    await renderCategoryPage(req, res, {
      pageTitle: 'Popular Movies 2026 — Stream & Discover | MOVIE REDX',
      metaDesc: 'Explore the most popular movies of 2026. Find cast details, trailers, ratings, and where to stream each film on MOVIE REDX.',
      canonical,
      heading: 'Popular Movies',
      subheading: 'Browse the most-watched movies and discover cast, trailers, and streaming providers.',
      breadcrumbs: [{ name: 'Home', url: SITE_URL + '/' }, { name: 'Movies', url: canonical }],
      tmdbEndpoint: '/movie/popular',
      mediaType: 'movie',
      currentPage: page
    });
  } catch (err) {
    console.error('[SSR /movies]', err.message);
    res.status(500).send(render500());
  }
});

// ─── SSR: /tv ─────────────────────────────────────────────────────────────────
app.get('/tv', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const canonical = `${SITE_URL}/tv`;
  try {
    await renderCategoryPage(req, res, {
      pageTitle: 'Popular TV Shows & Web Series 2026 | MOVIE REDX',
      metaDesc: 'Discover the most popular TV shows and web series of 2026. Find episodes, cast, trailers, and streaming providers on MOVIE REDX.',
      canonical,
      heading: 'Popular TV Shows & Series',
      subheading: 'Discover trending TV shows — episodes, cast credits, trailers, and where to stream.',
      breadcrumbs: [{ name: 'Home', url: SITE_URL + '/' }, { name: 'TV Shows', url: canonical }],
      tmdbEndpoint: '/tv/popular',
      mediaType: 'tv',
      currentPage: page
    });
  } catch (err) {
    console.error('[SSR /tv]', err.message);
    res.status(500).send(render500());
  }
});

// ─── SSR: /top-rated ──────────────────────────────────────────────────────────
app.get('/top-rated', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const canonical = `${SITE_URL}/top-rated`;
  try {
    await renderCategoryPage(req, res, {
      pageTitle: 'Top Rated Movies of All Time | MOVIE REDX',
      metaDesc: 'Browse the highest-rated movies of all time, ranked by audience votes. Find trailers, cast, and streaming info on MOVIE REDX.',
      canonical,
      heading: 'Top Rated Movies',
      subheading: 'The highest-rated films of all time, as voted by millions of audience members worldwide.',
      breadcrumbs: [{ name: 'Home', url: SITE_URL + '/' }, { name: 'Top Rated', url: canonical }],
      tmdbEndpoint: '/movie/top_rated',
      mediaType: 'movie',
      currentPage: page
    });
  } catch (err) {
    console.error('[SSR /top-rated]', err.message);
    res.status(500).send(render500());
  }
});

// ─── SSR: /upcoming ───────────────────────────────────────────────────────────
app.get('/upcoming', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const canonical = `${SITE_URL}/upcoming`;
  try {
    await renderCategoryPage(req, res, {
      pageTitle: 'Upcoming Movie Releases 2026 | MOVIE REDX',
      metaDesc: 'Preview upcoming movie releases for 2026. Get trailers, cast details, and release dates for the most anticipated films.',
      canonical,
      heading: 'Upcoming Movie Releases',
      subheading: 'Preview the most anticipated upcoming films with trailers, cast, and release dates.',
      breadcrumbs: [{ name: 'Home', url: SITE_URL + '/' }, { name: 'Upcoming', url: canonical }],
      tmdbEndpoint: '/movie/upcoming',
      mediaType: 'movie',
      currentPage: page
    });
  } catch (err) {
    console.error('[SSR /upcoming]', err.message);
    res.status(500).send(render500());
  }
});

// ─── SSR: /hindi-dubbed ───────────────────────────────────────────────────────
app.get('/hindi-dubbed', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const canonical = `${SITE_URL}/hindi-dubbed`;
  try {
    await renderCategoryPage(req, res, {
      pageTitle: 'Hindi Cinema — Bollywood Movies 2026 | MOVIE REDX',
      metaDesc: 'Explore popular Bollywood and Hindi language films. Find cast, trailers, ratings, and streaming providers for Hindi cinema on MOVIE REDX.',
      canonical,
      heading: 'Hindi Cinema & Bollywood',
      subheading: 'Discover popular Bollywood films and Hindi cinema — cast credits, trailers, ratings, and streaming info.',
      breadcrumbs: [{ name: 'Home', url: SITE_URL + '/' }, { name: 'Hindi Cinema', url: canonical }],
      tmdbEndpoint: '/discover/movie',
      tmdbParams: { with_original_language: 'hi', sort_by: 'popularity.desc' },
      mediaType: 'movie',
      currentPage: page
    });
  } catch (err) {
    console.error('[SSR /hindi-dubbed]', err.message);
    res.status(500).send(render500());
  }
});

// ─── SSR: /genre/:slug ────────────────────────────────────────────────────────
app.get('/genre/:slug', async (req, res) => {
  const slug = req.params.slug;
  const genreId = genreSlugToId(slug);
  const genreName = genreNameBySlug(slug);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const canonical = `${SITE_URL}/genre/${slug}`;

  if (!genreId) {
    return res.status(404).send(render404());
  }

  try {
    await renderCategoryPage(req, res, {
      pageTitle: `${genreName} Movies 2026 — Cast & Streaming Info | MOVIE REDX`,
      metaDesc: `Discover the best ${genreName} movies. Find cast credits, trailers, ratings, and where to stream each film on MOVIE REDX.`,
      canonical,
      heading: `${genreName} Movies`,
      subheading: `Browse popular ${genreName} films — cast, trailers, ratings, and streaming info.`,
      breadcrumbs: [
        { name: 'Home', url: SITE_URL + '/' },
        { name: 'Movies', url: SITE_URL + '/movies' },
        { name: genreName, url: canonical }
      ],
      tmdbEndpoint: '/discover/movie',
      tmdbParams: { with_genres: genreId, sort_by: 'popularity.desc' },
      mediaType: 'movie',
      currentPage: page
    });
  } catch (err) {
    console.error(`[SSR /genre/${slug}]`, err.message);
    res.status(500).send(render500());
  }
});

// ─── Legacy redirect: /watch?tmdb=X → /movie/X-slug ──────────────────────────
app.get('/watch', async (req, res) => {
  const tmdbId = req.query.tmdb;
  const type = req.query.type === 'tv' ? 'tv' : 'movie';
  if (!tmdbId) return res.sendFile(path.join(__dirname, 'public', 'watch.html'));

  try {
    const endpoint = type === 'tv' ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
    const details = await fetchTmdb(endpoint);
    if (details && details.id) {
      const title = details.title || details.name || 'watch';
      const slug = slugify(title);
      const langSuffix = req.query.lang ? `?lang=${req.query.lang}` : '';
      return res.redirect(301, `/${type}/${tmdbId}-${slug}${langSuffix}`);
    }
  } catch (e) {
    // fallback — serve the watch page
  }
  res.sendFile(path.join(__dirname, 'public', 'watch.html'));
});

// ─── Static page routes ───────────────────────────────────────────────────────
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'public', 'terms.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/dmca', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dmca.html')));




// ─── Error pages ─────────────────────────────────────────────────────────────
function render404() {
  const canonical = `${SITE_URL}/`;
  let html = sharedHead({ title: '404 – Page Not Found | MOVIE REDX', desc: 'This page was not found. Browse popular movies and TV shows on MOVIE REDX.', canonical, noindex: true, jsonld: '' });
  html += sharedNav();
  html += `<main style="max-width:600px;margin:80px auto;padding:0 20px;text-align:center;">
    <h1 style="font-size:3rem;font-weight:900;color:#e50914;">404</h1>
    <h2 style="color:#fff;margin-bottom:16px;">Page Not Found</h2>
    <p style="color:#94a3b8;margin-bottom:24px;">The page you're looking for doesn't exist or has been moved.</p>
    <a href="/" style="background:linear-gradient(135deg,#e50914,#ff1e27);color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:800;">← Back to Home</a>
  </main>`;
  html += sharedFooter();
  return html;
}

function render500() {
  const canonical = `${SITE_URL}/`;
  let html = sharedHead({ title: 'Server Error | MOVIE REDX', desc: 'A temporary server error occurred. Please try again.', canonical, noindex: true, jsonld: '' });
  html += sharedNav();
  html += `<main style="max-width:600px;margin:80px auto;padding:0 20px;text-align:center;">
    <h1 style="font-size:3rem;font-weight:900;color:#e50914;">500</h1>
    <h2 style="color:#fff;margin-bottom:16px;">Something Went Wrong</h2>
    <p style="color:#94a3b8;margin-bottom:24px;">We couldn't load this page. Please try again in a moment.</p>
    <a href="/" style="background:linear-gradient(135deg,#e50914,#ff1e27);color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:800;">← Back to Home</a>
  </main>`;
  html += sharedFooter();
  return html;
}


// Health check endpoint (used by keep-alive ping) — must be BEFORE 404 handler
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString(), cache: tmdbCache.size });
});

app.use((req, res) => {
  res.status(404).send(render404());
});


// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎬 MOVIE REDX Platform is running!`);
  console.log(`🌐 Website URL:  http://localhost:${PORT}`);
  console.log(`📺 Movie Page:   http://localhost:${PORT}/movie/550-fight-club`);
  console.log(`📺 TV Page:      http://localhost:${PORT}/tv/1399-game-of-thrones`);
  console.log(`📄 Sitemap:      http://localhost:${PORT}/sitemap.xml`);
  console.log(`⚙️  Admin Panel:  http://localhost:${PORT}/admin.html (Master PIN: 8084)`);
  console.log(`====================================================`);

  // ── Keep-Alive Self-Ping ─────────────────────────────────────────
  const LIVE_URL = SITE_URL;
  const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
  if (process.env.PORT && process.env.PORT !== '3000') {
    setInterval(async () => {
      try {
        await new Promise((resolve, reject) => {
          const u = new URL(`${LIVE_URL}/health`);
          const req2 = https.get({ hostname: u.hostname, path: u.pathname, family: 4, headers: { 'Accept': 'application/json' } }, (r) => { r.resume(); resolve(r.statusCode); });
          req2.on('error', reject);
          req2.setTimeout(10000, () => req2.destroy());
        }).then(code => console.log(`[KeepAlive] Pinged ${LIVE_URL}/health → ${code}`));
      } catch (err) {
        console.warn(`[KeepAlive] Ping failed: ${err.message}`);
      }
    }, PING_INTERVAL_MS);
    console.log(`🟢 Keep-Alive enabled — pinging ${LIVE_URL}/health every 14 min`);
  }
  // ─────────────────────────────────────────────────────────────────
});
