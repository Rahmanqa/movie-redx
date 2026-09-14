import { ContentRepository } from '@/lib/db/repository';
import Link from 'next/link';
import { Film, Tv, Video, DollarSign, PlusCircle, CheckCircle2, Shield, Globe } from 'lucide-react';

export default async function AdminDashboardPage() {
  const [movies, tvShows, ads] = await Promise.all([
    ContentRepository.getAllMovies(),
    ContentRepository.getTVShows(),
    ContentRepository.getAds(),
  ]);

  const totalSources = movies.reduce((acc, m) => acc + (m.videoSources?.length || 0), 0);
  const hindiCount = movies.filter((m) => m.audioLanguages?.includes('Hindi')).length;
  const englishCount = movies.filter((m) => m.audioLanguages?.includes('English')).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">REDX Admin Center</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Platform metrics, bilingual streaming content, and monetization engine
          </p>
        </div>

        <Link
          href="/admin/movies/new"
          className="inline-flex items-center gap-2 bg-brand-primary hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-glow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Movie</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Total Movies</span>
            <Film className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-3xl font-black text-white">{movies.length}</div>
          <p className="text-[11px] text-zinc-400">Published in streaming catalog</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>TV Series & Shows</span>
            <Tv className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">{tvShows.length}</div>
          <p className="text-[11px] text-zinc-400">Episodic seasons online</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Video Sources</span>
            <Video className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalSources}</div>
          <p className="text-[11px] text-zinc-400">English: {englishCount} | Hindi: {hindiCount}</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
            <span>Monetization Units</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {ads.filter((a) => a.isEnabled).length} Active
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">Pre-roll & Banner slots live</p>
        </div>
      </div>

      {/* Quick Actions & Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Table */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Catalog Titles</h3>
            <Link href="/admin/movies" className="text-xs text-brand-primary hover:text-red-400 font-semibold">
              Manage All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-zinc-800/60 text-xs">
            {movies.slice(0, 5).map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-14 shrink-0 rounded bg-zinc-800 overflow-hidden">
                    <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white truncate">{m.title}</h4>
                    <p className="text-zinc-400 text-[11px]">{m.releaseYear} • {m.audioLanguages.join(' / ')}</p>
                  </div>
                </div>

                <Link
                  href={`/watch/movie/${m.slug}`}
                  className="shrink-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors"
                >
                  Test Stream
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Monetization Quick Panel */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Monetization & Ad Engine</h3>
            <Link href="/admin/ads" className="text-xs text-brand-primary hover:text-red-400 font-semibold">
              Configure &rarr;
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {ads.map((ad) => (
              <div key={ad.id} className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white uppercase font-mono text-[11px]">{ad.placement.replace('_', ' ')}</h4>
                  <p className="text-zinc-400 text-[11px] truncate max-w-xs">{ad.title}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  ad.isEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {ad.isEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-zinc-300">
            <p className="font-bold text-red-400 mb-0.5">💰 Revenue Engine Setup:</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Connect your affiliate deals (NordVPN, Amazon, Adsterra/Monetag banners) in the 
              <strong> Monetization & Ads</strong> tab to earn commission from every stream view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
