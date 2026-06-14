import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import { toast } from "sonner";
import { Play, Pause, RotateCcw } from "lucide-react";

const PATTERNS = {
  box:    { name: "Box Breathing",    phases: [{ name: "Inhale", s: 4 }, { name: "Hold", s: 4 }, { name: "Exhale", s: 4 }, { name: "Hold", s: 4 }], desc: "Equal 4-4-4-4. Resets focus." },
  "4-7-8":{ name: "4-7-8",            phases: [{ name: "Inhale", s: 4 }, { name: "Hold", s: 7 }, { name: "Exhale", s: 8 }],                          desc: "Calms the nervous system." },
  deep:   { name: "Deep Breathing",   phases: [{ name: "Inhale", s: 5 }, { name: "Exhale", s: 5 }],                                                   desc: "Slow, full breaths." },
  calm:   { name: "Calm",             phases: [{ name: "Inhale", s: 4 }, { name: "Exhale", s: 6 }],                                                   desc: "Longer exhale activates rest." },
  focus:  { name: "Focus",            phases: [{ name: "Inhale", s: 6 }, { name: "Hold", s: 2 }, { name: "Exhale", s: 6 }],                          desc: "Sharpen attention." },
};

export default function Breathing() {
  const [pattern, setPattern] = useState("box");
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PATTERNS["box"].phases[0].s);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef(null);

  const conf = PATTERNS[pattern];
  const phase = conf.phases[phaseIdx];

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        // advance phase
        setPhaseIdx((i) => {
          const next = (i + 1) % conf.phases.length;
          setSecondsLeft(conf.phases[next].s);
          return next;
        });
        return 0;
      });
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, conf]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setPhaseIdx(0);
    setSecondsLeft(conf.phases[0].s);
    setElapsed(0);
  };
  const finish = async () => {
    if (elapsed > 5) {
      try {
        await api.post("/sessions", { kind: "breathing", type: pattern, duration_seconds: elapsed });
        toast.success(`Logged ${elapsed}s · XP earned`);
      } catch {}
    }
    reset();
  };

  // scale animation depends on phase name
  const isInhale = phase.name === "Inhale";
  const isExhale = phase.name === "Exhale";
  const scale = isInhale ? 1 : isExhale ? 0.65 : phase.name === "Hold" ? 1 : 0.65;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">Breathe</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Reset in 2 minutes.</h1>
      </div>

      {/* Pattern selector */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PATTERNS).map(([k, v]) => (
          <button key={k} onClick={() => { setPattern(k); setRunning(false); setPhaseIdx(0); setSecondsLeft(v.phases[0].s); setElapsed(0); }}
            data-testid={`breath-pattern-${k}`}
            className={`px-4 py-2 rounded-full text-sm border transition ${pattern === k ? "bg-purple-500/30 border-purple-400/60 text-white" : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"}`}>
            {v.name}
          </button>
        ))}
      </div>

      <p className="text-slate-400 text-sm">{conf.desc}</p>

      {/* Circle */}
      <div className="glass-strong rounded-[2.5rem] p-10 grid place-items-center min-h-[420px] relative overflow-hidden">
        <div className="aurora-blob bg-purple-600 w-[400px] h-[400px] absolute" />
        <div className="relative w-72 h-72 grid place-items-center">
          <motion.div
            animate={{ scale: running ? scale : 1 }}
            transition={{ duration: phase.s, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full gradient-brand opacity-20 blur-2xl"
          />
          <motion.div
            animate={{ scale: running ? scale : 1 }}
            transition={{ duration: phase.s, ease: "easeInOut" }}
            className="w-full h-full rounded-full border border-purple-400/30 grid place-items-center bg-white/[0.02] backdrop-blur-xl"
            data-testid="breathing-circle"
          >
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-purple-300 mb-1">{phase.name}</p>
              <p className="font-display text-6xl">{secondsLeft}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        {!running ? (
          <button onClick={start} data-testid="breath-start" className="flex items-center gap-2 px-7 py-3.5 rounded-full gradient-brand font-medium">
            <Play className="w-4 h-4" /> Start
          </button>
        ) : (
          <button onClick={pause} data-testid="breath-pause" className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}
        <button onClick={finish} data-testid="breath-finish" className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
          <RotateCcw className="w-4 h-4" /> Finish
        </button>
      </div>
      <p className="text-center text-xs text-slate-400" data-testid="breath-elapsed">Elapsed: {elapsed}s</p>
    </div>
  );
}
