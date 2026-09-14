import { ContentRepository } from '@/lib/db/repository';
import MovieGrid from '@/components/movie/MovieGrid';
import { Metadata } from 'next';
import { Globe } from 'lucide-react';

interface LanguagePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: LanguagePageProps): Promise<Metadata> {
  const isHindi = params.slug.toLowerCase() === 'hindi';
  const langTitle = isHindi ? 'Hindi (हिन्दी)' : 'English';

  return {
    title: `${langTitle} Movies - Dual Audio Streaming | REDX CINEMA`,
    description: `Stream ${langTitle} cinema and dual-audio movies with synchronized subtitles on REDX CINEMA.`,
  };
}

export default async function LanguagePage({ params }: LanguagePageProps) {
  const isHindi = params.slug.toLowerCase() === 'hindi';
  const movies = isHindi
    ? await ContentRepository.getHindiMovies()
    : await ContentRepository.getEnglishMovies();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-red-500">
          <Globe className="w-3.5 h-3.5" />
          <span>Language Showcase</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">
          {isHindi ? 'Hindi Cinema & Dubbed Hits (हिन्दी)' : 'English Hollywood & Remastered Classics'}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {isHindi
            ? 'Watch top films with full Hindi audio tracks, clear dubbing, and subtitle options.'
            : 'Watch original English audio titles in 1080p and 4K Ultra HD quality.'}
        </p>
      </div>

      <MovieGrid
        movies={movies}
        emptyMessage={`No titles found for ${params.slug} audio.`}
      />
    </div>
  );
}
