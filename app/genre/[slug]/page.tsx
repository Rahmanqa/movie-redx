import { ContentRepository } from '@/lib/db/repository';
import { DEFAULT_GENRES } from '@/lib/constants';
import MovieGrid from '@/components/movie/MovieGrid';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface GenrePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const genre = DEFAULT_GENRES.find((g) => g.slug === params.slug.toLowerCase());
  const name = genre ? genre.name : params.slug;

  return {
    title: `${name} Movies - Dual Audio English & Hindi | REDX CINEMA`,
    description: `Watch top ${name} movies online with English and Hindi audio streaming and subtitle options on REDX CINEMA.`,
  };
}

export default async function GenrePage({ params }: GenrePageProps) {
  const genre = DEFAULT_GENRES.find((g) => g.slug === params.slug.toLowerCase());
  const allMovies = await ContentRepository.getAllMovies();

  const filteredMovies = allMovies.filter((m) =>
    m.genres.some((g) => g.slug === params.slug.toLowerCase())
  );

  const titleName = genre ? genre.name : params.slug;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <span className="text-xs font-mono uppercase tracking-wider text-red-500">
          Genre Collection
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
          {titleName} Movies
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Stream high-rated {titleName} films with bilingual audio and subtitles
        </p>
      </div>

      <MovieGrid
        movies={filteredMovies}
        emptyMessage={`No movies currently listed under the ${titleName} genre.`}
      />
    </div>
  );
}
