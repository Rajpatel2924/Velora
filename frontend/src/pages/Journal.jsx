import { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Mic, Square, Sparkles, Search, Loader2, Trash2, Plus } from "lucide-react";

const CATEGORIES = ["reflection", "gratitude", "goals", "stress", "wins"];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "reflection" });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const load = async () => {
    const { data } = await api.get(`/journal${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setEntries(data || []);
  };
  useEffect(() => { load().catch(() => {}); }, [q]);

  const submit = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      await api.post("/journal", form);
      toast.success("Journaled. AI is analyzing… 💜");
      setForm({ title: "", content: "", category: "reflection" });
      setOpen(false);
      setTimeout(load, 600);
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribe(blob);
      };
      mr.start();
      setRecording(true);
    } catch {
      toast.error("Mic permission required");
    }
  };
  const stopRec = () => {
    if (mediaRef.current) { mediaRef.current.stop(); setRecording(false); }
  };
  const transcribe = async (blob) => {
    setTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      const { data } = await api.post("/voice/transcribe", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setForm((f) => ({ ...f, content: (f.content + " " + (data.text || "")).trim() }));
      toast.success("Voice transcribed");
    } catch {
      toast.error("Could not transcribe");
    } finally {
      setTranscribing(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this entry?")) return;
    await api.delete(`/journal/${id}`).catch(() => {});
    load();
  };

  const sentColor = (s) => s === "positive" ? "text-emerald-300" : s === "negative" ? "text-rose-300" : "text-slate-400";

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Journal</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">A safe place to think.</h1>
        </div>
        <button onClick={() => setOpen(true)} data-testid="journal-new-button"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand font-medium hover:shadow-[0_0_24px_rgba(139,92,246,0.4)]">
          <Plus className="w-4 h-4" /> New entry
        </button>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl flex items-center px-4">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          placeholder="Search your entries…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="journal-search"
          className="bg-transparent px-3 py-3 flex-1 outline-none text-sm"
        />
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {entries.length === 0 && (
          <div className="glass rounded-3xl p-10 text-center">
            <Sparkles className="w-8 h-8 text-purple-300 mx-auto mb-3" />
            <p className="text-slate-300">Your journal is empty. Start with a single feeling.</p>
          </div>
        )}
        {entries.map((e) => (
          <motion.div key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-5" data-testid={`journal-entry-${e.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="uppercase tracking-[0.18em] text-purple-300">{e.category}</span>
                  <span>·</span>
                  <span>{new Date(e.timestamp).toLocaleString()}</span>
                  {e.sentiment && (
                    <>
                      <span>·</span>
                      <span className={`uppercase tracking-[0.18em] ${sentColor(e.sentiment)}`}>{e.sentiment}</span>
                    </>
                  )}
                </div>
                {e.title && <h3 className="font-display text-xl mt-1">{e.title}</h3>}
                <p className="mt-2 text-slate-200 whitespace-pre-wrap leading-relaxed">{e.content}</p>
                {e.ai_insight && (
                  <div className="mt-3 p-3 rounded-2xl bg-purple-500/10 border border-purple-400/20 text-sm text-purple-100">
                    <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-purple-300" />
                    {e.ai_insight}
                  </div>
                )}
              </div>
              <button onClick={() => del(e.id)} data-testid={`journal-delete-${e.id}`} className="text-slate-500 hover:text-rose-400 p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md grid place-items-center p-4" onClick={() => setOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95 }}
              className="glass-strong rounded-3xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-3">New journal entry</p>
              <input
                placeholder="Title (optional)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-testid="journal-title-input"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 mb-3 outline-none focus:border-purple-400/40"
              />
              <textarea
                placeholder="What's alive for you right now…"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                data-testid="journal-content-input"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 outline-none focus:border-purple-400/40 resize-none"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, category: c })}
                      data-testid={`journal-cat-${c}`}
                      className={`px-3 py-1.5 rounded-full text-xs capitalize border transition ${form.category === c ? "bg-purple-500/30 border-purple-400/60 text-white" : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06]"}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {recording ? (
                    <button onClick={stopRec} data-testid="journal-mic-stop" className="h-10 w-10 rounded-full bg-red-500 text-white grid place-items-center animate-pulse">
                      <Square className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={startRec} disabled={transcribing} data-testid="journal-mic-start" className="h-10 w-10 rounded-full bg-white/[0.06] border border-white/[0.08] text-slate-300 grid place-items-center hover:bg-white/[0.1]">
                      {transcribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                  <button onClick={submit} disabled={saving || !form.content.trim()}
                    data-testid="journal-save-button"
                    className="px-5 py-2.5 rounded-full gradient-brand font-medium disabled:opacity-50">
                    {saving ? "Saving…" : "Save entry"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
