import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Shuffle, 
  ExternalLink, 
  Calendar, 
  Tag, 
  Disc, 
  ChevronDown, 
  Play, 
  Info,
  Loader2,
  Volume2,
  Globe
} from 'lucide-react';
import { GENRES, STYLES, DECADES, COUNTRIES } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Release {
  id: number;
  title: string;
  artists: { name: string }[];
  year: number;
  genres: string[];
  styles: string[];
  images?: { resource_url: string }[];
  uri: string;
  tracklist?: { title: string; duration: string; position: string }[];
  videos?: { uri: string; title: string }[];
  country?: string;
  youtube?: {
    type: 'playlist' | 'videos';
    id?: string;
    ids?: string[];
  };
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [release, setRelease] = useState<Release | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [genre, setGenre] = useState("");
  const [style, setStyle] = useState("");
  const [decade, setDecade] = useState("");
  const [country, setCountry] = useState("");

  const fetchRandomRelease = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (genre) params.append('genre', genre);
      if (style) params.append('style', style);
      if (decade) params.append('year', decade);
      if (country) params.append('country', country);

      const response = await fetch(`/api/random-release?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch release");
      }
      const data = await response.json();
      setRelease(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEmbedUrl = (youtube: Release['youtube']) => {
    if (!youtube) return null;
    if (youtube.type === 'playlist' && youtube.id) {
      return `https://www.youtube.com/embed/videoseries?list=${youtube.id}`;
    }
    if (youtube.type === 'videos' && youtube.ids && youtube.ids.length > 0) {
      const [first, ...rest] = youtube.ids;
      if (rest.length > 0) {
        return `https://www.youtube.com/embed/${first}?playlist=${rest.join(',')}`;
      }
      return `https://www.youtube.com/embed/${first}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-20 bg-[#0a0a0a] text-[#f5f2ed]">
      {/* Header */}
      <header className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-black/50 text-[10px] uppercase tracking-widest font-semibold mb-4 backdrop-blur-sm"
        >
          <Disc className="w-3 h-3 animate-spin-slow" />
          Powered by Discogs
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-serif italic mb-4 tracking-tight">
          Random<span className="font-sans not-italic font-light">Sound</span>
        </h1>
        <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed">
          Explore the depths of music history. One random discovery at a time.
        </p>
      </header>

      {/* Filters */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="relative group">
          <label className="absolute -top-2 left-3 px-1 bg-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-white/40 z-10">Genre</label>
          <select 
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full h-14 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/10 transition-all cursor-pointer text-sm text-white"
          >
            <option value="" className="bg-black">All Genres</option>
            {GENRES.map(g => <option key={g} value={g} className="bg-black">{g}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>

        <div className="relative group">
          <label className="absolute -top-2 left-3 px-1 bg-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-white/40 z-10">Style</label>
          <select 
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full h-14 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/10 transition-all cursor-pointer text-sm text-white"
          >
            <option value="" className="bg-black">All Styles</option>
            {STYLES.map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>

        <div className="relative group">
          <label className="absolute -top-2 left-3 px-1 bg-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-white/40 z-10">Era</label>
          <select 
            value={decade}
            onChange={(e) => setDecade(e.target.value)}
            className="w-full h-14 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/10 transition-all cursor-pointer text-sm text-white"
          >
            {DECADES.map(d => <option key={d.value} value={d.value} className="bg-black">{d.label}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>

        <div className="relative group">
          <label className="absolute -top-2 left-3 px-1 bg-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-white/40 z-10">Country</label>
          <select 
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full h-14 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-white/10 transition-all cursor-pointer text-sm text-white"
          >
            <option value="" className="bg-black">All Countries</option>
            {COUNTRIES.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={fetchRandomRelease}
        disabled={loading}
        className="group relative flex items-center justify-center gap-3 w-full max-w-xs h-16 bg-white text-black rounded-full font-medium overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-16 shadow-lg shadow-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Searching for album with video...</span>
          </div>
        ) : (
          <>
            <Shuffle className="w-5 h-5" />
            <span>Surprise Me</span>
          </>
        )}
      </motion.button>

      {/* Result Area */}
      <div className="w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="bg-red-900/20 border border-red-800/30 text-red-400 p-4 rounded-2xl text-center text-sm w-full">
                {error}
              </div>
              <button 
                onClick={() => {
                  setGenre("");
                  setStyle("");
                  setDecade("");
                  setCountry("");
                  setError(null);
                }}
                className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                Reset Filters
              </button>
            </motion.div>
          )}

          {release && !loading && (
            <motion.div
              key={release.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Cover Art */}
              <div className="lg:col-span-5 space-y-6">
                <div className="aspect-square bg-white/5 rounded-3xl overflow-hidden shadow-2xl relative group">
                  {release.images && release.images[0] ? (
                    <img 
                      src={release.images[0].resource_url} 
                      alt={release.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                      <Music className="w-32 h-32" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex flex-wrap gap-2">
                  {release.genres.map(g => (
                    <span key={g} className="px-3 py-1 bg-white/10 border border-white/5 rounded-full text-[11px] font-medium uppercase tracking-wider text-white/60">
                      {g}
                    </span>
                  ))}
                  {release.styles?.map(s => (
                    <span key={s} className="px-3 py-1 bg-white/5 rounded-full text-[11px] font-medium uppercase tracking-wider text-white/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="lg:col-span-7 space-y-8">
                <div>
                  <motion.h2 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl md:text-6xl font-serif font-bold mb-2 leading-tight"
                  >
                    {release.title}
                  </motion.h2>
                  <p className="text-2xl md:text-3xl text-white/40 font-light italic">
                    by {release.artists.map(a => a.name).join(', ')}
                  </p>
                </div>

                {/* YouTube Player */}
                {release.youtube && getEmbedUrl(release.youtube) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black"
                  >
                    <iframe 
                      src={getEmbedUrl(release.youtube)} 
                      title="YouTube video player" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-white/20" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Released</p>
                      <p className="text-sm font-medium">{release.year || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                    <Globe className="w-5 h-5 text-white/20" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Country</p>
                      <p className="text-sm font-medium">{release.country || 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                {/* Tracklist */}
                {release.tracklist && release.tracklist.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 flex items-center gap-2">
                      <Volume2 className="w-3 h-3" />
                      Tracklist
                    </h3>
                    <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                      {release.tracklist.slice(0, 8).map((track, i) => (
                        <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-mono text-white/20 group-hover:text-white/40 transition-colors">
                              {track.position || (i + 1).toString().padStart(2, '0')}
                            </span>
                            <span className="text-sm font-medium">{track.title}</span>
                          </div>
                          <span className="text-xs font-mono text-white/30">{track.duration}</span>
                        </div>
                      ))}
                      {release.tracklist.length > 8 && (
                        <div className="px-5 py-2 text-center text-[10px] text-white/30 italic">
                          + {release.tracklist.length - 8} more tracks
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* External Links */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <a 
                    href={release.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-medium hover:bg-white hover:text-black hover:border-white transition-all"
                  >
                    View on Discogs
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  
                  {release.videos && release.videos[0] && (
                    <a 
                      href={release.videos[0].uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-[#FF0000] text-white rounded-full text-sm font-medium hover:bg-[#CC0000] transition-all shadow-lg shadow-red-500/20"
                    >
                      Listen on YouTube
                      <Play className="w-4 h-4 fill-current" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {!release && !loading && !error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-white/20"
            >
              <div className="w-24 h-24 border-2 border-dashed border-white/10 rounded-full flex items-center justify-center mb-6">
                <Music className="w-10 h-10" />
              </div>
              <p className="text-sm font-medium italic">Your next favorite record is waiting...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-20 pb-8 text-center">
        <div className="flex items-center justify-center gap-6 mb-4">
          <a href="#" className="text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-white transition-colors">About</a>
          <a href="#" className="text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-white transition-colors">API</a>
          <a href="#" className="text-[10px] uppercase tracking-widest font-bold text-white/30 hover:text-white transition-colors">Privacy</a>
        </div>
        <p className="text-[10px] text-white/20 font-mono">
          &copy; {new Date().getFullYear()} RANDOM SOUND EXPLORER
        </p>
      </footer>
    </div>
  );
}
