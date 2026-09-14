import { Movie, TVShow, VideoSource, SubtitleTrack, AdSetting, Genre } from '@/types/movie';
import { createServerSupabase } from '@/lib/supabase/server';
import { DEFAULT_GENRES, INITIAL_ADS } from '@/lib/constants';

export const INITIAL_MOVIES: Movie[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'tears-of-steel',
    title: 'Tears of Steel',
    originalTitle: 'Tears of Steel (Sci-Fi Amsterdam)',
    overview: 'In a dystopian future set in Amsterdam, a desperate group of scientists and warriors attempt to save the world by staging a critical memory transfer to halt destructive robotic cyborgs.',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=R6MlUcmOul8',
    releaseDate: '2024-03-15',
    releaseYear: 2024,
    runtimeMinutes: 12,
    rating: 8.6,
    voteCount: 1420,
    genres: [
      { id: 878, name: 'Sci-Fi', slug: 'sci-fi' },
      { id: 28, name: 'Action', slug: 'action' },
      { id: 53, name: 'Thriller', slug: 'thriller' }
    ],
    audioLanguages: ['English', 'Hindi'],
    subtitleLanguages: ['English', 'Hindi'],
    qualities: ['1080p', '4K'],
    country: 'Netherlands / US',
    director: 'Ian Hubert',
    writers: ['Ian Hubert'],
    cast: [
      { id: '1', name: 'Derek de Lint', character: 'Old Thom' },
      { id: '2', name: 'Sergio Hasselbaink', character: 'Barro' },
      { id: '3', name: 'Rogier Schippers', character: 'Captain' },
      { id: '4', name: 'Vanja Rukavina', character: 'Frank' }
    ],
    isFeatured: true,
    isTrending: true,
    isPublished: true,
    contentRights: 'public_domain',
    seoTitle: 'Watch Tears of Steel (2024) Online - English & Hindi Streaming | REDX CINEMA',
    seoDescription: 'Stream Tears of Steel in 1080p Full HD with dual English and Hindi audio support and subtitles on REDX CINEMA.',
    videoSources: [
      {
        id: '10000000-0000-0000-0000-000000000001',
        movieId: '00000000-0000-0000-0000-000000000001',
        language: 'English',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        streamType: 'MP4',
        quality: '1080p',
        isDefault: true,
        isActive: true,
        contentRights: 'public_domain'
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        movieId: '00000000-0000-0000-0000-000000000001',
        language: 'Hindi',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        streamType: 'MP4',
        quality: '1080p',
        isDefault: false,
        isActive: true,
        contentRights: 'public_domain'
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        movieId: '00000000-0000-0000-0000-000000000001',
        language: 'English',
        videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        streamType: 'HLS',
        quality: 'Auto',
        isDefault: false,
        isActive: true,
        contentRights: 'public_domain'
      }
    ],
    subtitles: [
      {
        id: '20000000-0000-0000-0000-000000000001',
        movieId: '00000000-0000-0000-0000-000000000001',
        language: 'English',
        label: 'English [CC]',
        subtitleUrl: '/subtitles/tears-en.vtt',
        format: 'vtt',
        isDefault: true,
        isActive: true
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        movieId: '00000000-0000-0000-0000-000000000001',
        language: 'Hindi',
        label: 'Hindi [हिन्दी]',
        subtitleUrl: '/subtitles/tears-hi.vtt',
        format: 'vtt',
        isDefault: false,
        isActive: true
      }
    ]
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    slug: 'sintel',
    title: 'Sintel: The Dragon Quest',
    originalTitle: 'Sintel',
    overview: 'A lonely young woman named Sintel forms an unbreakable bond with a wounded baby dragon. When the beast is captured by an adult dragon, she embarks on a treacherous odyssey across icy peaks and barren deserts to save it.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=eRsGyueVLvQ',
    releaseDate: '2023-11-20',
    releaseYear: 2023,
    runtimeMinutes: 15,
    rating: 8.8,
    voteCount: 2150,
    genres: [
      { id: 16, name: 'Animation', slug: 'animation' },
      { id: 14, name: 'Fantasy', slug: 'fantasy' },
      { id: 12, name: 'Adventure', slug: 'adventure' }
    ],
    audioLanguages: ['English', 'Hindi'],
    subtitleLanguages: ['English', 'Hindi'],
    qualities: ['1080p'],
    country: 'Netherlands',
    director: 'Colin Levy',
    writers: ['Esther Pearl', 'Martin Lodewijk'],
    cast: [
      { id: '1', name: 'Halina Reijn', character: 'Sintel (voice)' },
      { id: '2', name: 'Thom Hoffman', character: 'Shaman (voice)' }
    ],
    isFeatured: true,
    isTrending: true,
    isPublished: true,
    contentRights: 'licensed',
    seoTitle: 'Watch Sintel (The Dragon Quest) - English & Hindi Streaming | REDX CINEMA',
    seoDescription: 'Stream fantasy animation Sintel with English and Hindi audio on REDX CINEMA.',
    videoSources: [
      {
        id: '10000000-0000-0000-0000-000000000004',
        movieId: '00000000-0000-0000-0000-000000000002',
        language: 'English',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        streamType: 'MP4',
        quality: '1080p',
        isDefault: true,
        isActive: true,
        contentRights: 'licensed'
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        movieId: '00000000-0000-0000-0000-000000000002',
        language: 'Hindi',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        streamType: 'MP4',
        quality: '720p',
        isDefault: false,
        isActive: true,
        contentRights: 'licensed'
      }
    ],
    subtitles: [
      {
        id: '20000000-0000-0000-0000-000000000003',
        movieId: '00000000-0000-0000-0000-000000000002',
        language: 'English',
        label: 'English [CC]',
        subtitleUrl: '/subtitles/sintel-en.vtt',
        format: 'vtt',
        isDefault: true,
        isActive: true
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        movieId: '00000000-0000-0000-0000-000000000002',
        language: 'Hindi',
        label: 'Hindi [हिन्दी]',
        subtitleUrl: '/subtitles/sintel-hi.vtt',
        format: 'vtt',
        isDefault: false,
        isActive: true
      }
    ]
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    slug: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    originalTitle: 'A Large and Lovable Rabbit',
    overview: 'A gentle, gigantic forest rabbit reaches his breaking point when a trio of bullying woodland creatures begin terrorizing helpless forest critters. A hilariously creative revenge plan unfolds.',
    posterUrl: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    releaseDate: '2024-01-10',
    releaseYear: 2024,
    runtimeMinutes: 10,
    rating: 8.2,
    voteCount: 980,
    genres: [
      { id: 16, name: 'Animation', slug: 'animation' },
      { id: 35, name: 'Comedy', slug: 'comedy' },
      { id: 10751, name: 'Family', slug: 'family' }
    ],
    audioLanguages: ['English', 'Hindi'],
    subtitleLanguages: ['English', 'Hindi'],
    qualities: ['1080p', '4K'],
    country: 'US',
    director: 'Sacha Goedegebure',
    writers: ['Sacha Goedegebure'],
    cast: [
      { id: '1', name: 'Big Bunny', character: 'Self' },
      { id: '2', name: 'Frank', character: 'Squirrel' }
    ],
    isFeatured: true,
    isTrending: false,
    isPublished: true,
    contentRights: 'public_domain',
    videoSources: [
      {
        id: '10000000-0000-0000-0000-000000000006',
        movieId: '00000000-0000-0000-0000-000000000003',
        language: 'English',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        streamType: 'MP4',
        quality: '1080p',
        isDefault: true,
        isActive: true,
        contentRights: 'public_domain'
      },
      {
        id: '10000000-0000-0000-0000-000000000007',
        movieId: '00000000-0000-0000-0000-000000000003',
        language: 'Hindi',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        streamType: 'MP4',
        quality: '1080p',
        isDefault: false,
        isActive: true,
        contentRights: 'public_domain'
      }
    ],
    subtitles: []
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    slug: 'night-of-the-living-dead',
    title: 'Night of the Living Dead',
    originalTitle: 'Night of the Flesh Eaters',
    overview: 'A disparate group of individuals seek refuge in an abandoned farmhouse when corpses mysteriously rise from their graves hungering for human flesh. The landmark horror classic in remastered HD.',
    posterUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=0vgYpA_uGkQ',
    releaseDate: '1968-10-01',
    releaseYear: 1968,
    runtimeMinutes: 96,
    rating: 9.0,
    voteCount: 4320,
    genres: [
      { id: 27, name: 'Horror', slug: 'horror' },
      { id: 53, name: 'Thriller', slug: 'thriller' }
    ],
    audioLanguages: ['English', 'Hindi'],
    subtitleLanguages: ['English'],
    qualities: ['720p'],
    country: 'US',
    director: 'George A. Romero',
    writers: ['John Russo', 'George A. Romero'],
    cast: [
      { id: '1', name: 'Duane Jones', character: 'Ben' },
      { id: '2', name: 'Judith ODea', character: 'Barbra' }
    ],
    isFeatured: false,
    isTrending: true,
    isPublished: true,
    contentRights: 'public_domain',
    videoSources: [
      {
        id: '10000000-0000-0000-0000-000000000008',
        movieId: '00000000-0000-0000-0000-000000000004',
        language: 'English',
        videoUrl: 'https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4',
        streamType: 'MP4',
        quality: '720p',
        isDefault: true,
        isActive: true,
        contentRights: 'public_domain'
      },
      {
        id: '10000000-0000-0000-0000-000000000009',
        movieId: '00000000-0000-0000-0000-000000000004',
        language: 'Hindi',
        videoUrl: 'https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4',
        streamType: 'MP4',
        quality: '720p',
        isDefault: false,
        isActive: true,
        contentRights: 'public_domain'
      }
    ],
    subtitles: []
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    slug: 'elephants-dream',
    title: 'Elephants Dream: Machine Heart',
    originalTitle: 'Elephants Dream',
    overview: 'Two wanderers explore a giant, mysterious clockwork machine created from dreams and labyrinthine contraptions, uncovering philosophical reflections on communication and destiny.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=TLkA0RELQ1g',
    releaseDate: '2022-08-14',
    releaseYear: 2022,
    runtimeMinutes: 11,
    rating: 8.0,
    voteCount: 640,
    genres: [
      { id: 16, name: 'Animation', slug: 'animation' },
      { id: 878, name: 'Sci-Fi', slug: 'sci-fi' }
    ],
    audioLanguages: ['English', 'Hindi'],
    subtitleLanguages: ['English'],
    qualities: ['1080p'],
    country: 'Netherlands',
    director: 'Bassam Kurdali',
    writers: ['Bassam Kurdali'],
    cast: [
      { id: '1', name: 'Tygo Gernandt', character: 'Proog (voice)' },
      { id: '2', name: 'Cas Jansen', character: 'Emo (voice)' }
    ],
    isFeatured: false,
    isTrending: false,
    isPublished: true,
    contentRights: 'public_domain',
    videoSources: [
      {
        id: '10000000-0000-0000-0000-000000000010',
        movieId: '00000000-0000-0000-0000-000000000005',
        language: 'English',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        streamType: 'MP4',
        quality: '1080p',
        isDefault: true,
        isActive: true,
        contentRights: 'public_domain'
      },
      {
        id: '10000000-0000-0000-0000-000000000011',
        movieId: '00000000-0000-0000-0000-000000000005',
        language: 'Hindi',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        streamType: 'MP4',
        quality: '1080p',
        isDefault: false,
        isActive: true,
        contentRights: 'public_domain'
      }
    ],
    subtitles: []
  }
];

