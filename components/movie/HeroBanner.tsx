'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Info, Star, Clock, Globe, Bookmark, Check, Volume2 } from 'lucide-react';
import { Movie } from '@/types/movie';
import { formatDuration, formatRating } from '@/lib/utils';

interface HeroBannerProps {
  movies: Movie[];
}

export default function HeroBanner({ movies }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[currentIndex] || movies[0];
  const hasHindi = currentMovie.audioLanguages?.includes('Hindi');
  const hasEnglish = currentMovie.audioLanguages?.includes('English');

  const toggleWatchlist = () => {
    try {
      const stored = localStorage.getItem('redx_watchlist');
      let list = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      if (inWatchlist) {
        list = list.filter((item: any) => item.id !== currentMovie.id);
        setInWatchlist(false);
      } else {
        list.push({
          id: currentMovie.id,
          title: currentMovie.title,
          slug: currentMovie.slug,
          posterUrl: currentMovie.posterUrl,
          releaseYear: currentMovie.releaseYear,
          rating: currentMovie.rating,
          audioLanguages: currentMovie.audioLanguages,
        });
        setInWatchlist(true);
      }
      localStorage.setItem('redx_watchlist', JSON.stringify(list));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] max-h-[750px] overflow-hidden bg-black select-none">
      {/* Background Backdrop */}
      <div className="absolute inset-0">
        <img
          src={currentMovie.backdropUrl}
          alt={currentMovie.title}
          className="w-full h-full object-cover object-center opacity-45 scale-100 transition-all duration-700 ease-out"
        />
        {/* Cinematic Vignette & Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </div>

      {/* Hero Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Top meta tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-brand-primary text-white text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded shadow-glow-sm">
              Featured Cinema
            </span>

            {/* Bilingual tag */}
            <div className="flex items-center gap-1.5 bg-red-950/70 border border-red-500/40 text-red-200 text-xs font-semibold px-2.5 py-0.5 rounded backdrop-blur-md">
              <Volume2 className="w-3.5 h-3.5 text-red-400" />
              <span>Dual Audio: {hasEnglish && 'English'} {hasHindi && '+ हिन्दी Hindi'}</span>
            </div>

            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-black/50 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{formatRating(currentMovie.rating)}</span>
            </div>

            <span className="text-zinc-300 text-xs font-medium bg-black/50 px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
              {currentMovie.releaseYear}
            </span>

            <span className="text-zinc-300 text-xs font-medium bg-black/50 px-2 py-0.5 rounded backdrop-blur-md border border-white/10 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(currentMovie.runtimeMinutes)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg line-clamp-2">
            {currentMovie.title}
          </h1>

          {/* Overview */}
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed line-clamp-3 text-shadow pr-4 max-w-xl">
            {currentMovie.overview}
          </p>

          {/* Genres pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400">
            {currentMovie.genres?.map((g) => (
              <span key={g.id} className="bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-full">
                {g.name}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <Link
              href={`/watch/movie/${currentMovie.slug}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 via-brand-primary to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm sm:text-base px-6 py-3 rounded-xl shadow-glow-md hover:shadow-glow-lg transition-all"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              <span>Watch Now</span>
            </Link>

            <Link
              href={`/movie/${currentMovie.slug}`}
              className="inline-flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-white font-semibold text-sm sm:text-base px-5 py-3 rounded-xl border border-zinc-700/80 backdrop-blur-md transition-all"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Details & Info</span>
            </Link>

            <button
              onClick={toggleWatchlist}
              className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                inWatchlist
                  ? 'bg-brand-primary/20 border-brand-primary text-brand-primary'
                  : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
              title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              aria-label="Toggle Watchlist"
            >
              {inWatchlist ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Carousel indicator dots */}
        {movies.length > 1 && (
          <div className="absolute right-4 sm:right-8 bottom-6 flex items-center gap-2">
            {movies.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slide to movie ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-8 bg-brand-primary' : 'w-2 bg-zinc-600 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
