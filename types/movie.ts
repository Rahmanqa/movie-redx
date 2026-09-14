export type ContentType = 'movie' | 'tv';

export type ContentRights = 
  | 'licensed' 
  | 'public_domain' 
  | 'owner_uploaded' 
  | 'authorized_external' 
  | 'pending_review';

export interface Genre {
  id: number | string;
  name: string;
  slug: string;
}

export interface VideoSource {
  id: string;
  movieId?: string;
  tvShowId?: string;
  episodeId?: string;
  language: 'English' | 'Hindi' | string;
  videoUrl: string;
  streamType: 'HLS' | 'MP4' | 'DASH' | 'EMBED';
  quality: '480p' | '720p' | '1080p' | '4K' | 'Auto';
  isDefault: boolean;
  isActive: boolean;
  contentRights: ContentRights;
  serverName?: string;
  createdAt?: string;
}

export interface SubtitleTrack {
  id: string;
  movieId?: string;
  tvShowId?: string;
  episodeId?: string;
  language: 'English' | 'Hindi' | string;
  label: string;
  subtitleUrl: string;
  format: 'vtt' | 'srt';
  isDefault: boolean;
  isActive: boolean;
}

export interface CastMember {
  id: string | number;
  name: string;
  character?: string;
  profilePath?: string;
}

export interface CrewMember {
  id: string | number;
  name: string;
  job: string;
}

export interface Movie {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  releaseDate: string;
  releaseYear: number;
  runtimeMinutes: number;
  rating: number;
  voteCount: number;
  genres: Genre[];
  audioLanguages: string[]; // e.g. ['English', 'Hindi']
  subtitleLanguages: string[];
  qualities: string[]; // e.g. ['1080p', '4K']
  country?: string;
  director?: string;
  writers?: string[];
  cast: CastMember[];
  crew?: CrewMember[];
  tmdbId?: number;
  isFeatured: boolean;
  isTrending: boolean;
  isPublished: boolean;
  contentRights: ContentRights;
  videoSources: VideoSource[];
  subtitles: SubtitleTrack[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt?: string;
}

export interface Episode {
  id: string;
  tvShowId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview: string;
  airDate?: string;
  runtimeMinutes?: number;
  thumbnailUrl: string;
  audioLanguages: string[];
  subtitleLanguages: string[];
  videoSources: VideoSource[];
  subtitles: SubtitleTrack[];
}

export interface Season {
  id: string;
  tvShowId: string;
  seasonNumber: number;
  name: string;
  overview?: string;
  posterUrl?: string;
  episodesCount: number;
  episodes: Episode[];
}

export interface TVShow {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  firstAirDate: string;
  rating: number;
  voteCount: number;
  genres: Genre[];
  audioLanguages: string[];
  subtitleLanguages: string[];
  seasonsCount: number;
  episodesCount: number;
  cast: CastMember[];
  seasons: Season[];
  tmdbId?: number;
  isFeatured: boolean;
  isTrending: boolean;
  isPublished: boolean;
  contentRights: ContentRights;
}

export interface AdSetting {
  id: string;
  placement: 'pre_roll' | 'top_banner' | 'sidebar' | 'under_player' | 'footer';
  isEnabled: boolean;
  title: string;
  description?: string;
  ctaText?: string;
  destinationUrl?: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'custom_html';
  customHtml?: string;
  durationSeconds?: number;
  canSkipAfterSeconds?: number;
}
