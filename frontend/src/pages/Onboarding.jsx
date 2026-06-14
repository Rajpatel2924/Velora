import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = ["name", "age", "role", "goals", "stress", "sleep", "activities", "daily_goal"];

const GOALS = ["Reduce anxiety", "Improve sleep", "Build confidence", "Find motivation", "Better focus", "Manage stress", "Feel happier", "Process emotions"];
const AGES = ["13-17", "18-22", "23-27", "28-35", "36+"];
const ROLES = ["Student", "Professional", "Both", "Other"];
const ACTIVITIES = ["Meditation", "Journaling", "Breathing", "Reading", "Movement", "Music", "Nature walks", "Art"];

export default function Onboarding() {
  const { user, setUserData } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: user?.name && user.name !== "Guest" ? user.name : "",
    age_group: "",
    role: "",
    goals: [],
    stress_level: 5,
    sleep_quality: 5,
    activities: [],
    daily_goal_minutes: 15,
  });
  const [busy, setBusy] = useState(false);

  const toggleArr = (key, val) => {
    setData((d) => ({ ...d, [key]: d[key].includes(val) ? d[key].filter((x) => x !== val) : [...d[key], val] }));
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setBusy(true);
    try {
      const { data: u } = await api.post("/auth/onboarding", {
        name: data.name || undefined,
        data: {
          age_group: data.age_group,
          role: data.role,
          goals: data.goals,
          stress_level: data.stress_level,
          sleep_quality: data.sleep_quality,
          activities: data.activities,
          daily_goal_minutes: data.daily_goal_minutes,
        },
      });
      setUserData(u);
      toast.success("All set! Welcome to Velora 💜");
      nav("/app", { replace: true });
    } catch (e) {
      toast.error("Could not save — try again");
    } finally {
      setBusy(false);
    }
  };

  const stepKey = STEPS[step];
  const canNext = () => {
    if (stepKey === "name") return data.name.trim().length > 0;
    if (stepKey === "age") return !!data.age_group;
    if (stepKey === "role") return !!data.role;
    if (stepKey === "goals") return data.goals.length > 0;
    if (stepKey === "activities") return data.activities.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen relative px-4 py-10 grid place-items-center">
      <div className="aurora-blob bg-purple-600 w-[500px] h-[500px] top-[-100px] right-[-100px]" />
      <div className="aurora-blob bg-blue-600 w-[400px] h-[400px] bottom-[-100px] left-[-100px]" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-8" data-testid="onboarding-progress">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "gradient-brand" : "bg-white/[0.08]"}`} />
          ))}
        </div>

        <div className="glass-strong rounded-3xl p-8 md:p-10 min-h-[420px] flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-3" data-testid="onboarding-step-count">
            Step {step + 1} of {STEPS.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={stepKey}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1"
            >
              {stepKey === "name" && (
                <>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">What should we call you?</h2>
                  <p className="text-slate-400 mb-6">Your name stays private to you.</p>
                  <input
                    autoFocus type="text" placeholder="Your name"
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    data-testid="onboarding-name-input"
                    className="w-full px-4 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-lg focus:outline-none focus:border-purple-400/60"
                  />
                </>
              )}
              {stepKey === "age" && (
                <>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">How old are you?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {AGES.map((a) => (
                      <button key={a} onClick={() => setData({ ...data, age_group: a })}
                        data-testid={`onb-age-${a}`}
                        className={`py-4 rounded-2xl border transition ${data.age_group === a ? "bg-purple-500/20 border-purple-400/60 text-white" : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {stepKey === "role" && (
                <>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">What's your day like?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((r) => (
                      <button key={r} onClick={() => setData({ ...data, role: r })}
                        data-testid={`onb-role-${r}`}
                        className={`py-4 rounded-2xl border transition ${data.role === r ? "bg-purple-500/20 border-purple-400/60" : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {stepKey === "goals" && (
                <>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-2">What brings you here?</h2>
                  <p className="text-slate-400 mb-6">Choose any that resonate.</p>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map((g) => {
                      const active = data.goals.includes(g);
                      return (
                        <button key={g} onClick={() => toggleArr("goals", g)}
                          data-testid={`onb-goal-${g.split(" ")[0].toLowerCase()}`}
                          className={`px-4 py-2 rounded-full text-sm border transition ${active ? "bg-purple-500/30 border-purple-400/60 text-white" : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"}`}>
                          {active && <Check className="w-3 h-3 inline mr-1" />}{g}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {stepKey === "stress" && (
                <>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-2">Right now, how stressed are you?</h2>
                  <p className="text-slate-400 mb-6">No wrong answer.</p>
                  <div className="text-center mb-6">
                    <span className="font-display text-6xl gradient-text">{data.stress_level}</span>
                    <span className="text-slate-400 ml-2">/ 10</span>
                  </div>
                  <input type="range" min="1" max="10" value={data.stress_level}
                    onChange={(e) => setData({ ...data, stress_level: +e.target.value })}
                    data-testid="onb-stress-slider"
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Chill</span><span>Overwhelmed</span>
                  </div>
                </>
              )}
              {stepKey === "sleep" && (
                <>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-2">How's your sleep been?</h2>
                  <p className="text-slate-400 mb-6">In the last week.</p>
                  <div className="text-center mb-6">
                    <span className="font-display text-6xl gradient-text">{data.sleep_quality}</span>
                    <span className="text-slate-400 ml-2">/ 10</span>
                  </div>
                  <input type="range" min="1" max="10" value={data.sleep_quality}
                    onChange={(e) => setData({ ...data, sleep_quality: +e.target.value })}
                    data-testid="onb-sleep-slider"
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Restless</span><span>Restorative</span>
                  </div>
                </>
              )}
              {stepKey === "activities" && (
                <>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-2">What helps you reset?</h2>
                  <p className="text-slate-400 mb-6">Pick a few.</p>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITIES.map((a) => {
                      const active = data.activities.includes(a);
                      return (
                        <button key={a} onClick={() => toggleArr("activities", a)}
                          data-testid={`onb-activity-${a.split(" ")[0].toLowerCase()}`}
                          className={`px-4 py-2 rounded-full text-sm border transition ${active ? "bg-purple-500/30 border-purple-400/60 text-white" : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"}`}>
                          {active && <Check className="w-3 h-3 inline mr-1" />}{a}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              {stepKey === "daily_goal" && (
                <>
                  <h2 className="font-display text-3xl md:text-4xl font-semibold mb-2">Daily wellness goal?</h2>
                  <p className="text-slate-400 mb-6">Tiny steps compound.</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[5, 10, 15, 30].map((m) => (
                      <button key={m} onClick={() => setData({ ...data, daily_goal_minutes: m })}
                        data-testid={`onb-goal-${m}m`}
                        className={`py-4 rounded-2xl border transition ${data.daily_goal_minutes === m ? "bg-purple-500/20 border-purple-400/60" : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"}`}>
                        <div className="font-display text-2xl">{m}</div>
                        <div className="text-xs text-slate-400">min</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
            <button onClick={back} disabled={step === 0}
              data-testid="onb-back-button"
              className="flex items-center gap-1 px-4 py-2.5 rounded-full text-sm text-slate-300 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {step === STEPS.length - 1 ? (
              <button onClick={submit} disabled={busy || !canNext()}
                data-testid="onb-finish-button"
                className="flex items-center gap-1 px-6 py-2.5 rounded-full gradient-brand font-medium disabled:opacity-50">
                {busy ? "Saving…" : "Enter Velora"} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={next} disabled={!canNext()}
                data-testid="onb-next-button"
                className="flex items-center gap-1 px-6 py-2.5 rounded-full gradient-brand font-medium disabled:opacity-50">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
