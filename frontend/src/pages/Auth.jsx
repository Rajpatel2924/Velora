import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User as UserIcon } from "lucide-react";

export default function Auth() {
  const { login, register, guest, user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "register" ? "register" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav(user.onboarding_complete ? "/app" : "/onboarding", { replace: true });
  }, [user, nav]);

  useEffect(() => {
    if (params.get("guest") === "1") handleGuest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      let u;
      if (mode === "login") u = await login(form.email, form.password);
      else u = await register(form.name, form.email, form.password);
      toast.success(mode === "login" ? "Welcome back" : "Welcome to Velora");
      nav(u.onboarding_complete ? "/app" : "/onboarding", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = async () => {
    setBusy(true);
    try {
      const u = await guest("Guest");
      toast.success("You're in (guest mode)");
      nav(u.onboarding_complete ? "/app" : "/onboarding", { replace: true });
    } catch {
      toast.error("Could not start guest session");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative grid place-items-center px-4">
      <div className="aurora-blob bg-purple-600 w-[500px] h-[500px] top-[-150px] left-[-100px]" />
      <div className="aurora-blob bg-blue-600 w-[400px] h-[400px] bottom-[-100px] right-[-100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl gradient-brand grid place-items-center font-display font-bold">V</div>
          <span className="font-display text-2xl font-semibold">Velora</span>
        </Link>

        <div className="glass-strong rounded-3xl p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs uppercase tracking-[0.2em] text-purple-300 mb-5">
            <Sparkles className="w-3 h-3" /> {mode === "login" ? "Welcome back" : "Create account"}
          </div>
          <h1 className="font-display text-3xl font-semibold mb-2">
            {mode === "login" ? "Sign in to Velora" : "Start your wellness journey"}
          </h1>
          <p className="text-sm text-slate-400 mb-6">
            {mode === "login" ? "Pick up where you left off." : "It only takes a minute."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" required
                  placeholder="Your first name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="auth-name-input"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50 transition"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email" required
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                data-testid="auth-email-input"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50 transition"
              />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password" required minLength={6}
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                data-testid="auth-password-input"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50 transition"
              />
            </div>
            <button
              type="submit" disabled={busy}
              data-testid="auth-submit-button"
              className="w-full py-3.5 rounded-2xl gradient-brand font-medium hover:shadow-[0_0_28px_rgba(139,92,246,0.5)] disabled:opacity-60 transition"
            >
              {busy ? "Loading…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-slate-500 uppercase tracking-[0.2em]">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <button
            onClick={handleGuest} disabled={busy}
            data-testid="auth-guest-button"
            className="w-full py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition"
          >
            Continue as guest
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            {mode === "login" ? "New here? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              data-testid="auth-toggle-mode"
              className="text-purple-300 hover:text-white underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
