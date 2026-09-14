import Link from 'next/link';
import Logo from './Logo';
import { Shield, Film, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#050507] border-t border-zinc-800/80 text-zinc-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-zinc-400 text-xs leading-relaxed pr-6">
              REDX CINEMA is a cinematic movie and TV-series discovery and bilingual streaming platform.
              Experience high-definition video playback with multi-audio support (English and Hindi)
              and subtitle synchronization on desktop, tablet, and mobile.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                100% Authorized & Licensed Content: We stream only public domain, Creative Commons,
                and licensed media with authorized distribution rights.
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/movies" className="hover:text-brand-primary transition-colors">
                  All Movies
                </Link>
              </li>
              <li>
                <Link href="/tv" className="hover:text-brand-primary transition-colors">
                  TV Series
                </Link>
              </li>
              <li>
                <Link href="/language/hindi" className="hover:text-brand-primary transition-colors">
                  Hindi Cinema (हिन्दी)
                </Link>
              </li>
              <li>
                <Link href="/language/english" className="hover:text-brand-primary transition-colors">
                  English Hollywood
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-brand-primary transition-colors">
                  Global Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Top Genres</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/genre/action" className="hover:text-brand-primary transition-colors">
                  Action & Thriller
                </Link>
              </li>
              <li>
                <Link href="/genre/sci-fi" className="hover:text-brand-primary transition-colors">
                  Sci-Fi & Cyberpunk
                </Link>
              </li>
              <li>
                <Link href="/genre/animation" className="hover:text-brand-primary transition-colors">
                  Animation 4K
                </Link>
              </li>
              <li>
                <Link href="/genre/horror" className="hover:text-brand-primary transition-colors">
                  Horror Classics
                </Link>
              </li>
              <li>
                <Link href="/genre/comedy" className="hover:text-brand-primary transition-colors">
                  Family & Comedy
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Legal & Trust</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dmca" className="hover:text-brand-primary transition-colors">
                  DMCA & Copyright Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-brand-primary transition-colors">
                  Content Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="hover:text-brand-primary transition-colors">
                  XML Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* TMDB Attribution & Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
            <img
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aae112b58c82e42b3149f4b8c9b3a3c103.svg"
              alt="TMDB Logo"
              className="h-4 w-auto opacity-70"
            />
            <span>
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </span>
          </div>

          <p className="text-zinc-400 text-[11px] text-center md:text-right">
            &copy; {new Date().getFullYear()} REDX CINEMA. All rights reserved. Built with Next.js, TypeScript & Supabase.
          </p>
        </div>
      </div>
    </footer>
  );
}
