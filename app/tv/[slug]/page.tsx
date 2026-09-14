import { ContentRepository } from '@/lib/db/repository';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Play, Globe, Star, Clock, Tv } from 'lucide-react';
import { formatDuration, formatRating } from '@/lib/utils';
import { Metadata } from 'next';

interface TVDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: TVDetailPageProps): Promise<Metadata> {
  const show = await ContentRepository.getTVShowBySlug(params.slug);
  if (!show) return { title: 'TV Series Not Found | REDX CINEMA' };

  return {
    title: `${show.title} - Watch Series Episodes Dual Audio | REDX CINEMA`,
    description: show.overview,
  };
}

export default async function TVDetailPage({ params }: TVDetailPageProps) {
  const show = await ContentRepository.getTVShowBySlug(params.slug);
  if (!show) notFound();

  const season = show.seasons[0]; // first season

  return (
    <div className="space-y-10 pb-16">
      {/* Backdrop */}
      <div className="relative w-full h-[50vh] min-h-[350px] max-h-[500px] overflow-hidden bg-black">
        <img
          src={show.backdropUrl}
          alt={show.title}
          className="w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 relative z-10 space-y-8">
        {/* Top Info */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-44 shrink-0 rounded-xl overflow-hidden border border-zinc-700 shadow-2xl bg-zinc-900 aspect-[2/3]">
            <img src={show.posterUrl} alt={show.title} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-red-950/80 border border-red-500/50 text-red-300 font-bold px-2 py-0.5 rounded">
                TV Series
              </span>
              <span className="text-xs bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800">
                {show.seasonsCount} Season(s) • {show.episodesCount} Episode(s)
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white">{show.title}</h1>

            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{formatRating(show.rating)}</span>
              </div>
              <span>•</span>
              <span>Premiered {show.firstAirDate}</span>
              <span>•</span>
              <span className="text-red-400 font-semibold">Dual Audio: {show.audioLanguages.join(' & ')}</span>
            </div>

            <p className="text-zinc-300 text-sm max-w-2xl leading-relaxed">{show.overview}</p>
          </div>
        </div>

        {/* Season Episodes List */}
        <div className="space-y-4 pt-6 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Season 1 Episodes</h2>
            <span className="text-xs text-zinc-400 font-mono">
              {season?.episodes.length || 0} Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {season?.episodes.map((ep) => (
              <div
                key={ep.id}
                className="group bg-brand-card border border-zinc-800 hover:border-brand-primary/50 rounded-xl overflow-hidden p-3 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2.5">
                    <img
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-200">
                      {formatDuration(ep.runtimeMinutes || 15)}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-1">
                    {ep.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {ep.overview}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-red-400 font-medium">
                    Dual Audio (EN/HI)
                  </span>

                  <Link
                    href={`/tv/${show.slug}/season/${ep.seasonNumber}/episode/${ep.episodeNumber}`}
                    className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-glow-sm transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch Stream</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
