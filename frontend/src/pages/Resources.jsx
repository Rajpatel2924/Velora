import { useEffect, useState } from "react";
import api from "../lib/api";
import { motion } from "framer-motion";
import { Search, ExternalLink, BookOpen, Video, Headphones, FileText, Filter } from "lucide-react";

const TYPE_META = {
  article:  { Icon: BookOpen,   label: "Article",  color: "text-purple-300" },
  video:    { Icon: Video,      label: "Video",    color: "text-rose-300" },
  podcast:  { Icon: Headphones, label: "Podcast",  color: "text-cyan-300" },
  guide:    { Icon: FileText,   label: "Guide",    color: "text-emerald-300" },
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    const { data } = await api.get(`/resources?${params.toString()}`);
    setResources(data.items || []);
  };
  useEffect(() => {
    api.get("/resources/categories").then(({ data }) => setCategories(data)).catch(() => {});
  }, []);
  useEffect(() => { load().catch(() => {}); }, [category, type, q]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Resource Library</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Hand-picked wisdom.</h1>
        <p className="mt-2 text-slate-400 text-sm">Articles, videos, podcasts, and guides curated from trusted sources.</p>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl flex items-center px-4">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          placeholder="Search resources…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="resources-search"
          className="bg-transparent px-3 py-3 flex-1 outline-none text-sm"
        />
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2" data-testid="resources-type-filter">
        <button onClick={() => setType("")}
          className={`px-4 py-1.5 rounded-full text-sm border ${type === "" ? "bg-white/[0.08] border-purple-400/40" : "bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]"}`}>
          All
        </button>
        {Object.entries(TYPE_META).map(([k, { Icon, label }]) => (
          <button key={k} onClick={() => setType(k === type ? "" : k)}
            data-testid={`resources-type-${k}`}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border ${type === k ? "bg-white/[0.08] border-purple-400/40" : "bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setCategory("")}
          className={`p-4 rounded-2xl text-left border ${category === "" ? "bg-white/[0.06] border-purple-400/40" : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"}`}
        >
          <div className="text-sm font-medium">All categories</div>
        </button>
        {categories.map((c) => (
          <button key={c.key}
            onClick={() => setCategory(c.key === category ? "" : c.key)}
            data-testid={`resources-cat-${c.key}`}
            className={`p-4 rounded-2xl text-left relative overflow-hidden border ${category === c.key ? "border-purple-400/40" : "border-white/[0.06]"}`}>
            <div className={`absolute inset-0 opacity-50 bg-gradient-to-br ${c.color}`} />
            <div className="relative">
              <div className="text-sm font-medium">{c.title}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.length === 0 && (
          <div className="col-span-full glass rounded-3xl p-10 text-center text-slate-400">No matches. Try a different filter.</div>
        )}
        {resources.map((r, i) => {
          const meta = TYPE_META[r.type] || TYPE_META.article;
          const Icon = meta.Icon;
          return (
            <motion.a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              data-testid={`resource-${r.id}`}
              className="glass rounded-3xl overflow-hidden hover:bg-white/[0.05] transition group flex flex-col"
            >
              <div className="aspect-video relative overflow-hidden">
                <img src={r.image} alt={r.title} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px]">
                  <Icon className={`w-3 h-3 ${meta.color}`} />
                  <span className="uppercase tracking-[0.18em] text-white">{meta.label}</span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-display text-lg leading-tight">{r.title}</h3>
                <p className="text-sm text-slate-400 mt-2 line-clamp-3 flex-1">{r.description}</p>
                <div className="flex items-center justify-between mt-4 text-xs">
                  <span className="text-slate-500">{r.source} · {r.duration}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-300 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
