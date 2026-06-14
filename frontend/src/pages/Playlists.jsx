import { useEffect, useState } from "react";
import api from "../lib/api";
import { motion } from "framer-motion";
import { Music, ExternalLink, Play } from "lucide-react";

export default function Playlists() {
  const [moods, setMoods] = useState([]);
  const [activeMood, setActiveMood] = useState("relaxed");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [featured, setFeatured] = useState(null);
  const [iframeFailed, setIframeFailed] = useState(false);

  useEffect(() => {
    api.get("/spotify/moods").then(({ data }) => setMoods(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setFeatured(null);
    setIframeFailed(false);
    api.get(`/spotify/playlists?mood=${activeMood}&limit=12`).then(({ data }) => {
      const list = data.items || [];
      setItems(list);
      if (list.length > 0) setFeatured(list[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeMood]);

  const selectFeatured = (p) => {
    setFeatured(p);
    setIframeFailed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Mood Playlists</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Sound for what you're feeling.</h1>
        <p className="mt-2 text-slate-400 text-sm">Curated Spotify playlists — tap a mood, then pick a vibe.</p>
      </div>

      {/* Mood chips */}
      <div className="flex flex-wrap gap-2" data-testid="playlists-mood-bar">
        {moods.map((m) => (
          <button key={m.key}
            onClick={() => setActiveMood(m.key)}
            data-testid={`playlist-mood-${m.key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition ${
              activeMood === m.key
                ? "bg-purple-500/25 border-purple-400/60 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"
            }`}>
            <span>{m.emoji}</span>{m.label}
          </button>
        ))}
      </div>

      {/* Featured */}
      {featured && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-6 md:p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">Now featured</p>
                <h2 className="font-display text-2xl md:text-3xl mb-2">{featured.name}</h2>
                <p className="text-sm text-slate-300">{featured.description}</p>
              </div>
              <a href={featured.url} target="_blank" rel="noreferrer"
                data-testid="featured-open-spotify"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1DB954] text-white font-medium hover:brightness-110 transition w-fit">
                <Play className="w-4 h-4 fill-white" /> Listen on Spotify
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-black/30 relative min-h-[300px]">
              {!iframeFailed ? (
                <iframe
                  key={featured.id}
                  title={featured.name}
                  src={featured.embed_url}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  onError={() => setIframeFailed(true)}
                  className="absolute inset-0 w-full h-full"
                  data-testid="featured-iframe"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center p-6 text-center">
                  <div>
                    <Music className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-300 max-w-xs">Embedded player can't load in this environment. Tap "Listen on Spotify" to open it.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Cards */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-3">More for this mood</p>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => <div key={i} className="glass rounded-3xl h-40 shimmer" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p, i) => {
              const isFeatured = featured?.id === p.id;
              return (
                <motion.div key={p.id + i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  data-testid={`playlist-${p.id}`}
                  className={`glass rounded-3xl overflow-hidden flex flex-col ${isFeatured ? "border border-purple-400/40" : ""}`}>
                  <button onClick={() => selectFeatured(p)} data-testid={`playlist-select-${p.id}`}
                    className="p-5 flex items-start gap-3 text-left hover:bg-white/[0.04] transition flex-1">
                    <div className="h-14 w-14 rounded-2xl gradient-aurora grid place-items-center text-2xl border border-white/[0.08] shrink-0">
                      {p.image_emoji || <Music className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base truncate">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                    </div>
                  </button>
                  <div className="px-5 pb-5">
                    <a href={p.url} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-full bg-[#1DB954]/15 hover:bg-[#1DB954]/25 text-[#1DB954] text-xs font-medium transition">
                      <Play className="w-3 h-3 fill-current" /> Open in Spotify
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center">Tip: With Spotify Premium, the embedded player plays full tracks — otherwise it plays 30-sec previews.</p>
    </div>
  );
}
