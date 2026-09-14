import { ContentRepository } from '@/lib/db/repository';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { 
  Play, Star, Clock, Globe, Calendar, Shield, Share2, 
  Bookmark, Heart, Check, Film, Tv, Video 
} from 'lucide-react';
import { formatDuration, formatRating } from '@/lib/utils';
import MovieGrid from '@/components/movie/MovieGrid';
import AdBanner from '@/components/layout/AdBanner';

interface MovieDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: MovieDetailPageProps): Promise<Metadata> {
  const movie = await ContentRepository.getMovieBySlug(params.slug);
  if (!movie) {
    return { title: 'Movie Not Found | REDX CINEMA' };
  }

  return {
    title: `${movie.title} (${movie.releaseYear}) - Dual Audio English & Hindi | REDX CINEMA`,
    description: movie.overview,
    openGraph: {
      title: `${movie.title} - Stream in English & Hindi | REDX CINEMA`,
      description: movie.overview,
      images: [{ url: movie.backdropUrl || movie.posterUrl }],
    },
  };
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const movie = await ContentRepository.getMovieBySlug(params.slug);
  if (!movie) {
    notFound();
  }

  const allMovies = await ContentRepository.getAllMovies();
  const similarMovies = allMovies
    .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.some((mg) => mg.id === g.id)))
    .slice(0, 5);

  const underPlayerAd = await ContentRepository.getAdByPlacement('under_player');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    image: movie.posterUrl,
    description: movie.overview,
    datePublished: movie.releaseDate,
    director: movie.director ? { '@type': 'Person', name: movie.director } : undefined,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: movie.rating,
      bestRating: '10',
      ratingCount: movie.voteCount || 100,
    },
    inLanguage: movie.audioLanguages,
  };

  const hasHindi = movie.audioLanguages?.includes('Hindi');
  const hasEnglish = movie.audioLanguages?.includes('English');

  return (
    <div className="space-y-10 pb-16">
      {/* Inject JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Backdrop Banner */}
      <div className="relative w-full h-[55vh] min-h-[400px] max-h-[600px] overflow-hidden bg-black">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>

      {/* Main Details Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 sm:-mt-52 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Left Poster Col */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl bg-zinc-900 aspect-[2/3] relative">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-bold text-white border border-white/10">
                {movie.qualities?.[0] || '1080p Full HD'}
              </div>
            </div>

            {/* Quick Watch & Trailer Buttons */}
            <Link
              href={`/watch/movie/${movie.slug}`}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-brand-primary to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-glow-md transition-all text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch in Dual Audio</span>
            </Link>

            {movie.trailerUrl && (
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 py-3 px-4 rounded-xl transition-colors text-xs font-semibold"
              >
                <Video className="w-4 h-4 text-red-400" />
                <span>Watch Official Trailer</span>
              </a>
            )}
          </div>

          {/* Right Info Col */}
          <div className="md:col-span-2 lg:col-span-3 space-y-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs bg-red-950/80 border border-red-500/50 text-red-300 font-bold px-2.5 py-0.5 rounded">
                  Dual Audio Available
                </span>
                <span className="text-xs bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800">
                  {movie.contentRights === 'public_domain' ? 'Public Domain' : 'Authorized Streaming'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-zinc-400 text-sm mt-1 italic">
                  Original: {movie.originalTitle}
                </p>
              )}

              {/* Badges bar */}
              <div className="flex items-center gap-4 mt-4 text-xs text-zinc-300 flex-wrap">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm">{formatRating(movie.rating)}</span>
                  <span className="text-zinc-400 font-normal">({movie.voteCount} votes)</span>
                </div>
                <span>•</span>
                <span>{movie.releaseYear}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {formatDuration(movie.runtimeMinutes)}
                </span>
                {movie.country && (
                  <>
                    <span>•</span>
                    <span>{movie.country}</span>
                  </>
                )}
              </div>
            </div>

            {/* Genres */}
            <div className="flex items-center gap-2 flex-wrap">
              {movie.genres.map((g) => (
                <Link
                  key={g.slug}
                  href={`/genre/${g.slug}`}
                  className="text-xs font-semibold bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 px-3 py-1 rounded-full transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-xs">Storyline</h3>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                {movie.overview}
              </p>
            </div>

            {/* Bilingual Audio & Subtitle Status Box */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-red-500" />
                <span>Audio Tracks & Subtitle Synchronization</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                  <span className="text-zinc-300">English Audio:</span>
                  <span className={hasEnglish ? "text-emerald-400 font-bold" : "text-zinc-400"}>
                    {hasEnglish ? "✓ Available (1080p HD)" : "Not Available"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                  <span className="text-zinc-300">Hindi Audio (हिन्दी):</span>
                  <span className={hasHindi ? "text-red-400 font-bold" : "text-zinc-400"}>
                    {hasHindi ? "✓ Available (Dual Stream)" : "Not Available"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                  <span className="text-zinc-300">Subtitles / Closed Captions:</span>
                  <span className="text-zinc-200 font-medium">
                    {movie.subtitleLanguages?.join(', ') || 'English, Hindi VTT'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                  <span className="text-zinc-300">Player Engine:</span>
                  <span className="text-zinc-200 font-mono">HLS.js / HTML5 Adaptive</span>
                </div>
              </div>
            </div>

            {/* Cast & Director */}
            <div className="space-y-4 pt-2">
              {movie.director && (
                <div className="text-xs">
                  <span className="text-zinc-400">Director: </span>
                  <span className="text-white font-semibold">{movie.director}</span>
                </div>
              )}

              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Featured Cast</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {movie.cast.map((member) => (
                      <span
                        key={member.id}
                        className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-zinc-200"
                      >
                        <span className="font-semibold text-white">{member.name}</span>
                        {member.character && (
                          <span className="text-zinc-400 text-[11px] ml-1">as {member.character}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Under-player Sponsor Unit */}
            {underPlayerAd && (
              <AdBanner placement="under_player" ad={underPlayerAd} />
            )}
          </div>
        </div>

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <div className="mt-16 pt-8 border-t border-zinc-800">
            <MovieGrid
              title="Recommended & Similar Titles"
              subtitle="More films in similar genres with bilingual audio playback"
              movies={similarMovies}
            />
          </div>
        )}
      </div>
    </div>
  );
}
