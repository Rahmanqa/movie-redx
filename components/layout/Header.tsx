'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bookmark, Menu, X, Globe, Film, Tv, Flame, User, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlistCount, setWatchlistCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Read local watchlist count
    try {
      const stored = localStorage.getItem('redx_watchlist');
      if (stored) {
        const list = JSON.parse(stored);
        setWatchlistCount(Array.isArray(list) ? list.length : 0);
      }
    } catch (e) {
      // ignore
    }
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Movies', href: '/movies' },
    { name: 'TV Shows', href: '/tv' },
    { name: 'Hindi Cinema', href: '/language/hindi', badge: 'हिन्दी' },
    { name: 'English Hits', href: '/language/english', badge: 'EN' },
    { name: 'Action', href: '/genre/action' },
    { name: 'Sci-Fi', href: '/genre/sci-fi' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-brand-dark/95 backdrop-blur-md border-b border-white/10 shadow-lg py-2.5'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-white flex items-center gap-1.5 ${
                  isActive ? 'text-brand-primary font-semibold' : 'text-zinc-300'
                }`}
              >
                {link.name}
                {link.badge && (
                  <span className="text-[10px] bg-red-600/30 text-red-400 border border-red-500/40 rounded px-1 py-0.2 font-mono">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Search, Watchlist, Auth */}
        <div className="flex items-center gap-3">
          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
            <input
              type="text"
              placeholder="Search movies, TV shows, actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900/80 border border-zinc-700/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary w-48 lg:w-64 transition-all"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          </form>

          {/* Watchlist Quick Link */}
          <Link
            href="/watchlist"
            className="relative p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-full transition-colors"
            title="My Watchlist"
            aria-label="View Watchlist"
          >
            <Bookmark className="w-5 h-5" />
            {watchlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-black">
                {watchlistCount}
              </span>
            )}
          </Link>

          {/* Admin link shortcut */}
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 bg-zinc-900/60 border border-zinc-800 rounded-lg px-2.5 py-1.5 transition-colors"
            title="Admin Dashboard"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
            <span>Admin</span>
          </Link>

          {/* User Sign In / Profile */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 bg-brand-primary hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-glow-sm transition-all"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign In</span>
          </Link>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-300 hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-brand-dark/98 border-b border-zinc-800 px-4 pt-3 pb-6 space-y-4">
          {/* Mobile search bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search movies, TV shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
          </form>

          {/* Mobile nav links */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="text-[10px] bg-red-600/30 text-red-400 border border-red-500/40 rounded px-1.5 py-0.5">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-red-400"
            >
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>Admin Management</span>
            </Link>
            <Link
              href="/watchlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white"
            >
              <Bookmark className="w-4 h-4 text-red-500" />
              <span>Watchlist ({watchlistCount})</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