export const INITIAL_TV_SHOWS: TVShow[] = [
  {
    id: 'tv-00000000-0000-0000-0000-000000000001',
    slug: 'cosmos-odyssey',
    title: 'Cosmos: Galactic Odyssey',
    originalTitle: 'Cosmos Odyssey',
    overview: 'An epic scientific and philosophical journey through space, time, interstellar civilizations, and quantum phenomena.',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    firstAirDate: '2023-09-01',
    rating: 9.3,
    voteCount: 1850,
    genres: [
      { id: 99, name: 'Documentary', slug: 'documentary' },
      { id: 878, name: 'Sci-Fi', slug: 'sci-fi' }
    ],
    audioLanguages: ['English', 'Hindi'],
    subtitleLanguages: ['English', 'Hindi'],
    seasonsCount: 1,
    episodesCount: 3,
    cast: [
      { id: '1', name: 'Dr. Evelyn Vance', character: 'Astrophysicist Host' }
    ],
    isFeatured: true,
    isTrending: true,
    isPublished: true,
    contentRights: 'licensed',
    seasons: [
      {
        id: 'season-1',
        tvShowId: 'tv-00000000-0000-0000-0000-000000000001',
        seasonNumber: 1,
        name: 'Season 1: Deep Frontiers',
        overview: 'Exploring black holes, nebulae, and early cosmic origins.',
        episodesCount: 3,
        episodes: [
          {
            id: 'ep-1',
            tvShowId: 'tv-00000000-0000-0000-0000-000000000001',
            seasonNumber: 1,
            episodeNumber: 1,
            title: 'S01E01 - The Cosmic Horizon',
            overview: 'Journey to the edge of the observable universe and witness stellar births in the Orion Nebula.',
            runtimeMinutes: 12,
            thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
            audioLanguages: ['English', 'Hindi'],
            subtitleLanguages: ['English', 'Hindi'],
            videoSources: [
              {
                id: 'src-ep1-en',
                language: 'English',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                streamType: 'MP4',
                quality: '1080p',
                isDefault: true,
                isActive: true,
                contentRights: 'licensed'
              },
              {
                id: 'src-ep1-hi',
                language: 'Hindi',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                streamType: 'MP4',
                quality: '1080p',
                isDefault: false,
                isActive: true,
                contentRights: 'licensed'
              }
            ],
            subtitles: [
              {
                id: 'sub-ep1-en',
                language: 'English',
                label: 'English [CC]',
                subtitleUrl: '/subtitles/tears-en.vtt',
                format: 'vtt',
                isDefault: true,
                isActive: true
              }
            ]
          },
          {
            id: 'ep-2',
            tvShowId: 'tv-00000000-0000-0000-0000-000000000001',
            seasonNumber: 1,
            episodeNumber: 2,
            title: 'S01E02 - Secrets of the Abyss',
            overview: 'Investigating gravitational waves, dark matter, and supermassive black holes at the galactic core.',
            runtimeMinutes: 15,
            thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
            audioLanguages: ['English', 'Hindi'],
            subtitleLanguages: ['English'],
            videoSources: [
              {
                id: 'src-ep2-en',
                language: 'English',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                streamType: 'MP4',
                quality: '1080p',
                isDefault: true,
                isActive: true,
                contentRights: 'licensed'
              },
              {
                id: 'src-ep2-hi',
                language: 'Hindi',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                streamType: 'MP4',
                quality: '720p',
                isDefault: false,
                isActive: true,
                contentRights: 'licensed'
              }
            ],
            subtitles: []
          },
          {
            id: 'ep-3',
            tvShowId: 'tv-00000000-0000-0000-0000-000000000001',
            seasonNumber: 1,
            episodeNumber: 3,
            title: 'S01E03 - Alien Moons',
            overview: 'Subsurface oceans on Europa and Enceladus that could harbor microbial life.',
            runtimeMinutes: 10,
            thumbnailUrl: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=800&auto=format&fit=crop&q=80',
            audioLanguages: ['English', 'Hindi'],
            subtitleLanguages: ['English'],
            videoSources: [
              {
                id: 'src-ep3-en',
                language: 'English',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                streamType: 'MP4',
                quality: '1080p',
                isDefault: true,
                isActive: true,
                contentRights: 'licensed'
              }
            ],
            subtitles: []
          }
        ]
      }
    ]
  }
];



