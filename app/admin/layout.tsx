'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, Film, Tv, Video, Subtitles, DollarSign, 
  Settings, FileText, ArrowLeft, BarChart3, Database 
} from 'lucide-react';
import Logo from '@/components/layout/Logo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard Overview', href: '/admin', icon: BarChart3 },
    { name: 'Movies Management', href: '/admin/movies', icon: Film },
    { name: 'TV Series & Shows', href: '/admin/tv', icon: Tv },
    { name: 'Monetization & Ads', href: '/admin/ads', icon: DollarSign },
    { name: 'Site & TMDB Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800/80 p-4 shrink-0 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-500" />
              <span className="font-black text-sm uppercase tracking-wider text-white">Admin Command</span>
            </div>
            <Link href="/" className="text-zinc-400 hover:text-white" title="Return to public site">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-glow-sm font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Security badge */}
        <div className="mt-8 p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-[11px] text-zinc-400 space-y-1">
          <div className="flex items-center gap-1 text-red-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Role Guard Active</span>
          </div>
          <p className="text-[10px] text-zinc-400">
            Protected with Supabase Row Level Security & Server Verification.
          </p>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
