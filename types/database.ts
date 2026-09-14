export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin';
          preferred_audio_language: string | null;
          preferred_subtitle_language: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          preferred_audio_language?: string | null;
          preferred_subtitle_language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          preferred_audio_language?: string | null;
          preferred_subtitle_language?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      movies: {
        Row: {
          id: string;
          slug: string;
          title: string;
          original_title: string | null;
          overview: string;
          poster_url: string;
          backdrop_url: string;
          trailer_url: string | null;
          release_date: string;
          release_year: number;
          runtime_minutes: number;
          rating: number;
          vote_count: number;
          tmdb_id: number | null;
          is_featured: boolean;
          is_trending: boolean;
          is_published: boolean;
          content_rights: string;
          director: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      video_sources: {
        Row: {
          id: string;
          movie_id: string | null;
          tv_show_id: string | null;
          episode_id: string | null;
          language: string;
          video_url: string;
          stream_type: 'HLS' | 'MP4' | 'DASH';
          quality: string;
          is_default: boolean;
          is_active: boolean;
          content_rights: string;
          created_at: string;
        };
      };
      subtitles: {
        Row: {
          id: string;
          movie_id: string | null;
          tv_show_id: string | null;
          episode_id: string | null;
          language: string;
          label: string;
          subtitle_url: string;
          format: string;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
        };
      };
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          movie_id: string | null;
          tv_show_id: string | null;
          created_at: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          movie_id: string | null;
          tv_show_id: string | null;
          created_at: string;
        };
      };
      watch_history: {
        Row: {
          id: string;
          user_id: string;
          movie_id: string | null;
          episode_id: string | null;
          current_time: number;
          duration: number;
          last_watched_at: string;
        };
      };
      ad_settings: {
        Row: {
          id: string;
          placement: string;
          is_enabled: boolean;
          title: string;
          description: string | null;
          cta_text: string | null;
          destination_url: string | null;
          media_url: string | null;
          media_type: string;
          custom_html: string | null;
          duration_seconds: number | null;
          can_skip_after_seconds: number | null;
          created_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_type: string;
          target_id: string;
          details: Json | null;
          created_at: string;
        };
      };
    };
  };
}
