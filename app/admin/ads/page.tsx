'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Save, ShieldCheck, ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { AdSetting } from '@/types/movie';
import { INITIAL_ADS } from '@/lib/constants';

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdSetting[]>(INITIAL_ADS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('redx_ads_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setAds(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const updateAdField = (index: number, field: keyof AdSetting, value: any) => {
    const updated = [...ads];
    updated[index] = { ...updated[index], [field]: value };
    setAds(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('redx_ads_config', JSON.stringify(ads));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
          <DollarSign className="w-4 h-4" />
          <span>Monetization Engine</span>
        </div>
        <h1 className="text-2xl font-black text-white mt-1">Advertisement & Sponsor Units</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure clean, legal sponsor units, pre-roll overlays, and affiliate links to generate revenue
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Ad settings and affiliate destinations updated successfully!</span>
        </div>
      )}

      {/* Monetization Revenue Guide */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-950 to-zinc-900 border border-red-900/40 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>How to Maximize Your Earnings with REDX Cinema</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-300 pt-1">
          <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
            <h4 className="font-bold text-amber-400 mb-1">1. High-Paying VPN Affiliates</h4>
            <p className="text-[11px] text-zinc-400">
              Join NordVPN or ExpressVPN affiliate programs. They pay <strong>$30 to $80+ per trial sale</strong>.
              Paste your link in the Pre-roll sponsor destination below.
            </p>
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
            <h4 className="font-bold text-emerald-400 mb-1">2. Clean Banner Networks</h4>
            <p className="text-[11px] text-zinc-400">
              Monetag, Google AdSense, or Adsterra offer clean banners paying <strong>$2 to $6 CPM</strong>.
              Paste your banner image URL and link in Top Banner or Under Player.
            </p>
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
            <h4 className="font-bold text-blue-400 mb-1">3. Streaming Gear Affiliates</h4>
            <p className="text-[11px] text-zinc-400">
              Amazon Associates for Soundbars, 4K Smart TVs, and Fire Sticks. Users who click and buy earn you 5-10% commission.
            </p>
          </div>
        </div>
      </div>

      {/* Ad Units Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {ads.map((ad, idx) => (
          <div
            key={ad.id}
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-bold text-sm text-white uppercase font-mono">
                  {ad.placement.replace('_', ' ')}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {ad.placement === 'pre_roll' && 'Appears before movie/episode playback with countdown skip timer'}
                  {ad.placement === 'top_banner' && 'Appears on the homepage leaderboard'}
                  {ad.placement === 'under_player' && 'Appears directly below the video player in theater mode'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`enable-${ad.id}`}
                  checked={ad.isEnabled}
                  onChange={(e) => updateAdField(idx, 'isEnabled', e.target.checked)}
                  className="accent-brand-primary w-4 h-4"
                />
                <label htmlFor={`enable-${ad.id}`} className="text-xs font-semibold text-zinc-300">
                  {ad.isEnabled ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Headline Title *
                </label>
                <input
                  type="text"
                  required
                  value={ad.title}
                  onChange={(e) => updateAdField(idx, 'title', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={ad.ctaText || ''}
                  onChange={(e) => updateAdField(idx, 'ctaText', e.target.value)}
                  placeholder="e.g. Claim 75% Discount"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Description Subtext
              </label>
              <input
                type="text"
                value={ad.description || ''}
                onChange={(e) => updateAdField(idx, 'description', e.target.value)}
                placeholder="Benefit description or sponsor offer..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Affiliate / Destination URL *
                </label>
                <input
                  type="url"
                  required
                  value={ad.destinationUrl || ''}
                  onChange={(e) => updateAdField(idx, 'destinationUrl', e.target.value)}
                  placeholder="https://nordvpn.com?coupon=..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Banner Image / Creative URL
                </label>
                <input
                  type="url"
                  value={ad.mediaUrl || ''}
                  onChange={(e) => updateAdField(idx, 'mediaUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {ad.placement === 'pre_roll' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Total Duration (seconds)</label>
                  <input
                    type="number"
                    value={ad.durationSeconds || 15}
                    onChange={(e) => updateAdField(idx, 'durationSeconds', Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Can Skip After (seconds)</label>
                  <input
                    type="number"
                    value={ad.canSkipAfterSeconds || 5}
                    onChange={(e) => updateAdField(idx, 'canSkipAfterSeconds', Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-glow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Monetization Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
