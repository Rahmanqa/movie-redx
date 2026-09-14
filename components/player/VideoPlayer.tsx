'use client';

import { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize, 
  Settings, Globe, Subtitles, Check, AlertTriangle, ShieldCheck, SkipForward, Server
} from 'lucide-react';
import { VideoSource, SubtitleTrack, AdSetting } from '@/types/movie';
import { formatTimeSeconds } from '@/lib/utils';

interface VideoPlayerProps {
  title: string;
  sources: VideoSource[];
  subtitles?: SubtitleTrack[];
  preRollAd?: AdSetting | null;
  contentId: string;
  contentType: 'movie' | 'episode';
  posterUrl?: string;
  onProgressUpdate?: (seconds: number, duration: number) => void;
}

export default function VideoPlayer({
  title,
  sources = [],
  subtitles = [],
  preRollAd,
  contentId,
  contentType,
  posterUrl,
  onProgressUpdate
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Pre-roll Sponsor Ad state
  const [adActive, setAdActive] = useState(preRollAd?.isEnabled ?? false);
  const [adCountdown, setAdCountdown] = useState(preRollAd?.canSkipAfterSeconds ?? 5);
  const [canSkipAd, setCanSkipAd] = useState(false);

  // Active source selection
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const currentSource = sources[activeSourceIndex] || sources[0];
  const isEmbed = currentSource?.streamType === 'EMBED' || currentSource?.videoUrl?.includes('embed') || currentSource?.videoUrl?.includes('vidsrc');

  // Playback state for HTML5 mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dropdowns
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string>('off');

  // Resume state
  const [resumePromptTime, setResumePromptTime] = useState<number | null>(null);

  // Languages available
  const availableLanguages = Array.from(new Set(sources.map((s) => s.language)));

  // Ad countdown effect
  useEffect(() => {
    if (!adActive) return;
    const timer = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          setCanSkipAd(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [adActive]);

  // Check saved progress
  useEffect(() => {
    try {
      const storageKey = `redx_progress_${contentType}_${contentId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentTime && parsed.currentTime > 15 && parsed.currentTime < (parsed.duration - 30)) {
          setResumePromptTime(parsed.currentTime);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [contentId, contentType]);

  // Stream initialization for HTML5 / HLS
  useEffect(() => {
    if (!currentSource || adActive || isEmbed) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setErrorMsg(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (currentSource.streamType === 'HLS' || currentSource.videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(currentSource.videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('HLS fatal error:', data);
            setErrorMsg(`Streaming error (${data.details}). Attempting fallback.`);
            hls.destroy();
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentSource.videoUrl;
        setIsLoading(false);
      } else {
        setErrorMsg('HLS playback is not supported in this browser.');
        setIsLoading(false);
      }
    } else {
      video.src = currentSource.videoUrl;
      video.load();
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSource?.videoUrl, currentSource?.streamType, adActive, isEmbed]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback prevented:', e);
      });
    }
  };

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
  };

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const handleSubtitleSelect = (subId: string) => {
    setSelectedSubtitleId(subId);
    setShowSubtitleMenu(false);
    if (!videoRef.current) return;

    const tracks = videoRef.current.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      if (subId === 'off') {
        tracks[i].mode = 'disabled';
      } else {
        const sub = subtitles.find((s) => s.id === subId);
        if (sub && tracks[i].language.toLowerCase() === sub.language.toLowerCase()) {
          tracks[i].mode = 'showing';
        } else {
          tracks[i].mode = 'disabled';
        }
      }
    }
  };

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    if (Math.floor(video.currentTime) % 5 === 0 && video.currentTime > 5) {
      try {
        const storageKey = `redx_progress_${contentType}_${contentId}`;
        localStorage.setItem(storageKey, JSON.stringify({
          contentId,
          contentType,
          currentTime: video.currentTime,
          duration: video.duration || 0,
          updatedAt: new Date().toISOString()
        }));
      } catch (e) {
        // ignore
      }
    }

    if (onProgressUpdate) {
      onProgressUpdate(video.currentTime, video.duration || 0);
    }
  };

  const resumePlayback = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setResumePromptTime(null);
      togglePlay();
    }
  };

  return (
    <div className="space-y-3">
      {/* Server Switcher Bar for Multi-Source / TMDB Stream Engines */}
      {sources.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Server className="w-3.5 h-3.5 text-red-500" />
            <span>Select Server:</span>
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {sources.map((s, idx) => {
              const isSelected = idx === activeSourceIndex;
              return (
                <button
                  key={s.id || idx}
                  onClick={() => setActiveSourceIndex(idx)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-primary text-white shadow-glow-sm'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{s.serverName || `Server ${idx + 1} (${s.language})`}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Player Box */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl group select-none"
      >
        {/* 1. Pre-roll Sponsor Ad Overlay */}
        {adActive && preRollAd && (
          <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-red-950/80 border border-red-600/50 text-red-300 text-xs px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span>Official REDX Sponsor</span>
              </div>

              {preRollAd.mediaUrl && (
                <img
                  src={preRollAd.mediaUrl}
                  alt={preRollAd.title}
                  className="w-full h-44 object-cover rounded-xl border border-zinc-700 shadow-lg"
                />
              )}

              <div>
                <h3 className="text-lg font-bold text-white">{preRollAd.title}</h3>
                {preRollAd.description && (
                  <p className="text-xs text-zinc-400 mt-1">{preRollAd.description}</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                {preRollAd.destinationUrl && (
                  <a
                    href={preRollAd.destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="bg-brand-primary hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-glow-sm transition-all"
                  >
                    {preRollAd.ctaText || 'Visit Sponsor'}
                  </a>
                )}

                {canSkipAd ? (
                  <button
                    onClick={() => setAdActive(false)}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors border border-zinc-600"
                  >
                    <span>Skip to Video</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg">
                    Skip in {adCountdown}s
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Resume Alert Overlay */}
        {resumePromptTime && !adActive && !isEmbed && (
          <div className="absolute top-4 left-4 right-4 z-30 bg-zinc-900/90 backdrop-blur-md border border-red-500/50 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-xl animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-ping" />
              <p className="text-xs sm:text-sm text-white font-medium">
                Resume playback from <span className="font-mono text-brand-primary font-bold">{formatTimeSeconds(resumePromptTime)}</span>?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => resumePlayback(resumePromptTime)}
                className="bg-brand-primary hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-glow-sm transition-all"
              >
                Resume
              </button>
              <button
                onClick={() => setResumePromptTime(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* 3. Player Surface: If EMBED Server vs HTML5 Video */}
        {isEmbed ? (
          <iframe
            src={currentSource.videoUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              poster={posterUrl}
              crossOrigin="anonymous"
              playsInline
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) setDuration(videoRef.current.duration || 0);
                setIsLoading(false);
              }}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => {
                setIsLoading(false);
                setIsPlaying(true);
              }}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
            >
              {subtitles.map((sub) => (
                <track
                  key={sub.id}
                  kind="subtitles"
                  label={sub.label}
                  src={sub.subtitleUrl}
                  srcLang={sub.language.toLowerCase().slice(0, 2)}
                />
              ))}
            </video>

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin shadow-glow-md" />
              </div>
            )}

            {errorMsg && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
                <h4 className="text-white font-bold text-base mb-1">Playback Notice</h4>
                <p className="text-xs text-zinc-400 max-w-sm mb-4">{errorMsg}</p>
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setIsLoading(true);
                    if (videoRef.current) videoRef.current.load();
                  }}
                  className="bg-brand-primary hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Retry Stream
                </button>
              </div>
            )}

            {/* Custom Control Bar Overlay for HTML5 */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-transparent to-black/60">
              <div className="flex items-center justify-between pointer-events-auto">
                <div>
                  <h2 className="text-sm font-bold text-white drop-shadow">{title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-red-950/80 border border-red-500/50 text-red-300 px-1.5 py-0.5 rounded font-bold">
                      Audio: {currentSource?.language || 'English'}
                    </span>
                    <span className="text-[10px] bg-zinc-900/80 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                      {currentSource?.quality || '1080p'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pointer-events-auto">
                <div className="relative group/scrub flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-primary hover:h-2 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="text-white hover:text-brand-primary transition-colors p-1"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>

                    <button
                      onClick={() => handleSeek(-10)}
                      className="text-zinc-300 hover:text-white transition-colors"
                      title="Rewind 10s"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleSeek(10)}
                      className="text-zinc-300 hover:text-white transition-colors"
                      title="Forward 10s"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5 group/vol">
                      <button onClick={toggleMute} className="text-zinc-300 hover:text-white">
                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-14 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                      />
                    </div>

                    <span className="text-[11px] font-mono text-zinc-300">
                      {formatTimeSeconds(currentTime)} / {formatTimeSeconds(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 relative">
                    {/* Audio track switcher */}
                    <button
                      onClick={() => setShowAudioMenu(!showAudioMenu)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-zinc-900/60 text-zinc-300 hover:text-white"
                      title="Switch Audio Track"
                    >
                      <Globe className="w-3.5 h-3.5 text-red-400" />
                      <span>{currentSource?.language}</span>
                    </button>

                    {/* Subtitle menu */}
                    {subtitles.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                          className="text-xs px-2 py-1 rounded bg-zinc-900/60 text-zinc-300 hover:text-white"
                          title="Subtitles"
                        >
                          <Subtitles className="w-3.5 h-3.5" />
                        </button>
                        {showSubtitleMenu && (
                          <div className="absolute bottom-9 right-0 bg-zinc-950 border border-zinc-700 rounded-xl p-2 w-36 shadow-2xl z-50 space-y-1">
                            <button
                              onClick={() => handleSubtitleSelect('off')}
                              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs ${
                                selectedSubtitleId === 'off' ? 'bg-brand-primary text-white' : 'text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <span>Off</span>
                              {selectedSubtitleId === 'off' && <Check className="w-3 h-3" />}
                            </button>
                            {subtitles.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => handleSubtitleSelect(sub.id)}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs ${
                                  selectedSubtitleId === sub.id ? 'bg-brand-primary text-white' : 'text-zinc-300 hover:bg-zinc-800'
                                }`}
                              >
                                <span>{sub.label}</span>
                                {selectedSubtitleId === sub.id && <Check className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={toggleFullscreen}
                      className="text-zinc-300 hover:text-white transition-colors p-1"
                      aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
