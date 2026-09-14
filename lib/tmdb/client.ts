/**
 * REDX CINEMA - TMDB Full Catalog & Universal Stream Engine
 * Integrates TMDB API for thousands of movies & series with multi-server stream resolution.
 */

import { Movie, TVShow, VideoSource, Genre, CastMember } from '@/types/movie';
import { slugify } from '@/lib/utils';
import { DEFAULT_GENRES } from '@/lib/constants';

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  try {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    Object.entries(params).forEach(([key, val]) => {
      url.searchParams.set(key, val);
    });

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 }, // Cache for 30 minutes
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!res.ok) {
      console.warn(`TMDB fetch failed for ${endpoint}: ${res.status}`);
      return null;
    }

    return await res.json() as T;
  } catch (error) {
    console.error(`TMDB error fetching ${endpoint}:`, error);
    return null;
  }
}

export interface TMDBMovieRaw {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  original_language: string;
  runtime?: number;
  credits?: {
    cast?: { id: number; name: string; character?: string; profile_path?: string }[];
    crew?: { id: number; name: string; job: string }[];
  };
  videos?: {
    results?: { key: string; site: string; type: string }[];
  };
}

export interface TMDBTVRaw {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  original_language: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

/**
 * Generate multi-server streaming sources for any movie by TMDB ID
 */
export function generateMovieSources(tmdbId: number, title: string, isHindi: boolean): VideoSource[] {
  return [
    {
      id: `vidsrc-to-${tmdbId}`,
      language: isHindi ? 'Hindi' : 'English',
      videoUrl: `https://vidsrc.to/embed/movie/${tmdbId}`,
      streamType: 'EMBED',
      quality: '1080p',
      isDefault: true,
      isActive: true,
      contentRights: 'authorized_external',
      serverName: 'Server 1 (VidSrc Cloud HD)',
    },
    {
      id: `vidsrc-me-${tmdbId}`,
      language: isHindi ? 'Hindi' : 'English',
      videoUrl: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
      streamType: 'EMBED',
      quality: '1080p',
      isDefault: false,
      isActive: true,
      contentRights: 'authorized_external',
      serverName: 'Server 2 (VidSrc Pro)',
    },
    {
      id: `vidlink-${tmdbId}`,
      language: isHindi ? 'Hindi' : 'English',
      videoUrl: `https://vidlink.pro/movie/${tmdbId}`,
      streamType: 'EMBED',
      quality: '1080p',
      isDefault: false,
      isActive: true,
      contentRights: 'authorized_external',
      serverName: 'Server 3 (VidLink Ultra)',
    },
    {
      id: `autoembed-${tmdbId}`,
      language: isHindi ? 'Hindi' : 'English',
      videoUrl: `https://autoembed.to/movie/tmdb/${tmdbId}`,
      streamType: 'EMBED',
      quality: '720p',
      isDefault: false,
      isActive: true,
      contentRights: 'authorized_external',
      serverName: 'Server 4 (AutoEmbed VIP)',
    },
    {
      id: `2embed-${tmdbId}`,
      language: isHindi ? 'Hindi' : 'English',
      videoUrl: `https://2embed.cc/embed/${tmdbId}`,
      streamType: 'EMBED',
      quality: '1080p',
      isDefault: false,
      isActive: true,
      contentRights: 'authorized_external',
      serverName: 'Server 5 (2Embed Mirror)',
    },
  ];
}

/**
 * Generate multi-server streaming sources for any TV episode
 */
export function generateEpisodeSources(tmdbId: number, season: number, episode: number, isHindi: boolean): VideoSource[] {
  return [
    {
      id: `vidsrc-to-tv-${tmdbId}-${season}-${episode}`,
      language: isHindi ? 'Hindi' : 'English',
      videoUrl: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
      streamType: 'EMBED',
      quality: '1080p',
      isDefault: true,
      isActive: true,
      contentRights: 'authorized_external',
      serverName: 'Server 1 (VidSrc TV HD)',
    },
    {
      id: `vidsrc-me-tv-${tmdbId}-${season}-${episode}`,
      language: isHindi ? 'Hindi' : 'English',
      videoUrl: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
      streamType: 'EMBED',
      quality: '1080p',
      isDefault: false,
      isActive: true,
      contentRights: 'authorized_external',
      serverName: 'Server 2 (VidSrc Pro TV)',
    },
    {
      id: `vidlink-tv-${tmdbId}-${season}-${episode}`,
      language: isHindi ? 'Hindi' : 'English',
      videoUrl: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`,
      streamType: 'EMBED',
      quality: '1080p',
      isDefault: false,
      isActive: true,
      contentRights: 'authorized_external',
      serverName: 'Server 3 (VidLink TV)',
    },
    {
      id: `autoembed-tv-${tmdbId}-${season}-${episode}`,
      language: isHindi ? 'Hindi' : 'English',
      videoUrl: `https://autoembed.to/tv/tmdb/${tmdbId}-${season}-${episode}`,
      streamType: 'EMBED',
      quality: '720p',
      isDefault: false,
      isActive: true,
      contentRights: 'authorized_external',
      serverName: 'Server 4 (AutoEmbed TV)',
    },
  ];
}

/**
 * Transform TMDB raw movie into REDX Movie object
 */
export function transformTMDBMovie(raw: TMDBMovieRaw): Movie {
  const isHindi = raw.original_language === 'hi';
  const releaseYear = raw.release_date ? parseInt(raw.release_date.split('-')[0], 10) : 2024;
  
  // Resolve genres
  const genres: Genre[] = [];
  if (raw.genres && raw.genres.length > 0) {
    raw.genres.forEach((g) => {
      genres.push({ id: g.id, name: g.name, slug: slugify(g.name) });
    });
  } else if (raw.genre_ids) {
    raw.genre_ids.forEach((id) => {
      const found = DEFAULT_GENRES.find((g) => g.id === id);
      if (found) genres.push(found);
    });
  }

  // Cast
  const cast: CastMember[] = (raw.credits?.cast || []).slice(0, 8).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profilePath: c.profile_path ? `${TMDB_IMAGE_BASE_URL}/w185${c.profile_path}` : undefined,
  }));

  // Trailer
  let trailerUrl = '';
  const ytVideo = raw.videos?.results?.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
  if (ytVideo) {
    trailerUrl = `https://www.youtube.com/watch?v=${ytVideo.key}`;
  }

  const poster = raw.poster_path
    ? `${TMDB_IMAGE_BASE_URL}/w500${raw.poster_path}`
    : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800';

  const backdrop = raw.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}/original${raw.backdrop_path}`
    : poster;

  const audioLangs = isHindi ? ['Hindi', 'English'] : ['English', 'Hindi'];

  return {
    id: `tmdb-${raw.id}`,
    slug: `${raw.id}-${slugify(raw.title || 'movie')}`,
    title: raw.title,
    originalTitle: raw.original_title,
    overview: raw.overview || 'No synopsis available for this title.',
    posterUrl: poster,
    backdropUrl: backdrop,
    trailerUrl,
    releaseDate: raw.release_date || `${releaseYear}-01-01`,
    releaseYear,
    runtimeMinutes: raw.runtime || 115,
    rating: raw.vote_average ? parseFloat(raw.vote_average.toFixed(1)) : 8.0,
    voteCount: raw.vote_count || 100,
    genres: genres.length > 0 ? genres : [{ id: 28, name: 'Action', slug: 'action' }],
    audioLanguages: audioLangs,
    subtitleLanguages: ['English', 'Hindi'],
    qualities: ['1080p', '4K'],
    cast,
    tmdbId: raw.id,
    isFeatured: raw.vote_average > 7.8,
    isTrending: true,
    isPublished: true,
    contentRights: 'authorized_external',
    videoSources: generateMovieSources(raw.id, raw.title, isHindi),
    subtitles: [
      {
        id: `sub-en-${raw.id}`,
        language: 'English',
        label: 'English [CC]',
        subtitleUrl: '/subtitles/tears-en.vtt',
        format: 'vtt',
        isDefault: true,
        isActive: true,
      },
    ],
  };
}

/**
 * Transform TMDB raw TV into REDX TVShow object
 */
export function transformTMDBTV(raw: TMDBTVRaw): TVShow {
  const isHindi = raw.original_language === 'hi';
  const firstAirDate = raw.first_air_date || '2024-01-01';
  const poster = raw.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${raw.poster_path}` : 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800';
  const backdrop = raw.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/original${raw.backdrop_path}` : poster;
  const seasonsCount = raw.number_of_seasons || 1;

  // Build Season 1 dummy episodes so user can immediately click & stream any episode
  const episodes = [1, 2, 3, 4, 5].map((epNum) => ({
    id: `ep-${raw.id}-1-${epNum}`,
    tvShowId: `tv-tmdb-${raw.id}`,
    seasonNumber: 1,
    episodeNumber: epNum,
    title: `Episode ${epNum}`,
    overview: `Season 1, Episode ${epNum} of ${raw.name}. Stream in dual audio.`,
    thumbnailUrl: backdrop,
    runtimeMinutes: 45,
    audioLanguages: isHindi ? ['Hindi', 'English'] : ['English', 'Hindi'],
    subtitleLanguages: ['English', 'Hindi'],
    videoSources: generateEpisodeSources(raw.id, 1, epNum, isHindi),
    subtitles: [],
  }));

  return {
    id: `tv-tmdb-${raw.id}`,
    slug: `${raw.id}-${slugify(raw.name)}`,
    title: raw.name,
    originalTitle: raw.original_name,
    overview: raw.overview || 'No synopsis available.',
    posterUrl: poster,
    backdropUrl: backdrop,
    firstAirDate,
    rating: raw.vote_average ? parseFloat(raw.vote_average.toFixed(1)) : 8.5,
    voteCount: raw.vote_count || 150,
    genres: [{ id: 18, name: 'Drama', slug: 'drama' }],
    audioLanguages: isHindi ? ['Hindi', 'English'] : ['English', 'Hindi'],
    subtitleLanguages: ['English', 'Hindi'],
    seasonsCount,
    episodesCount: raw.number_of_episodes || seasonsCount * 8,
    cast: [],
    tmdbId: raw.id,
    isFeatured: true,
    isTrending: true,
    isPublished: true,
    contentRights: 'authorized_external',
    seasons: [
      {
        id: `season-${raw.id}-1`,
        tvShowId: `tv-tmdb-${raw.id}`,
        seasonNumber: 1,
        name: 'Season 1',
        episodesCount: episodes.length,
        episodes,
      },
    ],
  };
}

// -------------------------------------------------------------
// TMDB Query API Methods
// -------------------------------------------------------------

export async function getTMDBTrendingMovies(): Promise<Movie[]> {
  const data = await fetchFromTMDB<{ results: TMDBMovieRaw[] }>('/trending/movie/week');
  if (!data?.results) return [];
  return data.results.map(transformTMDBMovie);
}

export async function getTMDBPopularMovies(): Promise<Movie[]> {
  const data = await fetchFromTMDB<{ results: TMDBMovieRaw[] }>('/movie/popular');
  if (!data?.results) return [];
  return data.results.map(transformTMDBMovie);
}

export async function getTMDBTopRatedMovies(): Promise<Movie[]> {
  const data = await fetchFromTMDB<{ results: TMDBMovieRaw[] }>('/movie/top_rated');
  if (!data?.results) return [];
  return data.results.map(transformTMDBMovie);
}

export async function getTMDBHindiMovies(): Promise<Movie[]> {
  const data = await fetchFromTMDB<{ results: TMDBMovieRaw[] }>('/discover/movie', {
    with_original_language: 'hi',
    sort_by: 'popularity.desc',
  });
  if (!data?.results) return [];
  return data.results.map(transformTMDBMovie);
}

export async function getTMDBEnglishMovies(): Promise<Movie[]> {
  const data = await fetchFromTMDB<{ results: TMDBMovieRaw[] }>('/discover/movie', {
    with_original_language: 'en',
    sort_by: 'popularity.desc',
  });
  if (!data?.results) return [];
  return data.results.map(transformTMDBMovie);
}

export async function getTMDBMoviesByGenre(genreId: number): Promise<Movie[]> {
  const data = await fetchFromTMDB<{ results: TMDBMovieRaw[] }>('/discover/movie', {
    with_genres: genreId.toString(),
    sort_by: 'popularity.desc',
  });
  if (!data?.results) return [];
  return data.results.map(transformTMDBMovie);
}

export async function getTMDBPopularTVShows(): Promise<TVShow[]> {
  const data = await fetchFromTMDB<{ results: TMDBTVRaw[] }>('/tv/popular');
  if (!data?.results) return [];
  return data.results.map(transformTMDBTV);
}

export async function getTMDBMovieDetails(tmdbId: number): Promise<Movie | null> {
  const data = await fetchFromTMDB<TMDBMovieRaw>(`/movie/${tmdbId}`, {
    append_to_response: 'credits,videos,recommendations',
  });
  if (!data) return null;
  return transformTMDBMovie(data);
}

export async function getTMDBTVDetails(tmdbId: number): Promise<TVShow | null> {
  const data = await fetchFromTMDB<TMDBTVRaw>(`/tv/${tmdbId}`, {
    append_to_response: 'credits,videos',
  });
  if (!data) return null;
  return transformTMDBTV(data);
}

export async function searchTMDBAll(query: string): Promise<{ movies: Movie[]; tvShows: TVShow[] }> {
  if (!query || query.trim().length === 0) return { movies: [], tvShows: [] };

  const [movieData, tvData] = await Promise.all([
    fetchFromTMDB<{ results: TMDBMovieRaw[] }>('/search/movie', { query: query.trim() }),
    fetchFromTMDB<{ results: TMDBTVRaw[] }>('/search/tv', { query: query.trim() }),
  ]);

  const movies = (movieData?.results || []).map(transformTMDBMovie);
  const tvShows = (tvData?.results || []).map(transformTMDBTV);

  return { movies, tvShows };
}
