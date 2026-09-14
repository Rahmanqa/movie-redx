import HeroBanner from '@/components/movie/HeroBanner';
import MovieGrid from '@/components/movie/MovieGrid';
import AdBanner from '@/components/layout/AdBanner';
import { ContentRepository } from '@/lib/db/repository';
import Link from 'next/link';
import { Film, Flame, Sparkles, Globe, Shield, Play } from 'lucide-react';

export const revalidate = 3600; // 1 hour ISR

export default async function HomePage() {
  const [allMovies, featuredMovies, trendingMovies, hindiMovies, englishMovies, tvShows, topBannerAd] = await Promise.all([
    ContentRepository.getAllMovies(),
    ContentRepository.getFeaturedMovies(),
    ContentRepository.getTrendingMovies(),
    ContentRepository.getHindiMovies(),
    ContentRepository.getEnglishMovies(),
    ContentRepository.getTVShows(),
    ContentRepository.getAdByPlacement('top_banner')
  ]);

  return (
    <div className="space-y-12">
      {/* 1. Cinematic Hero Section */}
      <HeroBanner movies={featuredMovies.length > 0 ? featuredMovies : allMovies} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 2. Top Leaderboard Sponsor Banner */}
        {topBannerAd && (
          <AdBanner placement="top_banner" ad={topBannerAd} />
        )}

        {/* 3. Fast Language & Category Filter Pills */}
        <section className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
          <Link
            href="/language/hindi"
            className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-red-950/80 to-zinc-900 border border-red-500/50 hover:border-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-glow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-red-400" />
            <span>Hindi Cinema (हिन्दी)</span>
          </Link>

          <Link
            href="/language/english"
            className="shrink-0 flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 hover:border-white text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-full transition-all"
          >
            <Film className="w-3.5 h-3.5 text-zinc-400" />
            <span>Hollywood English</span>
          </Link>

          <Link
            href="/genre/action"
            className="shrink-0 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium px-4 py-2.5 rounded-full transition-colors"
          >
            Action & Thrillers
          </Link>

          <Link
            href="/genre/sci-fi"
            className="shrink-0 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium px-4 py-2.5 rounded-full transition-colors"
          >
            Sci-Fi & Cyberpunk
          </Link>

          <Link
            href="/genre/animation"
            className="shrink-0 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium px-4 py-2.5 rounded-full transition-colors"
          >
            Animation 4K
          </Link>

          <Link
            href="/movies"
            className="shrink-0 bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium px-4 py-2.5 rounded-full transition-colors ml-auto"
          >
            Browse All Movies &rarr;
          </Link>
        </section>

        {/* 4. Trending Cinema */}
        <MovieGrid
          title="Trending Now on REDX"
          subtitle="Top streamed movies across English and Hindi audiences this week"
          movies={trendingMovies}
        />

        {/* 5. Hindi Cinema Spotlight */}
        <div className="rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-950 to-zinc-900/60 border border-red-900/30 p-4 sm:p-6">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
              <h2 className="text-xl font-black text-white">Dual Audio & Hindi Cinema</h2>
            </div>
            <Link
              href="/language/hindi"
              className="text-xs text-brand-primary hover:text-red-400 font-semibold"
            >
              View All Hindi &rarr;
            </Link>
          </div>
          <p className="text-xs text-zinc-400 mb-6">
            Watch with authentic Hindi dubbing and synchronized subtitles in 1080p Full HD.
          </p>
          <MovieGrid movies={hindiMovies} />
        </div>

        {/* 6. TV Shows / Series Spotlight */}
        {tvShows.length > 0 && (
          <section className="my-8">
            <div className="mb-5 flex items-end justify-between border-b border-zinc-800/80 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">Featured TV Series</h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">Stream episodic series with multi-season playback</p>
              </div>
              <Link href="/tv" className="text-xs text-brand-primary hover:text-red-400 font-semibold">
                Explore All Series &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tvShows.map((show) => (
                <div
                  key={show.id}
                  className="group rounded-xl overflow-hidden bg-brand-card border border-zinc-800 hover:border-brand-primary/50 transition-all p-4 flex flex-col justify-between"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                    <img
                      src={show.backdropUrl}
                      alt={show.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-[10px] font-bold text-zinc-200 px-2 py-0.5 rounded border border-white/10">
                      {show.seasonsCount} {show.seasonsCount === 1 ? 'Season' : 'Seasons'}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-brand-primary transition-colors">
                      {show.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{show.overview}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-red-400">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{show.audioLanguages.join(' / ')}</span>
                    </div>
                    <Link
                      href={`/tv/${show.slug}`}
                      className="inline-flex items-center gap-1 bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Episodes</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Hollywood English Hits */}
        <MovieGrid
          title="English Cinema & Classics"
          subtitle="Top original English audio movies remastered for modern screens"
          movies={englishMovies}
        />
      </div>
    </div>
  );
}
