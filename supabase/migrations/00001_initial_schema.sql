-- ==================================================================
-- REDX CINEMA - Supabase PostgreSQL Initial Migration Schema
-- Version: 00001_initial_schema.sql
-- ==================================================================

-- 1. Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    preferred_audio_language TEXT DEFAULT 'English',
    preferred_subtitle_language TEXT DEFAULT 'off',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Genres Table
CREATE TABLE IF NOT EXISTS public.genres (
    id SERIAL PRIMARY KEY,
    tmdb_id INT UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Movies Table
CREATE TABLE IF NOT EXISTS public.movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    original_title TEXT,
    overview TEXT NOT NULL,
    poster_url TEXT NOT NULL,
    backdrop_url TEXT NOT NULL,
    trailer_url TEXT,
    release_date DATE NOT NULL,
    release_year INT NOT NULL,
    runtime_minutes INT NOT NULL DEFAULT 0,
    rating NUMERIC(3,1) NOT NULL DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 10.0),
    vote_count INT NOT NULL DEFAULT 0,
    country TEXT DEFAULT 'US',
    director TEXT,
    writers TEXT[] DEFAULT '{}',
    cast_members JSONB DEFAULT '[]'::jsonb,
    tmdb_id INT UNIQUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    content_rights TEXT NOT NULL DEFAULT 'licensed' CHECK (content_rights IN ('licensed', 'public_domain', 'owner_uploaded', 'authorized_external', 'pending_review')),
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Movie Genres Junction
CREATE TABLE IF NOT EXISTS public.movie_genres (
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    genre_id INT NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- 6. TV Shows Table
CREATE TABLE IF NOT EXISTS public.tv_shows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    original_title TEXT,
    overview TEXT NOT NULL,
    poster_url TEXT NOT NULL,
    backdrop_url TEXT NOT NULL,
    trailer_url TEXT,
    first_air_date DATE NOT NULL,
    rating NUMERIC(3,1) NOT NULL DEFAULT 0.0,
    vote_count INT NOT NULL DEFAULT 0,
    tmdb_id INT UNIQUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    content_rights TEXT NOT NULL DEFAULT 'licensed',
    seasons_count INT DEFAULT 1,
    episodes_count INT DEFAULT 1,
    cast_members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TV Show Genres Junction
CREATE TABLE IF NOT EXISTS public.tv_show_genres (
    tv_show_id UUID NOT NULL REFERENCES public.tv_shows(id) ON DELETE CASCADE,
    genre_id INT NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
    PRIMARY KEY (tv_show_id, genre_id)
);

-- 8. TV Seasons
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tv_show_id UUID NOT NULL REFERENCES public.tv_shows(id) ON DELETE CASCADE,
    season_number INT NOT NULL,
    name TEXT NOT NULL,
    overview TEXT,
    poster_url TEXT,
    episodes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tv_show_id, season_number)
);

-- 9. TV Episodes
CREATE TABLE IF NOT EXISTS public.episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
    tv_show_id UUID NOT NULL REFERENCES public.tv_shows(id) ON DELETE CASCADE,
    season_number INT NOT NULL,
    episode_number INT NOT NULL,
    title TEXT NOT NULL,
    overview TEXT NOT NULL,
    air_date DATE,
    runtime_minutes INT DEFAULT 0,
    thumbnail_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tv_show_id, season_number, episode_number)
);

