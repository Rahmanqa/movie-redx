'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/utils';
import { DEFAULT_GENRES } from '@/lib/constants';
import { Film, Video, Globe, Save, ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function NewMoviePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Movie Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [overview, setOverview] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [runtimeMinutes, setRuntimeMinutes] = useState(90);
  const [rating, setRating] = useState(8.0);
  const [contentRights, setContentRights] = useState<'public_domain' | 'licensed' | 'authorized_external'>('licensed');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['action']);

  // Video Sources (Bilingual support)
  const [sources, setSources] = useState([
    {
      language: 'English',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      streamType: 'MP4',
      quality: '1080p',
      isDefault: true,
    },
    {
      language: 'Hindi',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      streamType: 'MP4',
      quality: '1080p',
      isDefault: false,
    },
  ]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
  };

  const addSource = () => {
    setSources([
      ...sources,
      {
        language: 'Hindi',
        videoUrl: '',
        streamType: 'MP4',
        quality: '720p',
        isDefault: false,
      },
    ]);
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, idx) => idx !== index));
  };

  const updateSource = (index: number, field: string, value: any) => {
    const updated = [...sources];
    updated[index] = { ...updated[index], [field]: value };
    setSources(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save locally or dispatch API
      const genresList = DEFAULT_GENRES.filter((g) => selectedGenres.includes(g.slug));
      const audioLanguages = Array.from(new Set(sources.map((s) => s.language)));

      const newMovie = {
        id: `movie-${Date.now()}`,
        slug: slug || slugify(title),
        title,
        overview,
        posterUrl: posterUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
        backdropUrl: backdropUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600',
        trailerUrl,
        releaseDate: `${releaseYear}-01-01`,
        releaseYear: Number(releaseYear),
        runtimeMinutes: Number(runtimeMinutes),
        rating: Number(rating),
        voteCount: 1,
        genres: genresList,
        audioLanguages,
        subtitleLanguages: ['English', 'Hindi'],
        qualities: ['1080p'],
        cast: [],
        isFeatured: false,
        isTrending: true,
        isPublished: true,
        contentRights,
        videoSources: sources.map((s, idx) => ({
          id: `source-${Date.now()}-${idx}`,
          language: s.language,
          videoUrl: s.videoUrl,
          streamType: s.streamType as any,
          quality: s.quality as any,
          isDefault: s.isDefault,
          isActive: true,
          contentRights,
        })),
        subtitles: [],
      };

      // Store in local storage for local demonstration persistence
      const stored = localStorage.getItem('redx_custom_movies');
      const list = stored ? JSON.parse(stored) : [];
      list.push(newMovie);
      localStorage.setItem('redx_custom_movies', JSON.stringify(list));

      setSavedSuccess(true);
      setTimeout(() => {
        router.push('/admin/movies');
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/movies" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Add New Movie</h1>
            <p className="text-xs text-zinc-400">Configure movie details, bilingual audio sources, and rights</p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Movie created successfully with dual audio streams! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Details */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-brand-primary" />
            <span>Title & Overview</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Movie Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Inception Dual Audio"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="inception-dual-audio"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono focus:border-brand-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Synopsis / Overview *</label>
            <textarea
              required
              rows={3}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Plot overview, storyline, and description..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Release Year</label>
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Runtime (mins)</label>
              <input
                type="number"
                value={runtimeMinutes}
                onChange={(e) => setRuntimeMinutes(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Rating (0-10)</label>
              <input
                type="number"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Rights License</label>
              <select
                value={contentRights}
                onChange={(e) => setContentRights(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-300"
              >
                <option value="licensed">Licensed Stream</option>
                <option value="public_domain">Public Domain</option>
                <option value="authorized_external">Authorized External</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Poster Image URL</label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Backdrop Image URL</label>
              <input
                type="url"
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bilingual Video Sources */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-500" />
              <span>Bilingual Video Streams (English & Hindi)</span>
            </h2>

            <button
              type="button"
              onClick={addSource}
              className="inline-flex items-center gap-1 text-xs text-brand-primary hover:text-red-400 font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Audio Stream</span>
            </button>
          </div>

          <div className="space-y-3">
            {sources.map((source, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-3 relative"
              >
                <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800/80">
                  <span className="font-bold text-zinc-300">Stream #{index + 1}</span>
                  {sources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSource(index)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Audio Language</label>
                    <select
                      value={source.language}
                      onChange={(e) => updateSource(index, 'language', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Stream Type</label>
                    <select
                      value={source.streamType}
                      onChange={(e) => updateSource(index, 'streamType', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="MP4">MP4 Direct</option>
                      <option value="HLS">HLS Adaptive (.m3u8)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Quality</label>
                    <select
                      value={source.quality}
                      onChange={(e) => updateSource(index, 'quality', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="1080p">1080p Full HD</option>
                      <option value="720p">720p HD</option>
                      <option value="480p">480p SD</option>
                      <option value="4K">4K Ultra HD</option>
                      <option value="Auto">Auto (HLS)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id={`default-${index}`}
                      checked={source.isDefault}
                      onChange={(e) => updateSource(index, 'isDefault', e.target.checked)}
                      className="accent-brand-primary"
                    />
                    <label htmlFor={`default-${index}`} className="text-xs text-zinc-300">
                      Default Audio
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Video Stream URL *</label>
                  <input
                    type="url"
                    required
                    value={source.videoUrl}
                    onChange={(e) => updateSource(index, 'videoUrl', e.target.value)}
                    placeholder="https://commondatastorage.googleapis.com/.../video.mp4 or .m3u8"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/movies"
            className="text-xs text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl border border-zinc-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-glow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Movie...' : 'Save & Publish Movie'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
