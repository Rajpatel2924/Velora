import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { toast } from "sonner";
import { Trophy, Flame, Sparkles, Award, LogOut, Moon, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BADGE_META = {
  onboarded:        { name: "Welcomed", desc: "Completed onboarding" },
  first_journal:    { name: "Pen Pal", desc: "First journal entry" },
  first_meditation: { name: "Quiet Mind", desc: "First meditation" },
  first_breath:     { name: "Deep Diver", desc: "First breathing session" },
};

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const nav = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [sleep, setSleep] = useState({ hours: 7, quality: 4, note: "" });
  const [sleepHistory, setSleepHistory] = useState([]);
  const [savingSleep, setSavingSleep] = useState(false);

  useEffect(() => {
    api.get("/dashboard").then(({ data }) => setDashboard(data)).catch(() => {});
    api.get("/sleep").then(({ data }) => setSleepHistory(data)).catch(() => {});
  }, []);

  const logSleep = async () => {
    setSavingSleep(true);
    try {
      await api.post("/sleep", sleep);
      toast.success("Sleep logged");
      const { data } = await api.get("/sleep");
      setSleepHistory(data);
      refresh();
    } catch {
      toast.error("Could not save");
    } finally {
      setSavingSleep(false);
    }
  };

  const handleLogout = () => {
    logout();
    nav("/", { replace: true });
  };

  const allBadges = Object.keys(BADGE_META);
  const earned = new Set(user?.badges || []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Profile</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">{user?.name || "Friend"}</h1>
          <p className="mt-1 text-slate-400 text-sm">{user?.email || "Guest account"}</p>
        </div>
        <button onClick={handleLogout} data-testid="profile-logout-button"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08]">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-5">
          <Trophy className="w-5 h-5 text-amber-300 mb-2" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Level</p>
          <p className="font-display text-2xl mt-1">{dashboard?.level_name || "Beginner"}</p>
          <p className="text-xs text-slate-400">{dashboard?.xp || 0} XP</p>
        </div>
        <div className="glass rounded-3xl p-5">
          <Flame className="w-5 h-5 text-orange-300 mb-2" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Streak</p>
          <p className="font-display text-2xl mt-1">{dashboard?.streak_days || 0} days</p>
        </div>
        <div className="glass rounded-3xl p-5">
          <Sparkles className="w-5 h-5 text-purple-300 mb-2" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wellness Coins</p>
          <p className="font-display text-2xl mt-1">{user?.wellness_coins || 0}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-purple-300" />
          <h2 className="font-display text-xl">Badges</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allBadges.map((b) => {
            const got = earned.has(b);
            const meta = BADGE_META[b];
            return (
              <div key={b} className={`p-4 rounded-2xl text-center border ${got ? "bg-purple-500/15 border-purple-400/40" : "bg-white/[0.03] border-white/[0.06] opacity-50"}`} data-testid={`badge-${b}`}>
                <div className={`h-12 w-12 mx-auto rounded-2xl grid place-items-center mb-2 ${got ? "gradient-brand" : "bg-white/[0.06]"}`}>
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-xs font-medium">{meta.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">{meta.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sleep tracker */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-5 h-5 text-blue-300" />
          <h2 className="font-display text-xl">Sleep tracker</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Hours slept</label>
            <input type="number" step="0.5" min="0" max="14" value={sleep.hours}
              onChange={(e) => setSleep({ ...sleep, hours: +e.target.value })}
              data-testid="sleep-hours" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 outline-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Quality (1-5)</label>
            <input type="number" min="1" max="5" value={sleep.quality}
              onChange={(e) => setSleep({ ...sleep, quality: +e.target.value })}
              data-testid="sleep-quality" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 outline-none" />
          </div>
          <div className="flex items-end">
            <button onClick={logSleep} disabled={savingSleep} data-testid="sleep-submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl gradient-brand font-medium disabled:opacity-50">
              <Plus className="w-4 h-4" /> Log sleep
            </button>
          </div>
        </div>
        {sleepHistory.length > 0 && (
          <div className="mt-5 space-y-2">
            {sleepHistory.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] text-sm">
                <span className="text-slate-300">{new Date(s.timestamp).toLocaleDateString()}</span>
                <span className="font-medium">{s.hours}h · {"★".repeat(s.quality)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goals overview */}
      {user?.onboarding && (
        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-xl mb-3">Your goals</h2>
          <div className="flex flex-wrap gap-2">
            {(user.onboarding.goals || []).map((g) => (
              <span key={g} className="px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-sm">{g}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