// In-Memory store for fast fallback & local runtime modifications
let memoryMovies: Movie[] = [...INITIAL_MOVIES];
let memoryTVShows: TVShow[] = [...INITIAL_TV_SHOWS];
let memoryAds: AdSetting[] = [...INITIAL_ADS];

export const ContentRepository = {
  async getAllMovies(): Promise<Movie[]> {
    const supabase = createServerSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('movies').select('*').eq('is_published', true);
        if (!error && data && data.length > 0) {
          // fetch sources and genres
          return memoryMovies;
        }
      } catch (err) {
        console.warn('Falling back to memory store for movies:', err);
      }
    }
    return memoryMovies;
  },

  async getMovieBySlug(slug: string): Promise<Movie | null> {
    const movie = memoryMovies.find((m) => m.slug === slug || m.id === slug);
    return movie || null;
  },

  async getFeaturedMovies(): Promise<Movie[]> {
    return memoryMovies.filter((m) => m.isFeatured);
  },

  async getTrendingMovies(): Promise<Movie[]> {
    return memoryMovies.filter((m) => m.isTrending);
  },

  async getHindiMovies(): Promise<Movie[]> {
    return memoryMovies.filter((m) => m.audioLanguages.includes('Hindi'));
  },

  async getEnglishMovies(): Promise<Movie[]> {
    return memoryMovies.filter((m) => m.audioLanguages.includes('English'));
  },

  async getTVShows(): Promise<TVShow[]> {
    return memoryTVShows;
  },

  async getTVShowBySlug(slug: string): Promise<TVShow | null> {
    const show = memoryTVShows.find((s) => s.slug === slug || s.id === slug);
    return show || null;
  },

  async getEpisode(slug: string, seasonNumber: number, episodeNumber: number) {
    const show = await this.getTVShowBySlug(slug);
    if (!show) return null;
    const season = show.seasons.find((s) => s.seasonNumber === seasonNumber);
    if (!season) return null;
    const episode = season.episodes.find((e) => e.episodeNumber === episodeNumber);
    return { show, season, episode: episode || null };
  },

  async getAds(): Promise<AdSetting[]> {
    return memoryAds;
  },

  async getAdByPlacement(placement: AdSetting['placement']): Promise<AdSetting | null> {
    return memoryAds.find((a) => a.placement === placement && a.isEnabled) || null;
  },

  async searchContent(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { movies: memoryMovies, tvShows: memoryTVShows };

    const movies = memoryMovies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.overview.toLowerCase().includes(q) ||
        m.genres.some((g) => g.name.toLowerCase().includes(q)) ||
        m.cast.some((c) => c.name.toLowerCase().includes(q)) ||
        m.director?.toLowerCase().includes(q)
    );

    const tvShows = memoryTVShows.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.overview.toLowerCase().includes(q) ||
        s.genres.some((g) => g.name.toLowerCase().includes(q))
    );

    return { movies, tvShows };
  },

  async saveMovie(movieData: Partial<Movie>): Promise<Movie> {
    const index = memoryMovies.findIndex((m) => m.id === movieData.id);
    if (index >= 0) {
      memoryMovies[index] = { ...memoryMovies[index], ...movieData } as Movie;
      return memoryMovies[index];
    } else {
      const newMovie: Movie = {
        id: movieData.id || `movie-${Date.now()}`,
        slug: movieData.slug || `movie-${Date.now()}`,
        title: movieData.title || 'Untitled Movie',
        overview: movieData.overview || '',
        posterUrl: movieData.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
        backdropUrl: movieData.backdropUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600',
        releaseDate: movieData.releaseDate || new Date().toISOString().split('T')[0],
        releaseYear: movieData.releaseYear || new Date().getFullYear(),
        runtimeMinutes: movieData.runtimeMinutes || 90,
        rating: movieData.rating || 8.0,
        voteCount: movieData.voteCount || 1,
        genres: movieData.genres || [{ id: 28, name: 'Action', slug: 'action' }],
        audioLanguages: movieData.audioLanguages || ['English', 'Hindi'],
        subtitleLanguages: movieData.subtitleLanguages || ['English'],
        qualities: movieData.qualities || ['1080p'],
        cast: movieData.cast || [],
        isFeatured: movieData.isFeatured ?? false,
        isTrending: movieData.isTrending ?? false,
        isPublished: movieData.isPublished ?? true,
        contentRights: movieData.contentRights || 'licensed',
        videoSources: movieData.videoSources || [],
        subtitles: movieData.subtitles || []
      };
      memoryMovies.push(newMovie);
      return newMovie;
    }
  },

  async updateAdSetting(adData: AdSetting): Promise<AdSetting> {
    const idx = memoryAds.findIndex((a) => a.placement === adData.placement);
    if (idx >= 0) {
      memoryAds[idx] = { ...memoryAds[idx], ...adData };
      return memoryAds[idx];
    } else {
      memoryAds.push(adData);
      return adData;
    }
  }
};
