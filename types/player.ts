import { VideoSource, SubtitleTrack } from './movie';

export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPiP: boolean;
  selectedAudioLanguage: string; // 'English' | 'Hindi' | etc.
  selectedQuality: string; // 'Auto' | '1080p' | '720p' | '480p'
  selectedSubtitle: string; // 'off' | 'English' | 'Hindi'
  isLoading: boolean;
  isBuffering: boolean;
  errorMessage?: string;
  hasHindiAudio: boolean;
  hasEnglishAudio: boolean;
}

export interface WatchProgress {
  contentId: string;
  contentType: 'movie' | 'episode';
  title: string;
  slug: string;
  posterUrl: string;
  backdropUrl: string;
  currentTime: number;
  duration: number;
  percentage: number;
  lastWatchedAt: string;
  audioLanguage?: string;
}
