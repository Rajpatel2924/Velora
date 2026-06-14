import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import { toast } from "sonner";
import { Play, Pause, Square, Sparkles, Moon, Brain, Zap, Heart } from "lucide-react";

const SESSIONS = [
  { key: "calm",       title: "5 min Calm",       minutes: 5,  icon: Sparkles, color: "from-purple-500/30 to-blue-500/30", desc: "Soft reset for an overwhelmed day." },
  { key: "focus",      title: "10 min Focus",     minutes: 10, icon: Brain,    color: "from-blue-500/30 to-cyan-500/30",   desc: "Sharpen attention before deep work." },
  { key: "sleep",      title: "Sleep Wind-Down",  minutes: 15, icon: Moon,     color: "from-indigo-500/30 to-purple-500/30", desc: "Soften your body into rest." },
  { key: "anxiety",    title: "Anxiety Relief",   minutes: 7,  icon: Heart,    color: "from-pink-500/30 to-rose-500/30",   desc: "Ground yourself when waves hit." },
  { key: "productivity", title: "Productivity Boost", minutes: 8, icon: Zap,    color: "from-amber-500/25 to-orange-500/25", desc: "Center before tackling the list." },
];

const SCRIPT = {
  calm: "Close your eyes. Notice three sounds around you. Breathe in slowly through your nose… and out through your mouth. Let your shoulders drop. There's nothing to fix right now — just this breath.",
  focus: "Sit tall. Anchor your gaze softly forward. Breathe in for four counts. Out for four. Let thoughts pass like clouds — you stay grounded. Picture the one thing that matters most in the next hour.",
  sleep: "Let your body become heavy. Imagine you are sinking into the bed. Inhale for four. Exhale slowly for eight. Feel each muscle soften. Your only job right now is to rest.",
  anxiety: "Place a hand on your chest. Feel your heart. You are safe in this moment. Breathe in for four, hold for four, exhale for six. With each exhale, release one ounce of worry.",
  productivity: "Take a deep breath. Picture the task ahead — just the first small step. Inhale energy, exhale doubt. You don't need motivation, only momentum. Begin gently.",
};

export default function Meditation() {
  const [active, setActive] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playingVoice, setPlayingVoice] = useState(false);
  const tickRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setElapsed((e) => {
        const total = active.minutes * 60;
        if (e + 1 >= total) {
          clearInterval(tickRef.current);
          setRunning(false);
          finish(total);
          return total;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, active]);

  const start = (s) => {
    setActive(s);
    setElapsed(0);
    setRunning(true);
  };

  const togglePause = () => setRunning((r) => !r);

  const finish = async (forcedSeconds) => {
    const dur = forcedSeconds || elapsed;
    setRunning(false);
    if (dur > 5 && active) {
      try {
        await api.post("/sessions", { kind: "meditation", type: active.key, duration_seconds: dur });
        toast.success(`Logged ${Math.round(dur / 60)}m · XP earned`);
      } catch {}
    }
    setActive(null);
    setElapsed(0);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingVoice(false);
  };

  const playVoice = async () => {
    if (!active) return;
    if (playingVoice) {
      audioRef.current?.pause();
      setPlayingVoice(false);
      return;
    }
    try {
      const token = localStorage.getItem("velora_token");
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/voice/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: SCRIPT[active.key], voice: "shimmer" }),
      });
      if (!res.ok) throw new Error("tts failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingVoice(false);
      audio.play();
      setPlayingVoice(true);
    } catch {
      toast.error("Couldn't load voice");
    }
  };

  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (active) {
    const total = active.minutes * 60;
    const pct = (elapsed / total) * 100;
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Now meditating</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">{active.title}</h1>
        </div>
        <div className="glass-strong rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className="aurora-blob bg-purple-600 w-[400px] h-[400px] absolute -top-20 -left-20" />
          <div className="relative">
            <motion.div animate={{ scale: running ? [1, 1.05, 1] : 1 }} transition={{ duration: 4, repeat: Infinity }}
              className="mx-auto h-48 w-48 rounded-full gradient-brand grid place-items-center pulse-glow">
              <p className="font-display text-4xl">{mmss(total - elapsed)}</p>
            </motion.div>
            <div className="mt-8 h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full gradient-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-6 text-slate-300 italic max-w-md mx-auto">"{SCRIPT[active.key]}"</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button onClick={togglePause} data-testid="med-toggle" className="flex items-center gap-2 px-7 py-3.5 rounded-full gradient-brand font-medium">
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{running ? "Pause" : "Resume"}
          </button>
          <button onClick={playVoice} data-testid="med-voice" className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
            {playingVoice ? "Stop voice" : "AI voice guide"}
          </button>
          <button onClick={() => finish()} data-testid="med-finish" className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <Square className="w-4 h-4" /> End
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Meditation Center</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Find the session for now.</h1>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SESSIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.key} onClick={() => start(s)}
              data-testid={`med-session-${s.key}`}
              className="glass rounded-3xl p-6 text-left hover:bg-white/[0.06] transition relative overflow-hidden group">
              <div className={`absolute inset-0 opacity-50 bg-gradient-to-br ${s.color}`} />
              <div className="relative">
                <div className="h-11 w-11 rounded-2xl bg-white/[0.08] border border-white/[0.1] grid place-items-center mb-4 group-hover:scale-110 transition">
                  <Icon className="w-4 h-4 text-white/90" />
                </div>
                <h3 className="font-display text-lg">{s.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{s.minutes} min</p>
                <p className="mt-3 text-sm text-slate-300/90">{s.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
