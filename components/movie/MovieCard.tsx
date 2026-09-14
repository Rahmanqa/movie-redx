'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Play, Bookmark, Check, Globe } from 'lucide-react';
import { Movie } from '@/types/movie';
import { formatRating } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  priority?: boolean;
}

export default function MovieCard({ movie, priority = false }: MovieCardProps) {
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('redx_watchlist');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          setInWatchlist(list.some((item: any) => item.id === movie.id));
        }
      }
    } catch (e) {
      // ignore
    }
  }, [movie.id]);

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const stored = localStorage.getItem('redx_watchlist');
      let list = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      if (inWatchlist) {
        list = list.filter((item: any) => item.id !== movie.id);
        setInWatchlist(false);
      } else {
        list.push({
          id: movie.id,
          title: movie.title,
          slug: movie.slug,
          posterUrl: movie.posterUrl,
          releaseYear: movie.releaseYear,
          rating: movie.rating,
          audioLanguages: movie.audioLanguages,
        });
        setInWatchlist(true);
      }
      localStorage.setItem('redx_watchlist', JSON.stringify(list));
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
    }
  };

  const hasHindi = movie.audioLanguages?.includes('Hindi');
  const hasEnglish = movie.audioLanguages?.includes('English');

  return (
    <div className="group relative rounded-xl overflow-hidden bg-brand-card border border-brand-border/60 hover:border-brand-primary/50 transition-all duration-300 hover:shadow-glow-md flex flex-col">
      {/* Poster Image Container */}
      <Link href={`/movie/${movie.slug}`} className="relative aspect-[2/3] w-full overflow-hidden block">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading={priority ? 'eager' : 'lazy'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1">
          {/* Quality Badge */}
          {movie.qualities && movie.qualities.length > 0 && (
            <span className="bg-black/70 backdrop-blur-md text-zinc-200 border border-white/10 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              {movie.qualities[0]}
            </span>
          )}

          {/* Watchlist Bookmark Button */}
          <button
            onClick={toggleWatchlist}
            aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
              inWatchlist
                ? 'bg-brand-primary text-white'
                : 'bg-black/60 text-zinc-300 hover:bg-brand-primary hover:text-white'
            }`}
          >
            {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Language Badges on bottom of poster */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          {hasHindi && (
            <span className="bg-red-950/80 backdrop-blur-sm border border-red-500/50 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <span>हिन्दी</span>
            </span>
          )}
          {hasEnglish && (
            <span className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/60 text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
              EN
            </span>
          )}
        </div>

        {/* Play Icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-glow-md transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </Link>

      {/* Info Card */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/movie/${movie.slug}`} className="block">
            <h3 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-1">
              {movie.title}
            </h3>
          </Link>

          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
            <span>{movie.releaseYear}</span>
            <span>•</span>
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3 h-3 fill-current" />
              <span>{formatRating(movie.rating)}</span>
            </div>
            {movie.genres && movie.genres.length > 0 && (
              <>
                <span>•</span>
                <span className="line-clamp-1 text-zinc-400 text-[11px]">
                  {movie.genres[0].name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Link */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
          <Link
            href={`/movie/${movie.slug}`}
            className="text-[11px] font-semibold text-brand-primary hover:text-red-400 flex items-center gap-1"
          >
            <span>Watch Dual Audio</span>
          </Link>
          <span className="text-[10px] text-zinc-400 capitalize">
            {movie.contentRights === 'public_domain' ? 'Public Domain' : 'Licensed'}
          </span>
        </div>
      </div>
    </div>
  );
}
