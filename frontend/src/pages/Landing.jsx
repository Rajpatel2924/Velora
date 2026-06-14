import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle, BarChart3, Wind, BookHeart, Trophy, Star, Quote, ChevronDown } from "lucide-react";
import { useState } from "react";

const features = [
  { icon: MessageCircle, title: "AI Companion", desc: "An empathetic Gen Z-aware companion that's always here." },
  { icon: BarChart3,     title: "Mood Analytics", desc: "Track moods, spot patterns, and grow your stability score." },
  { icon: BookHeart,     title: "AI Journal",     desc: "Text or voice — get sentiment insights instantly." },
  { icon: Wind,          title: "Breathe & Meditate", desc: "Animated breathing, guided sessions, instant calm." },
  { icon: Trophy,        title: "Gamified Streaks", desc: "Earn XP, unlock badges, level up your wellness self." },
  { icon: Sparkles,      title: "Personal Insights", desc: "Weekly AI reports tuned to your patterns." },
];

const testimonials = [
  { name: "Maya, 19", text: "Velora feels like a friend who actually gets me. Streaks make me come back daily." },
  { name: "Arjun, 24", text: "The breathing animation hits different at 2am. Love the dark mode." },
  { name: "Sara, 21", text: "Journaling with voice + sentiment is genuinely useful for self-awareness." },
];

