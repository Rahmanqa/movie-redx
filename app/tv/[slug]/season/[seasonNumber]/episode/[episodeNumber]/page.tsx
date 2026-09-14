import { ContentRepository } from '@/lib/db/repository';
import { notFound } from 'next/navigation';
import VideoPlayer from '@/components/player/VideoPlayer';
import Link from 'next/link';
import { ArrowLeft, Play, Tv } from 'lucide-react';
import { Metadata } from 'next';

interface EpisodePageProps {
  params: {
    slug: string;
    seasonNumber: string;
    episodeNumber: string;
  };
}

export async function generateMetadata({ params }: EpisodePageProps): Promise<Metadata> {
  const sNum = parseInt(params.seasonNumber, 10);
  const epNum = parseInt(params.episodeNumber, 10);
  const data = await ContentRepository.getEpisode(params.slug, sNum, epNum);

  if (!data || !data.episode) return { title: 'Episode Not Found | REDX CINEMA' };

  return {
    title: `${data.episode.title} - ${data.show.title} | REDX CINEMA`,
    description: data.episode.overview,
  };
}

export default async function EpisodeStreamPage({ params }: EpisodePageProps) {
  const sNum = parseInt(params.seasonNumber, 10);
  const epNum = parseInt(params.episodeNumber, 10);
  const data = await ContentRepository.getEpisode(params.slug, sNum, epNum);

  if (!data || !data.episode) notFound();

  const { show, season, episode } = data;
  const preRollAd = await ContentRepository.getAdByPlacement('pre_roll');

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href={`/tv/${show.slug}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {show.title}</span>
        </Link>

        <span className="text-xs text-zinc-400">
          Season {sNum}, Episode {epNum}
        </span>
      </div>

      {/* Video Player */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <VideoPlayer
          title={`${show.title} - ${episode.title}`}
          sources={episode.videoSources}
          subtitles={episode.subtitles}
          preRollAd={preRollAd}
          contentId={episode.id}
          contentType="episode"
          posterUrl={episode.thumbnailUrl}
        />

        <div className="border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold">
              Dual Audio Episode
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{episode.title}</h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-3xl">
            {episode.overview}
          </p>
        </div>

        {/* Other episodes in season */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">More in this Season</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {season.episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/tv/${show.slug}/season/${ep.seasonNumber}/episode/${ep.episodeNumber}`}
                className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                  ep.id === episode.id
                    ? 'bg-red-950/30 border-brand-primary text-white'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0 text-red-400">
                  {ep.episodeNumber}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold truncate">{ep.title}</h4>
                  <span className="text-[10px] text-zinc-400">
                    {ep.runtimeMinutes ? `${ep.runtimeMinutes}m` : '15m'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
