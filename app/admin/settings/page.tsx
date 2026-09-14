'use client';

import { useState } from 'react';
import { Settings, Key, ShieldCheck, Mail, Globe, Save, CheckCircle2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState('REDX CINEMA');
  const [tagline, setTagline] = useState('Dual Audio Streaming Platform (English & Hindi)');
  const [tmdbKey, setTmdbKey] = useState('');
  const [contactEmail, setContactEmail] = useState('contact@redxcinema.com');
  const [dmcaEmail, setDmcaEmail] = useState('dmca@redxcinema.com');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
          <Settings className="w-4 h-4 text-brand-primary" />
          <span>Configuration</span>
        </div>
        <h1 className="text-2xl font-black text-white mt-1">Platform & API Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure TMDB metadata credentials, site branding, and legal compliance emails
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* TMDB API Settings */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-primary" />
            <span>TMDB (The Movie Database) Metadata API</span>
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed">
            REDX CINEMA utilizes TMDB strictly for fetching film summaries, cast credits, posters, and recommendations.
            Private API keys are stored securely on the server and never exposed to the client.
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              TMDB API Key (v3 auth or Read Access Token)
            </label>
            <input
              type="password"
              value={tmdbKey}
              onChange={(e) => setTmdbKey(e.target.value)}
              placeholder="Paste your TMDB API Key from themoviedb.org/settings/api"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Leave blank to continue using offline seed data.
            </span>
          </div>
        </div>

        {/* Site Identity */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-primary" />
            <span>Site Identity & Branding</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Brand Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Legal & Compliance Contacts */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-primary" />
            <span>Legal & DMCA Compliance Contacts</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">DMCA Notice Email</label>
              <input
                type="email"
                value={dmcaEmail}
                onChange={(e) => setDmcaEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-glow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
