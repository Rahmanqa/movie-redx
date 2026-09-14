-- ==================================================================
-- REDX CINEMA - Supabase Initial Seed Data
-- Bilingual Movies, TV Series, Streams, Subtitles & Monetization Ads
-- ==================================================================

-- 1. Genres
INSERT INTO public.genres (id, name, slug) VALUES
(28, 'Action', 'action'),
(12, 'Adventure', 'adventure'),
(16, 'Animation', 'animation'),
(35, 'Comedy', 'comedy'),
(80, 'Crime', 'crime'),
(99, 'Documentary', 'documentary'),
(18, 'Drama', 'drama'),
(10751, 'Family', 'family'),
(14, 'Fantasy', 'fantasy'),
(36, 'History', 'history'),
(27, 'Horror', 'horror'),
(10402, 'Music', 'music'),
(9648, 'Mystery', 'mystery'),
(10749, 'Romance', 'romance'),
(878, 'Sci-Fi', 'sci-fi'),
(53, 'Thriller', 'thriller')
ON CONFLICT (id) DO NOTHING;

-- 2. Movies (Authorized, Public Domain & Open Source Benchmark Films)
INSERT INTO public.movies (
    id, slug, title, original_title, overview, poster_url, backdrop_url, 
    trailer_url, release_date, release_year, runtime_minutes, rating, vote_count, 
    country, director, is_featured, is_trending, is_published, content_rights
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'tears-of-steel',
    'Tears of Steel',
    'Tears of Steel (Sci-Fi Amsterdam)',
    'Set in a dystopian future Amsterdam, a group of warriors and scientists undertake a desperate bid to rescue the world from marauding cyborgs using memory technology. Fully equipped with dual Hindi and English audio tracks.',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    'https://www.youtube.com/watch?v=R6MlUcmOul8',
    '2024-03-15',
    2024,
    12,
    8.6,
    1420,
    'Netherlands / US',
    'Ian Hubert',
    true,
    true,
    true,
    'public_domain'
),
(
    '00000000-0000-0000-0000-000000000002',
    'sintel',
    'Sintel: The Dragon Quest',
    'Sintel',
    'A lonely, resilient young woman named Sintel discovers a wounded baby dragon and forms an unbreakable bond. When her companion is abducted, she braves harsh wilderness and treacherous ruins across continents.',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600&auto=format&fit=crop&q=80',
    'https://www.youtube.com/watch?v=eRsGyueVLvQ',
    '2023-11-20',
    2023,
    15,
    8.8,
    2150,
    'Netherlands',
    'Colin Levy',
    true,
    true,
    true,
    'licensed'
),
(
    '00000000-0000-0000-0000-000000000003',
    'big-buck-bunny',
    'Big Buck Bunny',
    'A Large and Lovable Rabbit',
    'A large and gentle rabbit is harassed by mischievous woodland rodents. When the cruelty goes too far, the bunny crafts ingenious traps to teach them a lesson in this celebrated animation classic.',
    'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1600&auto=format&fit=crop&q=80',
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    '2024-01-10',
    2024,
    10,
    8.2,
    980,
    'US',
    'Sacha Goedegebure',
    false,
    true,
    true,
    'public_domain'
),
(
    '00000000-0000-0000-0000-000000000004',
    'night-of-the-living-dead',
    'Night of the Living Dead',
    'Night of the Flesh Eaters',
    'A disparate group of individuals seek refuge in an abandoned farmhouse when corpses mysteriously rise from their graves hungering for human flesh. The landmark horror classic in remastered HD.',
    'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    'https://www.youtube.com/watch?v=0vgYpA_uGkQ',
    '1968-10-01',
    1968,
    96,
    9.0,
    4320,
    'US',
    'George A. Romero',
    false,
    true,
    true,
    'public_domain'
),
(
    '00000000-0000-0000-0000-000000000005',
    'elephants-dream',
    'Elephants Dream: Machine Heart',
    'Elephants Dream',
    'Two wanderers explore a giant, mysterious clockwork machine created from dreams and labyrinthine contraptions, uncovering philosophical reflections on communication and destiny.',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    'https://www.youtube.com/watch?v=TLkA0RELQ1g',
    '2022-08-14',
    2022,
    11,
    8.0,
    640,
    'Netherlands',
    'Bassam Kurdali',
    false,
    false,
    true,
    'public_domain'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Video Sources (Bilingual English & Hindi Playback Sources)
INSERT INTO public.video_sources (
    id, movie_id, language, video_url, stream_type, quality, is_default, is_active, content_rights
) VALUES
-- Tears of Steel (English 1080p, Hindi 1080p, English HLS 4K)
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'English',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'MP4',
    '1080p',
    true,
    true,
    'public_domain'
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Hindi',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'MP4',
    '1080p',
    false,
    true,
    'public_domain'
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'English',
    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    'HLS',
    'Auto',
    false,
    true,
    'public_domain'
),

