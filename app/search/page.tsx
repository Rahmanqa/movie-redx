import { ContentRepository } from '@/lib/db/repository';
import MovieGrid from '@/components/movie/MovieGrid';
import { Search as SearchIcon, Film, Tv } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Movies & TV Series | REDX CINEMA',
  description: 'Search movies, TV shows, actors, and genres across the REDX CINEMA library.',
};

interface SearchPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const { movies, tvShows } = await ContentRepository.searchContent(query);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header Form */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Explore REDX Cinema
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Find movies, shows, actors, directors, and genres in dual audio
        </p>

        <form action="/search" method="GET" className="relative">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search titles, actors, genres..."
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-lg"
          />
          <SearchIcon className="w-5 h-5 text-zinc-400 absolute left-4 top-3.5 pointer-events-none" />
          <button
            type="submit"
            className="absolute right-2 top-2 bg-brand-primary hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-glow-sm transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {query && (
        <div className="border-b border-zinc-800 pb-3 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Results for <span className="text-white font-bold">&quot;{query}&quot;</span>: {movies.length + tvShows.length} found
          </span>
          <Link href="/search" className="text-red-400 hover:underline">
            Clear Search
          </Link>
        </div>
      )}

      {/* Movie Results */}
      <div>
        <MovieGrid
          title={query ? `Matching Movies (${movies.length})` : 'All Movies'}
          movies={movies}
          emptyMessage={`No movies found matching "${query}".`}
        />
      </div>

      {/* TV Series Results */}
      {tvShows.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-zinc-800">
          <h2 className="text-xl font-bold text-white">Matching TV Series ({tvShows.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tvShows.map((show) => (
              <Link
                key={show.id}
                href={`/tv/${show.slug}`}
                className="group bg-brand-card border border-zinc-800 hover:border-brand-primary rounded-xl p-3 flex gap-3 transition-all"
              >
                <div className="w-24 shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900">
                  <img src={show.posterUrl} alt={show.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors">
                      {show.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{show.overview}</p>
                  </div>
                  <span className="text-[11px] text-red-400 font-medium">
                    Dual Audio Series &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
