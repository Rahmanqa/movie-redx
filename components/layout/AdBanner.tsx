'use client';

import { useState } from 'react';
import { AdSetting } from '@/types/movie';
import { ExternalLink, Info, X } from 'lucide-react';

interface AdBannerProps {
  placement: 'top_banner' | 'sidebar' | 'under_player' | 'footer';
  ad?: AdSetting | null;
  className?: string;
}

export default function AdBanner({ placement, ad, className = '' }: AdBannerProps) {
  const [closed, setClosed] = useState(false);

  if (closed || !ad || !ad.isEnabled) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-red-950/40 bg-gradient-to-r from-zinc-950 via-red-950/20 to-zinc-950 p-3 sm:p-4 my-4 shadow-sm ${className}`}>
      {/* Sponsor Tag & Close */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-red-400">
          <Info className="w-3 h-3 text-red-500" />
          Sponsored Partner
        </span>
        <button
          onClick={() => setClosed(true)}
          className="text-zinc-400 hover:text-white transition-colors"
          title="Dismiss ad"
          aria-label="Close advertisement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Banner Content */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {ad.mediaUrl && (
          <div className="relative w-full sm:w-48 h-24 sm:h-20 shrink-0 overflow-hidden rounded-lg">
            <img
              src={ad.mediaUrl}
              alt={ad.title}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}

        <div className="flex-1 text-center sm:text-left space-y-1">
          <h4 className="text-sm sm:text-base font-bold text-white line-clamp-1">
            {ad.title}
          </h4>
          {ad.description && (
            <p className="text-xs text-zinc-400 line-clamp-2">
              {ad.description}
            </p>
          )}
        </div>

        {ad.destinationUrl && (
          <a
            href={ad.destinationUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-brand-primary hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-glow-sm transition-all"
          >
            <span>{ad.ctaText || 'Learn More'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