-- Sintel (English & Hindi)
(
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'English',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'MP4',
    '1080p',
    true,
    true,
    'licensed'
),
(
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    'Hindi',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'MP4',
    '720p',
    false,
    true,
    'licensed'
),

-- Big Buck Bunny (Multi-audio HLS stream + MP4)
(
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000003',
    'English',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'MP4',
    '1080p',
    true,
    true,
    'public_domain'
),
(
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000003',
    'Hindi',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'MP4',
    '1080p',
    false,
    true,
    'public_domain'
),

-- Night of the Living Dead
(
    '10000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000004',
    'English',
    'https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4',
    'MP4',
    '720p',
    true,
    true,
    'public_domain'
),
(
    '10000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000004',
    'Hindi',
    'https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4',
    'MP4',
    '720p',
    false,
    true,
    'public_domain'
),

-- Elephants Dream
(
    '10000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000005',
    'English',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'MP4',
    '1080p',
    true,
    true,
    'public_domain'
),
(
    '10000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000005',
    'Hindi',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'MP4',
    '1080p',
    false,
    true,
    'public_domain'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Subtitles (English & Hindi VTT tracks)
INSERT INTO public.subtitles (
    id, movie_id, language, label, subtitle_url, format, is_default, is_active
) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'English',
    'English [CC]',
    '/subtitles/tears-en.vtt',
    'vtt',
    true,
    true
),
(
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Hindi',
    'Hindi [हिन्दी]',
    '/subtitles/tears-hi.vtt',
    'vtt',
    false,
    true
),
(
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'English',
    'English [CC]',
    '/subtitles/sintel-en.vtt',
    'vtt',
    true,
    true
),
(
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'Hindi',
    'Hindi [हिन्दी]',
    '/subtitles/sintel-hi.vtt',
    'vtt',
    false,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 5. Monetization & Ad Placement Settings
INSERT INTO public.ad_settings (
    id, placement, is_enabled, title, description, cta_text, destination_url, 
    media_url, media_type, duration_seconds, can_skip_after_seconds
) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    'pre_roll',
    true,
    'REDX VIP Sponsor: Ultra-Fast Streaming VPN',
    'Stream with high-speed bandwidth, zero buffer and full encryption across all devices.',
    'Claim 75% Discount + 3 Months Free',
    'https://nordvpn.com',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    'image',
    15,
    5
),
(
    '30000000-0000-0000-0000-000000000002',
    'top_banner',
    true,
    'Cinematic Dolby Soundbar 50% Flash Sale',
    'Upgrade your home theater experience with 3D Spatial Audio.',
    'Shop Now',
    'https://amazon.com',
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&auto=format&fit=crop&q=80',
    'image',
    0,
    0
),
(
    '30000000-0000-0000-0000-000000000003',
    'under_player',
    true,
    'Watch in 4K HDR: Get Ultra Streaming Box',
    'Enjoy lag-free 4K HDR playback and dual audio on any TV screen.',
    'View Deals',
    'https://amazon.com',
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80',
    'image',
    0,
    0
)
ON CONFLICT (placement) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    destination_url = EXCLUDED.destination_url;
