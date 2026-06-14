import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import { toast } from "sonner";
import { MOODS, moodByKey } from "../lib/moods";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";

export default function Mood() {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [moods, setMoods] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const load = async () => {
    const [a, b] = await Promise.all([api.get("/mood?days=30"), api.get("/mood/analytics?days=30")]);
    setMoods(a.data || []);
    setAnalytics(b.data);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post("/mood", { mood: selected, note });
      toast.success("Mood logged · +10 XP");
      setSelected(null);
      setNote("");
      await load();
    } catch {
      toast.error("Could not log mood");
    } finally {
      setSaving(false);
    }
  };

  // Build 7x7 heatmap from last 49 days
  const buildHeatmap = () => {
    const today = new Date();
    const cells = [];
    const map = {};
    for (const m of moods) {
      const day = m.timestamp.slice(0, 10);
      if (!map[day] || m.score > map[day]) map[day] = m.score;
    }
    for (let i = 48; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      cells.push({ date: key, score: map[key] || 0 });
    }
    return cells;
  };
  const cells = buildHeatmap();
  const colorForScore = (s) => {
    if (!s) return "bg-white/[0.04]";
    if (s >= 8) return "bg-emerald-400/80";
    if (s >= 6) return "bg-purple-400/70";
    if (s >= 4) return "bg-indigo-500/60";
    if (s >= 2) return "bg-rose-500/60";
    return "bg-red-500/70";
  };

  const distData = analytics ? Object.entries(analytics.distribution).map(([k, v]) => ({
    name: moodByKey(k)?.label || k, value: v, emoji: moodByKey(k)?.emoji || "•",
  })) : [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Mood Tracker</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">How are you feeling, really?</h1>
      </div>

      {/* Picker */}
      <div className="glass rounded-3xl p-6">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 md:gap-3">
          {MOODS.map((m) => {
            const active = selected === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelected(m.key)}
                data-testid={`mood-${m.key}`}
                className={`p-3 rounded-2xl text-center transition-all border ${
                  active
                    ? "scale-110 bg-white/[0.08] border-purple-400/50 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] grayscale hover:grayscale-0"
                }`}
              >
                <div className="text-3xl md:text-4xl">{m.emoji}</div>
                <div className="text-[10px] mt-1 text-slate-300">{m.label}</div>
              </button>
            );
          })}
        </div>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
            <textarea
              placeholder="What's behind this feeling? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              data-testid="mood-note"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-sm focus:outline-none focus:border-purple-400/40 resize-none"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={submit} disabled={saving}
                data-testid="mood-submit"
                className="px-6 py-2.5 rounded-full gradient-brand font-medium disabled:opacity-50"
              >
                {saving ? "Saving…" : `Log ${moodByKey(selected)?.label}`}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      {analytics && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Avg mood (30d)</p>
            <p className="font-display text-3xl">{analytics.average_score || "—"}<span className="text-slate-400 text-base">/9</span></p>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Stability</p>
            <p className="font-display text-3xl">{analytics.stability}<span className="text-slate-400 text-base">/100</span></p>
          </div>
          <div className="glass rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Entries</p>
            <p className="font-display text-3xl">{analytics.total}</p>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Last 7 weeks</p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>less</span>
            {["bg-white/[0.04]", "bg-rose-500/60", "bg-indigo-500/60", "bg-purple-400/70", "bg-emerald-400/80"].map((c, i) => (
              <span key={i} className={`w-3 h-3 rounded ${c}`} />
            ))}
            <span>more</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5" data-testid="mood-heatmap">
          {cells.map((c) => (
            <div key={c.date} title={`${c.date}: ${c.score || "no log"}`} className={`aspect-square rounded ${colorForScore(c.score)} border border-white/[0.04]`} />
          ))}
        </div>
      </div>

      {/* Trend + distribution */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-4">Trend</p>
          {analytics?.trend?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.trend}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="avg" stroke="#A78BFA" strokeWidth={2} fill="url(#moodGrad)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748B" }} tickFormatter={(d) => d.slice(5)} />
                <YAxis hide domain={[1, 9]} />
                <Tooltip contentStyle={{ background: "#0C0814", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">No data yet.</p>}
        </div>

        <div className="glass rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-4">Distribution</p>
          {distData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distData}>
                <XAxis dataKey="emoji" tick={{ fontSize: 16 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: "#0C0814", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {distData.map((_, i) => <Cell key={i} fill={`url(#bar${i})`} />)}
                </Bar>
                <defs>
                  {distData.map((_, i) => (
                    <linearGradient key={i} id={`bar${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  ))}
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">No data yet.</p>}
        </div>
      </div>
    </div>
  );
}
