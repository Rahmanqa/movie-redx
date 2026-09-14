import { Movie } from '@/types/movie';
import MovieCard from './MovieCard';
import { Film } from 'lucide-react';

interface MovieGridProps {
  movies: Movie[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
}

export default function MovieGrid({
  movies,
  title,
  subtitle,
  emptyMessage = "No movies match the selected criteria."
}: MovieGridProps) {
  return (
    <section className="my-8">
      {(title || subtitle) && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div>
            {title && <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">{title}</h2>}
            {subtitle && <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {movies.length} {movies.length === 1 ? 'Title' : 'Titles'}
          </span>
        </div>
      )}

      {movies.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center flex flex-col items-center justify-center">
          <Film className="w-12 h-12 text-zinc-600 mb-3" />
          <p className="text-zinc-300 font-medium text-sm">{emptyMessage}</p>
          <p className="text-zinc-400 text-xs mt-1">Try resetting filters or searching with different keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {movies.map((movie, idx) => (
            <MovieCard key={movie.id} movie={movie} priority={idx < 4} />
          ))}
        </div>
      )}
    </section>
  );
}
