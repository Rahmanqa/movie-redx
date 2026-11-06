/**
 * CastleTV Hindi Stream Resolver
 * Dedicated high-speed resolver for Hindi Dubbed movies & TV shows
 */

const { createDecipheriv } = require('crypto');

const CASTLE_BASE = 'https://api.hlowb.com';
const PKG = 'com.external.castle';
const CHANNEL = 'IndiaA';
const CLIENT = '1';
const LANG = 'en-US';

const API_HEADERS = {
  'User-Agent': 'okhttp/4.9.3',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'Keep-Alive',
  'Referer': CASTLE_BASE
};

// In-memory cache for stream URLs (TTL: 1 hour)
const streamCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

// Security key cache
let cachedSecKey = null;
let secKeyExpires = 0;

function castleSafeParse(text) {
  const safe = text.replace(/([:{[,]\s*)(\d{16,})/g, '$1"$2"');
  return JSON.parse(safe);
}

function deriveKey(securityKey) {
  const keyBytes = Buffer.from(securityKey, 'base64');
  const suffix = Buffer.from('T!BgJB', 'utf8');
  const combined = Buffer.concat([keyBytes, suffix]);
  if (combined.length < 16) {
    return Buffer.concat([combined, Buffer.alloc(16 - combined.length, 0)]);
  }
  return combined.subarray(0, 16);
}

function decryptCastle(cipherText, securityKey) {
  const key = deriveKey(securityKey);
  const decipher = createDecipheriv('aes-128-cbc', key, key);
  decipher.setAutoPadding(true);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherText, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

async function castleRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...API_HEADERS, ...(options.headers || {}) },
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`Castle API error: HTTP ${res.status}`);
  return res;
}

async function extractCipher(res) {
  const text = await res.text();
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.data && typeof parsed.data === 'string') return parsed.data.trim();
  } catch {}
  return trimmed;
}

function unwrap(obj) {
  if (obj && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) return obj.data;
  return obj;
}

async function getSecurityKey() {
  const now = Date.now();
  if (cachedSecKey && now < secKeyExpires) {
    return cachedSecKey;
  }
  try {
    const url = `${CASTLE_BASE}/v0.1/system/getSecurityKey/1?channel=${CHANNEL}&clientType=${CLIENT}&lang=${LANG}`;
    const res = await castleRequest(url);
    const json = await res.json();
    if (json.code === 200 && json.data) {
      cachedSecKey = json.data;
      secKeyExpires = now + 4 * 60 * 60 * 1000; // 4 hours
      return cachedSecKey;
    }
  } catch (err) {
    console.warn('[CastleTV] Failed to fetch security key, using fallback:', err.message);
  }
  return 'ZkpBVG0qa2dmSg=='; // Fallback known working key
}

async function getVideoByLanguage(secKey, movieId, episodeId, languageId, resolution = 2) {
  const body = {
    mode: '1',
    appMarket: 'GuanWang',
    clientType: CLIENT,
    woolUser: 'false',
    apkSignKey: 'ED0955EB04E67A1D9F3305B95454FED485261475',
    androidVersion: '13',
    movieId: String(movieId),
    episodeId: String(episodeId),
    languageId: String(languageId),
    isNewUser: 'true',
    resolution: resolution.toString(),
    packageName: PKG
  };
  const url = `${CASTLE_BASE}/film-api/v2.0.1/movie/getVideo2?clientType=${CLIENT}&packageName=${PKG}&channel=${CHANNEL}&lang=${LANG}`;
  const res = await castleRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const cipher = await extractCipher(res);
  return castleSafeParse(decryptCastle(cipher, secKey));
}

/**
 * Resolve a Hindi dubbed stream URL for a given title, year, and optional season/episode
 */