-- 10. Video Sources (Supports Bilingual English / Hindi streams, multi-quality)
CREATE TABLE IF NOT EXISTS public.video_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    tv_show_id UUID REFERENCES public.tv_shows(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('English', 'Hindi', 'Tamil', 'Telugu', 'Spanish', 'French', 'Other')),
    video_url TEXT NOT NULL,
    stream_type TEXT NOT NULL CHECK (stream_type IN ('HLS', 'MP4', 'DASH')),
    quality TEXT NOT NULL CHECK (quality IN ('Auto', '480p', '720p', '1080p', '4K')),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    content_rights TEXT NOT NULL DEFAULT 'licensed' CHECK (content_rights IN ('licensed', 'public_domain', 'owner_uploaded', 'authorized_external', 'pending_review')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Audio Tracks
CREATE TABLE IF NOT EXISTS public.audio_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_source_id UUID REFERENCES public.video_sources(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    label TEXT NOT NULL,
    track_url TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Subtitles
CREATE TABLE IF NOT EXISTS public.subtitles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    tv_show_id UUID REFERENCES public.tv_shows(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    label TEXT NOT NULL,
    subtitle_url TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'vtt' CHECK (format IN ('vtt', 'srt')),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Watchlists
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    tv_show_id UUID REFERENCES public.tv_shows(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT watchlist_unique_item UNIQUE(user_id, movie_id, tv_show_id)
);

-- 14. Favorites
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    tv_show_id UUID REFERENCES public.tv_shows(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT favorite_unique_item UNIQUE(user_id, movie_id, tv_show_id)
);

-- 15. Watch History & Playback Progress (Resume Feature)
CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
    current_time NUMERIC(10,2) NOT NULL DEFAULT 0,
    duration NUMERIC(10,2) NOT NULL DEFAULT 0,
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_content_progress UNIQUE(user_id, movie_id, episode_id)
);

-- 16. Advertisement & Monetization Settings
CREATE TABLE IF NOT EXISTS public.ad_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement TEXT NOT NULL UNIQUE CHECK (placement IN ('pre_roll', 'top_banner', 'sidebar', 'under_player', 'footer')),
    is_enabled BOOLEAN DEFAULT TRUE,
    title TEXT NOT NULL,
    description TEXT,
    cta_text TEXT DEFAULT 'Learn More',
    destination_url TEXT,
    media_url TEXT,
    media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'custom_html')),
    custom_html TEXT,
    duration_seconds INT DEFAULT 15,
    can_skip_after_seconds INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name TEXT DEFAULT 'REDX CINEMA',
    site_tagline TEXT DEFAULT 'Stream Legally in Full HD & 4K - English & Hindi',
    tmdb_api_key TEXT,
    contact_email TEXT DEFAULT 'contact@redxcinema.com',
    dmca_email TEXT DEFAULT 'dmca@redxcinema.com',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    enable_user_registration BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================================
-- INDEXES FOR FAST QUERYING
-- ==================================================================
CREATE INDEX IF NOT EXISTS idx_movies_slug ON public.movies(slug);
CREATE INDEX IF NOT EXISTS idx_movies_release_year ON public.movies(release_year);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON public.movies(rating);
CREATE INDEX IF NOT EXISTS idx_movies_featured ON public.movies(is_featured);
CREATE INDEX IF NOT EXISTS idx_movies_trending ON public.movies(is_trending);
CREATE INDEX IF NOT EXISTS idx_video_sources_movie ON public.video_sources(movie_id);
CREATE INDEX IF NOT EXISTS idx_video_sources_lang ON public.video_sources(language);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON public.watchlists(user_id);

-- ==================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public content read access
CREATE POLICY "Public read published movies" ON public.movies FOR SELECT USING (is_published = true);
CREATE POLICY "Public read published tv shows" ON public.tv_shows FOR SELECT USING (is_published = true);
CREATE POLICY "Public read seasons" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Public read episodes" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Public read active video sources" ON public.video_sources FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active subtitles" ON public.subtitles FOR SELECT USING (is_active = true);
CREATE POLICY "Public read enabled ads" ON public.ad_settings FOR SELECT USING (is_enabled = true);

-- User Profiles Isolation
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Watchlist & Favorites Isolation
CREATE POLICY "Users can manage own watchlist" ON public.watchlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);

-- Admin Full Access Policy helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin CRUD Policies
CREATE POLICY "Admins full access to movies" ON public.movies FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access to tv_shows" ON public.tv_shows FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access to video_sources" ON public.video_sources FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access to subtitles" ON public.subtitles FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access to ad_settings" ON public.ad_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access to audit_logs" ON public.audit_logs FOR ALL USING (public.is_admin());
