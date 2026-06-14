import { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Flame, Trash2, Check, Droplet, Dumbbell, Brain, BookOpen, PenLine, Moon, Heart, Footprints, Sparkles } from "lucide-react";

const ICONS = { droplet: Droplet, dumbbell: Dumbbell, brain: Brain, "book-open": BookOpen, "pen-line": PenLine, moon: Moon, heart: Heart, footprints: Footprints, sparkles: Sparkles };

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    const { data } = await api.get("/habits");
    setHabits(data || []);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const toggle = async (h) => {
    const done = h.completions?.includes(today);
    try {
      await api.post(`/habits/${h.id}/toggle`);
      if (!done) toast.success("+5 XP · keep the streak");
      load();
    } catch {
      toast.error("Could not update");
    }
  };

  const create = async () => {
    if (!title.trim()) return;
    await api.post("/habits", { title }).catch(() => {});
    setTitle(""); setOpen(false); load();
  };

  const del = async (id) => {
    if (!confirm("Delete habit?")) return;
    await api.delete(`/habits/${id}`).catch(() => {});
    load();
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Habits</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Tiny daily wins.</h1>
        </div>
        <button onClick={() => setOpen(true)} data-testid="habit-add-button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand font-medium">
          <Plus className="w-4 h-4" /> Add habit
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((h) => {
          const done = h.completions?.includes(today);
          const Icon = ICONS[h.icon] || Sparkles;
          return (
            <motion.div key={h.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-3xl p-5 transition relative ${done ? "border-purple-400/40 shadow-[0_0_24px_rgba(139,92,246,0.15)]" : ""}`}
              data-testid={`habit-${h.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-2xl gradient-aurora grid place-items-center border border-white/[0.08]">
                  <Icon className="w-4 h-4 text-purple-200" />
                </div>
                <button onClick={() => del(h.id)} data-testid={`habit-delete-${h.id}`} className="text-slate-500 hover:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-display text-lg mt-3">{h.title}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>{h.streak} day streak · best {h.longest_streak}</span>
              </div>
              <button onClick={() => toggle(h)} data-testid={`habit-toggle-${h.id}`}
                className={`mt-4 w-full py-3 rounded-2xl font-medium transition ${
                  done
                    ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-200"
                    : "gradient-brand text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                }`}>
                {done ? (<><Check className="w-4 h-4 inline mr-1" /> Done today</>) : "Mark complete"}
              </button>
            </motion.div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-3">New habit</p>
            <input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Drink 2L water"
              data-testid="habit-title-input"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 outline-none focus:border-purple-400/40"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-full bg-white/[0.04] text-slate-300">Cancel</button>
              <button onClick={create} data-testid="habit-create-submit" className="px-5 py-2.5 rounded-full gradient-brand font-medium">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
