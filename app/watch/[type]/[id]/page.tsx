import { ContentRepository } from '@/lib/db/repository';
import { notFound } from 'next/navigation';
import VideoPlayer from '@/components/player/VideoPlayer';
import AdBanner from '@/components/layout/AdBanner';
import Link from 'next/link';
import { ArrowLeft, Star, Clock, Globe, Shield, Film } from 'lucide-react';
import { formatDuration, formatRating } from '@/lib/utils';
import { Metadata } from 'next';

interface WatchPageProps {
  params: {
    type: string; // 'movie' | 'episode'
    id: string;   // slug or id
  };
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  if (params.type === 'movie') {
    const movie = await ContentRepository.getMovieBySlug(params.id);
    if (!movie) return { title: 'Watch Stream | REDX CINEMA' };
    return {
      title: `Watch ${movie.title} - Dual Audio English & Hindi Stream | REDX CINEMA`,
      description: `Stream ${movie.title} online in HD with English and Hindi audio tracks.`,
    };
  }
  return {
    title: 'Watch Stream | REDX CINEMA',
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  let title = '';
  let sources = [];
  let subtitles = [];
  let posterUrl = '';
  let detailsLink = '';
  let movieItem = null;

  if (params.type === 'movie') {
    const movie = await ContentRepository.getMovieBySlug(params.id);
    if (!movie) notFound();
    movieItem = movie;
    title = movie.title;
    sources = movie.videoSources;
    subtitles = movie.subtitles;
    posterUrl = movie.backdropUrl || movie.posterUrl;
    detailsLink = `/movie/${movie.slug}`;
  } else {
    // default to first movie if not found
    const movie = await ContentRepository.getMovieBySlug(params.id) || (await ContentRepository.getAllMovies())[0];
    movieItem = movie;
    title = movie.title;
    sources = movie.videoSources;
    subtitles = movie.subtitles;
    posterUrl = movie.backdropUrl;
    detailsLink = `/movie/${movie.slug}`;
  }

  const [preRollAd, underPlayerAd] = await Promise.all([
    ContentRepository.getAdByPlacement('pre_roll'),
    ContentRepository.getAdByPlacement('under_player'),
  ]);

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      {/* Top Back Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href={detailsLink || '/'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Bilingual Server Ready</span>
        </div>
      </div>

      {/* Theater Mode Video Player */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <VideoPlayer
          title={title}
          sources={sources}
          subtitles={subtitles}
          preRollAd={preRollAd}
          contentId={movieItem?.id || params.id}
          contentType={params.type === 'episode' ? 'episode' : 'movie'}
          posterUrl={posterUrl}
        />

        {/* Player Meta Bar */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold">
                Dual Audio (English & Hindi)
              </span>
              <span className="text-xs bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800">
                1080p HD
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
            {movieItem && (
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                {movieItem.overview}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={detailsLink}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Movie Details
            </Link>
          </div>
        </div>

        {/* Under Player Sponsor Ad Unit */}
        {underPlayerAd && (
          <div className="mt-6">
            <AdBanner placement="under_player" ad={underPlayerAd} />
          </div>
        )}

        {/* Bilingual Instructions & Disclaimer */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-400 bg-zinc-950 border border-zinc-900 p-4 rounded-xl">
          <div>
            <h4 className="text-zinc-200 font-bold mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-red-500" />
              How to Switch Audio to Hindi or English
            </h4>
            <p className="leading-relaxed">
              Click the audio language icon on the player control bar (labeled with current language)
              to switch instantaneously between the English and Hindi audio tracks.
            </p>
          </div>

          <div>
            <h4 className="text-zinc-200 font-bold mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Streaming Rights & Legal Notice
            </h4>
            <p className="leading-relaxed">
              All videos hosted or linked on REDX CINEMA are verified public-domain or licensed materials.
              We do not scrape or link to unauthorized sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
