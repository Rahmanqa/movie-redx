'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, RotateCcw } from 'lucide-react';
import { DEFAULT_GENRES } from '@/lib/constants';

interface FilterBarProps {
  currentGenre?: string;
  currentLanguage?: string;
  currentSort?: string;
  currentYear?: string;
}

export default function FilterBar({
  currentGenre = '',
  currentLanguage = '',
  currentSort = 'popularity',
  currentYear = '',
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(window.location.pathname);
  };

  const years = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2015, 2010, 2000, 1990, 1980];

  return (
    <div className="bg-brand-card/80 border border-brand-border/60 rounded-2xl p-4 mb-8 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white text-sm font-bold">
          <Filter className="w-4 h-4 text-brand-primary" />
          <span>Filter & Sort Titles</span>
        </div>

        {(currentGenre || currentLanguage || currentYear || currentSort !== 'popularity') && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {/* Genre Selector */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Genre
          </label>
          <select
            value={currentGenre}
            onChange={(e) => updateParam('genre', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary"
          >
            <option value="all">All Genres</option>
            {DEFAULT_GENRES.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Audio Language Selector */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Audio Track
          </label>
          <select
            value={currentLanguage}
            onChange={(e) => updateParam('language', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary"
          >
            <option value="all">All Audio Languages</option>
            <option value="hindi">Hindi Audio (हिन्दी)</option>
            <option value="english">English Audio</option>
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Release Year
          </label>
          <select
            value={currentYear}
            onChange={(e) => updateParam('year', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary"
          >
            <option value="all">Any Year</option>
            {years.map((y) => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Sort By
          </label>
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary"
          >
            <option value="popularity">Most Popular</option>
            <option value="rating">Top Rated</option>
            <option value="latest">Latest Release</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