const faqs = [
  { q: "Is Velora a replacement for therapy?", a: "No. Velora is a wellness companion — not a substitute for professional help. For crisis support, tap the SOS button." },
  { q: "Is my data private?", a: "Your journal, mood, and chats are stored against your account only. Guest mode is also available." },
  { q: "How does the AI work?", a: "We use Claude Sonnet 4.5 with a wellness-tuned system prompt. The AI does not diagnose or prescribe." },
  { q: "Is it free?", a: "Yes — the MVP is free. We may add a Pro tier with deeper analytics later." },
];

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Aurora blobs */}
      <div className="aurora-blob bg-purple-600 w-[600px] h-[600px] top-[-200px] left-[-100px]" />
      <div className="aurora-blob bg-blue-600 w-[500px] h-[500px] top-[200px] right-[-150px]" />
      <div className="aurora-blob bg-cyan-400/30 w-[400px] h-[400px] bottom-[100px] left-[40%]" />

      {/* Nav */}
      <header className="relative z-10 max-w-7xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-brand grid place-items-center font-display font-bold">V</div>
          <span className="font-display text-2xl font-semibold">Velora</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#demo" className="hover:text-white">Demo</a>
          <a href="#testimonials" className="hover:text-white">Reviews</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <Link to="/auth" data-testid="landing-cta-nav" className="px-5 py-2 rounded-full gradient-brand text-sm font-medium hover:shadow-[0_0_24px_rgba(139,92,246,0.4)] transition">
          Get started
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs uppercase tracking-[0.2em] text-purple-300 mb-6"
          >
            <Sparkles className="w-3 h-3" /> AI Wellness for Gen Z
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight"
          >
            Your mind, <br />
            <span className="gradient-text">held with care.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 text-lg text-slate-300 max-w-xl"
          >
            Velora is your private AI wellness companion — chat, journal, track your mood, breathe, and grow. Built for the way Gen Z actually feels.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/auth" data-testid="landing-cta-primary" className="px-7 py-3.5 rounded-full gradient-brand font-medium hover:shadow-[0_0_28px_rgba(139,92,246,0.5)] transition">
              Start your journey
            </Link>
            <Link to="/auth?guest=1" data-testid="landing-cta-guest" className="px-7 py-3.5 rounded-full glass text-white text-sm hover:bg-white/[0.08] transition">
              Try as guest →
            </Link>
          </motion.div>
          <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> 4.9 / 5 from early users</div>
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-400" /> Powered by Claude Sonnet 4.5</div>
          </div>
        </div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
          className="lg:col-span-5 relative"
        >
          <div className="relative glass-strong rounded-3xl p-6 float-slow">
            <div className="absolute -top-3 -left-3 px-3 py-1 rounded-full gradient-brand text-xs font-medium">Live demo</div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full gradient-brand grid place-items-center text-xs font-bold">V</div>
                <div className="glass rounded-2xl rounded-tl-sm p-3 text-sm text-slate-200 max-w-[85%]">
                  Hey 💜 How are you really feeling today?
                </div>
              </div>
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-purple-600/80 backdrop-blur-sm rounded-2xl rounded-tr-sm p-3 text-sm text-white max-w-[85%]">
                  Honestly, anxious about finals.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full gradient-brand grid place-items-center text-xs font-bold">V</div>
                <div className="glass rounded-2xl rounded-tl-sm p-3 text-sm text-slate-200 max-w-[85%]">
                  That makes total sense — exams pile up fast. Want to try a 2-min breathing reset or break finals into smaller study chunks together?
                </div>
              </div>
            </div>
          </div>
          {/* Floating mini-cards */}
          <div className="absolute -bottom-6 -right-6 glass rounded-2xl p-4 w-44 hidden md:block">
            <p className="text-[10px] uppercase tracking-[0.18em] text-purple-300 mb-2">Today's mood</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl">😌</span>
              <div>
                <div className="text-sm font-medium">Relaxed</div>
                <div className="text-[10px] text-slate-400">+ stability 12%</div>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -left-8 glass rounded-2xl p-3 hidden md:block">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300 mb-1">Streak</p>
            <div className="flex items-center gap-2"><span className="text-2xl">🔥</span><span className="font-display text-xl">12</span></div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-3">Built for how you feel</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold">A full wellness toolkit, in one calm space.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="glass rounded-3xl p-6 hover:bg-white/[0.05] transition group">
                <div className="h-11 w-11 rounded-2xl gradient-aurora grid place-items-center border border-white/[0.08] mb-5 group-hover:scale-110 transition">
                  <Icon className="w-5 h-5 text-purple-200" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Demo strip */}
      <section id="demo" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="glass-strong rounded-3xl p-8 md:p-12 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-3">Mood tracker</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">Tap how you feel. Watch the patterns appear.</h2>
            <p className="text-slate-300 mb-6">9 nuanced mood states, daily heatmap, weekly stability score, and AI-driven trend analysis.</p>
            <div className="flex flex-wrap gap-2">
              {["😄","😊","😌","😐","😔","😢","😡","😰","😞"].map((e, i) => (
                <button key={i} className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-2xl hover:scale-110 transition">{e}</button>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 49 }).map((_, i) => {
                const intensities = ["bg-white/[0.04]", "bg-purple-500/30", "bg-purple-500/55", "bg-purple-500/80", "bg-cyan-400/70"];
                const c = intensities[Math.floor(Math.random() * intensities.length)];
                return <div key={i} className={`aspect-square rounded-md ${c} border border-white/[0.05]`} />;
              })}
            </div>
            <p className="mt-4 text-xs text-slate-400 text-center">Last 7 weeks · Mood heatmap</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-4xl font-semibold mb-12 text-center">Loved by early users</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="glass rounded-3xl p-6">
              <Quote className="w-6 h-6 text-purple-400 mb-3" />
              <p className="text-slate-200 italic leading-relaxed">"{t.text}"</p>
              <p className="mt-4 text-sm text-slate-500">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-4xl font-semibold mb-3 text-center">Pricing that respects you</h2>
        <p className="text-center text-slate-400 mb-12">Start free. Upgrade only when you're ready.</p>
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          <div className="glass rounded-3xl p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Free</p>
            <p className="font-display text-4xl mb-4">$0</p>
            <ul className="text-sm text-slate-300 space-y-2 mb-6">
              <li>· Unlimited mood tracking</li>
              <li>· AI chat & journal</li>
              <li>· Breathing & meditation</li>
              <li>· Habit tracker</li>
            </ul>
            <Link to="/auth" data-testid="landing-pricing-free" className="block text-center py-3 rounded-full glass">Get started</Link>
          </div>
          <div className="glass-strong rounded-3xl p-8 border border-purple-400/40 relative">
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full gradient-brand text-xs font-medium">Coming soon</div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Velora Pro</p>
            <p className="font-display text-4xl mb-4">$5<span className="text-sm text-slate-400">/mo</span></p>
            <ul className="text-sm text-slate-300 space-y-2 mb-6">
              <li>· Deeper AI analytics</li>
              <li>· Voice journal + voice chat</li>
              <li>· Premium meditation library</li>
              <li>· Custom challenges</li>
            </ul>
            <button disabled className="block w-full text-center py-3 rounded-full gradient-brand opacity-60 cursor-not-allowed">Join waitlist</button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 max-w-3xl mx-auto px-6 py-20">
        <h2 className="font-display text-4xl font-semibold mb-10 text-center">Questions, answered</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} idx={i} />)}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-t border-white/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-brand grid place-items-center font-display font-bold text-sm">V</div>
            <span className="font-display text-lg">Velora</span>
          </div>
          <p className="text-xs text-slate-500">© 2026 Velora · Built with care for Gen Z minds.</p>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ q, a, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} data-testid={`faq-${idx}`} className="w-full flex items-center justify-between p-5 text-left">
        <span className="font-medium">{q}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-sm text-slate-300">{a}</div>}
    </div>
  );
}
