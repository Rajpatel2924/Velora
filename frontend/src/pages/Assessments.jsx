import { useEffect, useState } from "react";
import api from "../lib/api";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ClipboardCheck } from "lucide-react";

export default function Assessments() {
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(null); // { category, questions, scale }
  const [answers, setAnswers] = useState([]);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);

  const load = async () => {
    const [a, b] = await Promise.all([api.get("/assessments/categories"), api.get("/assessments/history")]);
    setCategories(a.data);
    setHistory(b.data);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const startAssessment = async (cat) => {
    const { data } = await api.get(`/assessments/questions?category=${cat.key}`);
    setCurrent({ ...data, key: cat.key, title: cat.title });
    setAnswers(new Array(data.questions.length).fill(null));
    setStep(0);
    setResult(null);
  };

  const submit = async (finalAnswers) => {
    const { data } = await api.post("/assessments/submit", { category: current.key, answers: finalAnswers });
    setResult(data);
    load();
  };

  const answer = (val) => {
    const next = [...answers]; next[step] = val; setAnswers(next);
    if (step < current.questions.length - 1) setStep(step + 1);
    else submit(next);
  };

  if (result) {
    const levelColor = result.level === "great" ? "text-emerald-300" : result.level === "okay" ? "text-purple-300" : result.level === "concerning" ? "text-amber-300" : "text-rose-300";
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-strong rounded-3xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-purple-300 mx-auto mb-4" />
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Result · {current.title}</p>
          <p className="font-display text-5xl mb-2">{result.score}<span className="text-slate-400 text-2xl">/{result.max_score}</span></p>
          <p className={`uppercase tracking-[0.2em] text-xs ${levelColor}`}>{result.level.replace("_", " ")}</p>
          <p className="mt-5 text-slate-200">{result.feedback}</p>
          <div className="mt-6 text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-3">Suggestions</p>
            <ul className="space-y-2">
              {result.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-slate-200 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06]">• {r}</li>
              ))}
            </ul>
          </div>
          <button onClick={() => { setResult(null); setCurrent(null); }} data-testid="assessment-done"
            className="mt-6 px-6 py-2.5 rounded-full gradient-brand font-medium">Done</button>
        </div>
      </div>
    );
  }

  if (current) {
    const q = current.questions[step];
    const total = current.questions.length;
    const pct = ((step + 1) / total) * 100;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-xs">
          <button onClick={() => setCurrent(null)} className="text-slate-400 flex items-center gap-1" data-testid="assessment-back">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-slate-400">{step + 1} / {total}</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full gradient-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="glass-strong rounded-3xl p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">{current.title}</p>
          <motion.h2 key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            className="font-display text-2xl md:text-3xl mb-6">{q}</motion.h2>
          <div className="space-y-2">
            {current.scale.map((label, i) => (
              <button key={i} onClick={() => answer(i)}
                data-testid={`assessment-answer-${i}`}
                className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-purple-500/15 hover:border-purple-400/40 transition text-left flex items-center justify-between">
                <span className="text-slate-200">{label}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Self Check-ins</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">A quick read on where you are.</h1>
        <p className="mt-2 text-slate-400 text-sm">These aren't diagnoses — just gentle mirrors.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <button key={c.key} onClick={() => startAssessment(c)}
            data-testid={`assessment-start-${c.key}`}
            className="glass rounded-3xl p-6 text-left hover:bg-white/[0.06] transition">
            <ClipboardCheck className="w-5 h-5 text-purple-300 mb-3" />
            <h3 className="font-display text-lg">{c.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{c.questions} questions · ~2 min</p>
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl mb-3">History</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="glass rounded-2xl p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="capitalize font-medium">{h.category.replace("_", " ")}</div>
                  <div className="text-xs text-slate-400">{new Date(h.timestamp).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg">{h.score}/{h.max_score}</div>
                  <div className="text-xs text-purple-300 capitalize">{h.level.replace("_", " ")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
