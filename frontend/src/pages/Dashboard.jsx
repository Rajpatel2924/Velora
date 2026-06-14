import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { MOODS, moodByKey } from "../lib/moods";
import { toast } from "sonner";
import {
  Sparkles, Flame, Trophy, Wind, MessageCircle, BookHeart, ListChecks, Smile, TrendingUp, Moon,
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [insight, setInsight] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(true);

  useEffect(() => {
    api.get("/dashboard").then(({ data }) => setData(data)).catch(() => {});
    api.get("/mood/analytics?days=14").then(({ data }) => setTrend(data.trend || [])).catch(() => {});
    setLoadingInsight(true);
    api.get("/insights").then(({ data }) => setInsight(data.insight)).catch(() => {}).finally(() => setLoadingInsight(false));
  }, []);

  const stats = [
    { label: "Wellness Score", value: data?.wellness_score ?? "—", suffix: "/100", icon: TrendingUp, color: "from-purple-500/30 to-blue-500/30" },
    { label: "Day Streak",     value: data?.streak_days ?? 0,      suffix: "🔥",     icon: Flame,       color: "from-orange-500/30 to-red-500/30" },
    { label: "Level",          value: data?.level_name ?? "Beginner", suffix: "",   icon: Trophy,      color: "from-amber-500/25 to-yellow-500/25" },
    { label: "Avg Mood",       value: data?.avg_mood ?? "—",       suffix: "/9",     icon: Smile,       color: "from-emerald-500/30 to-teal-500/30" },
  ];

  const xpForNext = ((data?.level || 1) <= 5) ? [100, 300, 600, 1000, 1500][(data?.level || 1) - 1] : 1500;
  const xpPrev = ((data?.level || 1) - 2) >= 0 ? [0, 100, 300, 600, 1000][(data?.level || 1) - 2] : 0;
  const xpProg = Math.max(0, Math.min(100, ((data?.xp || 0) - xpPrev) / (xpForNext - xpPrev) * 100));

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Today</p>
        <h1 className="font-display text-3xl md:text-5xl font-semibold">
          Hi {user?.name || "friend"}, <span className="gradient-text">how are you?</span>
        </h1>
        <p className="mt-2 text-slate-400">Here's a snapshot of your wellness this week.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass rounded-3xl p-5 relative overflow-hidden`}
              data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className={`absolute inset-0 opacity-60 bg-gradient-to-br ${s.color}`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{s.label}</p>
                  <Icon className="w-4 h-4 text-white/70" />
                </div>
                <div className="font-display text-3xl md:text-4xl">
                  {s.value}<span className="text-base text-slate-300 ml-1">{s.suffix}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* XP / Level progress */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-1">Progress</p>
            <h3 className="font-display text-xl">{data?.level_name || "Beginner"} · {data?.xp || 0} XP</h3>
          </div>
          <Sparkles className="w-5 h-5 text-purple-300" />
        </div>
        <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full gradient-brand transition-all" style={{ width: `${xpProg}%` }} data-testid="xp-progress-bar" />
        </div>
        <p className="mt-2 text-xs text-slate-400">{xpForNext - (data?.xp || 0)} XP to next level</p>
      </div>

      {/* AI insight + trend */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-300" />
            <p className="text-xs uppercase tracking-[0.2em] text-purple-300">AI Insight</p>
          </div>
          <p className="text-lg leading-relaxed text-slate-100 min-h-[3rem]" data-testid="ai-insight-text">
            {loadingInsight ? <span className="opacity-50">Reading your patterns…</span> : insight}
          </p>
        </div>
        <div className="glass rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-3">14-day mood trend</p>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="avg" stroke="#A78BFA" strokeWidth={2} fill="url(#grad)" />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={[1, 9]} />
                <Tooltip contentStyle={{ background: "#0C0814", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500">Log moods to see your trend.</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/app/chat" data-testid="quick-chat" className="glass rounded-3xl p-5 group hover:bg-white/[0.06] transition">
          <MessageCircle className="w-6 h-6 text-purple-300 mb-3 group-hover:scale-110 transition" />
          <h4 className="font-display text-lg mb-1">Talk to Velora</h4>
          <p className="text-xs text-slate-400">Vent, ask, or just say hi.</p>
        </Link>
        <Link to="/app/mood" data-testid="quick-mood" className="glass rounded-3xl p-5 group hover:bg-white/[0.06] transition">
          <Smile className="w-6 h-6 text-emerald-300 mb-3 group-hover:scale-110 transition" />
          <h4 className="font-display text-lg mb-1">Log mood</h4>
          <p className="text-xs text-slate-400">30 seconds. That's it.</p>
        </Link>
        <Link to="/app/breathing" data-testid="quick-breathing" className="glass rounded-3xl p-5 group hover:bg-white/[0.06] transition">
          <Wind className="w-6 h-6 text-cyan-300 mb-3 group-hover:scale-110 transition" />
          <h4 className="font-display text-lg mb-1">Breathe</h4>
          <p className="text-xs text-slate-400">2-minute reset.</p>
        </Link>
        <Link to="/app/journal" data-testid="quick-journal" className="glass rounded-3xl p-5 group hover:bg-white/[0.06] transition">
          <BookHeart className="w-6 h-6 text-pink-300 mb-3 group-hover:scale-110 transition" />
          <h4 className="font-display text-lg mb-1">Journal</h4>
          <p className="text-xs text-slate-400">Type or speak it out.</p>
        </Link>
      </div>

      {/* Today summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-6">
          <ListChecks className="w-5 h-5 text-purple-300 mb-2" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Habits today</p>
          <p className="font-display text-3xl mt-1">{data?.habits_done_today ?? 0}<span className="text-slate-400 text-base">/{data?.habits_total ?? 0}</span></p>
          <p className="text-xs text-slate-400 mt-1">{data?.habit_completion_today ?? 0}% complete</p>
        </div>
        <div className="glass rounded-3xl p-6">
          <BookHeart className="w-5 h-5 text-pink-300 mb-2" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Journals this week</p>
          <p className="font-display text-3xl mt-1">{data?.journal_count_week ?? 0}</p>
        </div>
        <div className="glass rounded-3xl p-6">
          <Moon className="w-5 h-5 text-blue-300 mb-2" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg sleep</p>
          <p className="font-display text-3xl mt-1">{data?.avg_sleep_hours || "—"}<span className="text-slate-400 text-base">h</span></p>
        </div>
      </div>
    </div>
  );
}
