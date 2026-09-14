import { ContentRepository } from '@/lib/db/repository';
import Link from 'next/link';
import { PlusCircle, Film, Play, ExternalLink, Globe, Shield } from 'lucide-react';

export default async function AdminMoviesListPage() {
  const movies = await ContentRepository.getAllMovies();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white">Movie Catalog Management</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage titles, bilingual streams (English & Hindi), subtitles, and licensing status
          </p>
        </div>

        <Link
          href="/admin/movies/new"
          className="inline-flex items-center gap-2 bg-brand-primary hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-glow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Movie Entry</span>
        </Link>
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-mono text-[10px] border-b border-zinc-800">
              <tr>
                <th className="p-4">Movie</th>
                <th className="p-4">Release</th>
                <th className="p-4">Audio Tracks</th>
                <th className="p-4">Rights Status</th>
                <th className="p-4">Sources</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {movies.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-9 h-12 rounded object-cover bg-zinc-800 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{m.title}</div>
                      <div className="text-[11px] text-zinc-400">{m.slug}</div>
                    </div>
                  </td>
                  <td className="p-4 font-mono">{m.releaseYear}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {m.audioLanguages.map((al) => (
                        <span
                          key={al}
                          className="bg-zinc-800 text-zinc-200 text-[10px] font-semibold px-2 py-0.5 rounded"
                        >
                          {al}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {m.contentRights}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-zinc-400">
                    {m.videoSources?.length || 0} stream(s)
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/watch/movie/${m.slug}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:text-red-400 bg-zinc-900 border border-zinc-700/80 px-2.5 py-1 rounded"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </Link>
                    <Link
                      href={`/movie/${m.slug}`}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-700/80 px-2.5 py-1 rounded"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