async function resolveHindiStream({ title, year, type = 'movie', season = 1, episode = 1 }) {
  if (!title) return null;

  const cacheKey = `${type}:${title.toLowerCase()}:${year || ''}:${season}:${episode}`;
  const cached = streamCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  try {
    const secKey = await getSecurityKey();

    // 1. Search CastleTV with title
    const searchQueries = [];
    if (year) searchQueries.push(`${title} ${year}`);
    searchQueries.push(title);

    let rows = [];
    for (const q of searchQueries) {
      const params = new URLSearchParams({
        channel: CHANNEL,
        clientType: CLIENT,
        keyword: q,
        lang: LANG,
        mode: '1',
        packageName: PKG,
        page: '1',
        size: '10'
      });
      const res = await castleRequest(`${CASTLE_BASE}/film-api/v1.1.0/movie/searchByKeyword?${params}`);
      const cipher = await extractCipher(res);
      const searchRes = unwrap(castleSafeParse(decryptCastle(cipher, secKey)));
      if (searchRes.rows && searchRes.rows.length > 0) {
        rows = searchRes.rows;
        break;
      }
    }

    if (!rows.length) {
      return null;
    }

    // Match best row
    const titleLc = title.toLowerCase().trim();
    const matched = rows.find(r => {
      const rName = (r.title || r.name || '').toLowerCase().trim();
      return rName === titleLc || rName.includes(titleLc) || titleLc.includes(rName);
    }) || rows[0];

    if (!matched || !matched.id) return null;

    let activeMovieId = String(matched.id);

    // 2. Fetch movie/show details
    const detUrl = `${CASTLE_BASE}/film-api/v1.9.9/movie?channel=${CHANNEL}&clientType=${CLIENT}&lang=${LANG}&movieId=${activeMovieId}&packageName=${PKG}`;
    const detRes = await castleRequest(detUrl);
    const detCipher = await extractCipher(detRes);
    let details = unwrap(castleSafeParse(decryptCastle(detCipher, secKey)));

    let targetEpisode = null;

    if (type === 'tv' || type === 'series') {
      const seasons = details.seasons || [];
      const seasonNum = parseInt(season, 10) || 1;
      const targetSeason = seasons.find(s => s.number === seasonNum || s.seasonNumber === seasonNum) || seasons[0];

      if (targetSeason && targetSeason.movieId && String(targetSeason.movieId) !== activeMovieId) {
        activeMovieId = String(targetSeason.movieId);
        const sDetUrl = `${CASTLE_BASE}/film-api/v1.9.9/movie?channel=${CHANNEL}&clientType=${CLIENT}&lang=${LANG}&movieId=${activeMovieId}&packageName=${PKG}`;
        const sRes = await castleRequest(sDetUrl);
        const sCipher = await extractCipher(sRes);
        details = unwrap(castleSafeParse(decryptCastle(sCipher, secKey)));
      }

      const episodes = details.episodes || [];
      const epNum = parseInt(episode, 10) || 1;
      targetEpisode = episodes.find(e => e.number === epNum || e.episodeNumber === epNum) || episodes[epNum - 1] || episodes[0];
    } else {
      const episodes = details.episodes || [];
      targetEpisode = episodes[0];
    }

    if (!targetEpisode || !targetEpisode.id) {
      return null;
    }

    // 3. Find Hindi audio track
    const tracks = targetEpisode.tracks || [];
    const hindiTrack = tracks.find(t => 
      t.languageId === 1018 || 
      /hindi/i.test(t.languageName || t.abbreviate || '')
    ) || tracks[0];

    if (!hindiTrack) return null;

    // 4. Request video stream
    const resolutions = [2, 3, 1]; // Try 720p HD, then 1080p, then 480p
    let videoUrl = null;

    for (const res of resolutions) {
      try {
        const vidRaw = await getVideoByLanguage(secKey, activeMovieId, targetEpisode.id, hindiTrack.languageId, res);
        const vidData = unwrap(vidRaw);
        if (vidData && vidData.videoUrl) {
          videoUrl = vidData.videoUrl;
          break;
        }
      } catch (err) {
        // try next resolution
      }
    }

    if (!videoUrl) return null;

    const result = {
      streamUrl: videoUrl,
      title: matched.title || matched.name || title,
      language: hindiTrack.languageName || 'Hindi',
      isHindi: hindiTrack.languageId === 1018 || /hindi/i.test(hindiTrack.languageName || ''),
      season: type === 'tv' ? season : undefined,
      episode: type === 'tv' ? episode : undefined
    };

    streamCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL_MS });
    return result;

  } catch (err) {
    console.error(`[CastleTV Resolver] Error for "${title}":`, err.message);
    return null;
  }
}

module.exports = {
  resolveHindiStream,
  getSecurityKey
};
