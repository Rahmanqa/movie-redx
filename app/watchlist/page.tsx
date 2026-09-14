'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Trash2, Play, ArrowLeft } from 'lucide-react';
import { formatRating } from '@/lib/utils';

export default function WatchlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('redx_watchlist');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          setItems(list);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    try {
      localStorage.setItem('redx_watchlist', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const clearAll = () => {
    setItems([]);
    try {
      localStorage.removeItem('redx_watchlist');
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Bookmark className="w-7 h-7 text-brand-primary" />
            <span>My Watchlist</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Titles you have saved for later streaming
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Watchlist</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-zinc-400 text-sm">Loading watchlist...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center flex flex-col items-center justify-center">
          <Bookmark className="w-12 h-12 text-zinc-600 mb-3" />
          <h3 className="text-white font-bold text-base">Your watchlist is currently empty</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Click the bookmark icon on any movie or TV series card to save it here for fast access.
          </p>
          <Link
            href="/movies"
            className="mt-6 inline-flex items-center gap-2 bg-brand-primary hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-glow-sm transition-all"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden bg-brand-card border border-zinc-800 hover:border-brand-primary p-3 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2.5 bg-zinc-900">
                  <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white text-xs transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                  {item.title}
                </h3>
                <span className="text-[11px] text-zinc-400">{item.releaseYear}</span>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between">
                <Link
                  href={`/watch/movie/${item.slug}`}
                  className="flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:text-red-400"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Stream Now</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
