import Link from 'next/link';
import { Film, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-500/30 flex items-center justify-center mx-auto text-brand-primary">
          <Film className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-4xl font-black text-white">404</h1>
          <h2 className="text-lg font-bold text-zinc-300 mt-1">Title or Page Not Found</h2>
          <p className="text-xs text-zinc-400 mt-2">
            The film or series you are looking for might have been moved or is currently unavailable.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-glow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search Library</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
