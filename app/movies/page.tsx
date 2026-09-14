import { ContentRepository } from '@/lib/db/repository';
import MovieGrid from '@/components/movie/MovieGrid';
import FilterBar from '@/components/search/FilterBar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Movies - Dual Audio English & Hindi Streaming | REDX CINEMA',
  description: 'Explore the full catalog of authorized movies on REDX CINEMA. Filter by genre, release year, rating, and audio language (English & Hindi).',
};

interface MoviesPageProps {
  searchParams: {
    genre?: string;
    language?: string;
    year?: string;
    rating?: string;
    sort?: string;
    q?: string;
  };
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  let movies = await ContentRepository.getAllMovies();

  // Filter by search query if any
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase().trim();
    movies = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.overview.toLowerCase().includes(q) ||
        m.cast.some((c) => c.name.toLowerCase().includes(q))
    );
  }

  // Filter by genre
  if (searchParams.genre && searchParams.genre !== 'all') {
    movies = movies.filter((m) =>
      m.genres.some((g) => g.slug === searchParams.genre?.toLowerCase())
    );
  }

  // Filter by language
  if (searchParams.language && searchParams.language !== 'all') {
    const lang = searchParams.language.toLowerCase();
    movies = movies.filter((m) =>
      m.audioLanguages.some((al) => al.toLowerCase() === lang)
    );
  }

  // Filter by year
  if (searchParams.year && searchParams.year !== 'all') {
    const yr = parseInt(searchParams.year, 10);
    movies = movies.filter((m) => m.releaseYear === yr);
  }

  // Sort
  if (searchParams.sort === 'rating') {
    movies = [...movies].sort((a, b) => b.rating - a.rating);
  } else if (searchParams.sort === 'latest') {
    movies = [...movies].sort((a, b) => b.releaseYear - a.releaseYear);
  } else if (searchParams.sort === 'title') {
    movies = [...movies].sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // default popularity / voteCount
    movies = [...movies].sort((a, b) => b.voteCount - a.voteCount);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Movie Catalog</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Explore movies available for streaming in dual English and Hindi audio
        </p>
      </div>

      {/* Filter Component */}
      <FilterBar
        currentGenre={searchParams.genre}
        currentLanguage={searchParams.language}
        currentYear={searchParams.year}
        currentSort={searchParams.sort}
      />

      {/* Grid */}
      <MovieGrid
        movies={movies}
        emptyMessage="No movies found matching your selected filters."
      />
    </div>
  );
}
