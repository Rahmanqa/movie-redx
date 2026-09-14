import { Genre, AdSetting } from '@/types/movie';

export const DEFAULT_GENRES: Genre[] = [
  { id: 28, name: 'Action', slug: 'action' },
  { id: 12, name: 'Adventure', slug: 'adventure' },
  { id: 16, name: 'Animation', slug: 'animation' },
  { id: 35, name: 'Comedy', slug: 'comedy' },
  { id: 80, name: 'Crime', slug: 'crime' },
  { id: 99, name: 'Documentary', slug: 'documentary' },
  { id: 18, name: 'Drama', slug: 'drama' },
  { id: 10751, name: 'Family', slug: 'family' },
  { id: 14, name: 'Fantasy', slug: 'fantasy' },
  { id: 27, name: 'Horror', slug: 'horror' },
  { id: 878, name: 'Sci-Fi', slug: 'sci-fi' },
  { id: 53, name: 'Thriller', slug: 'thriller' },
];

export const INITIAL_ADS: AdSetting[] = [
  {
    id: 'ad-pre-roll',
    placement: 'pre_roll',
    isEnabled: true,
    title: 'REDX Premium Sponsor: Ultra-Fast VPN',
    description: 'Bypass throttling and stream high-bitrate 4K movies with full privacy protection.',
    ctaText: 'Claim 75% OFF + 3 Free Months',
    destinationUrl: 'https://nordvpn.com',
    mediaUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    durationSeconds: 15,
    canSkipAfterSeconds: 5
  },
  {
    id: 'ad-top-banner',
    placement: 'top_banner',
    isEnabled: true,
    title: 'Cinematic Soundbars Flash Sale',
    description: 'Experience true 3D spatial Dolby Atmos sound in your living room.',
    ctaText: 'Shop Deals',
    destinationUrl: 'https://amazon.com',
    mediaUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1200&auto=format&fit=crop&q=80',
    mediaType: 'image'
  },
  {
    id: 'ad-under-player',
    placement: 'under_player',
    isEnabled: true,
    title: 'Stream in 4K HDR: Smart TV Stick',
    description: 'Plug-and-play streaming dongle with dual Wi-Fi 6 support.',
    ctaText: 'Check Price',
    destinationUrl: 'https://amazon.com',
    mediaUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image'
  }
];
