import { ContentRepository } from '@/lib/db/repository';
import Link from 'next/link';
import { Play, Globe, Star, Tv } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TV Shows & Episodic Series | REDX CINEMA',
  description: 'Explore episodic series and TV shows on REDX CINEMA with dual English and Hindi audio support and subtitle options.',
};

export default async function TVShowsPage() {
  const tvShows = await ContentRepository.getTVShows();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">TV Series & Shows</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Stream episodic series with multi-season playback in English and Hindi
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tvShows.map((show) => (
          <div
            key={show.id}
            className="group rounded-2xl overflow-hidden bg-brand-card border border-brand-border/60 hover:border-brand-primary/50 transition-all duration-300 p-4 flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                <img
                  src={show.backdropUrl}
                  alt={show.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-xs font-bold text-zinc-200 px-2 py-0.5 rounded border border-white/10">
                  {show.seasonsCount} {show.seasonsCount === 1 ? 'Season' : 'Seasons'}
                </div>
              </div>

              <h2 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors">
                {show.title}
              </h2>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {show.overview}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                <Globe className="w-3.5 h-3.5" />
                <span>{show.audioLanguages.join(' / ')}</span>
              </div>

              <Link
                href={`/tv/${show.slug}`}
                className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-red-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-glow-sm transition-all"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>View Episodes</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
