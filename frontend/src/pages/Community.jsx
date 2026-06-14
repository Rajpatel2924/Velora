import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Heart, HandHeart, Sprout, Flag, Trash2, ArrowLeft, Shield, Send } from "lucide-react";

const REACTION_META = {
  heart:  { Icon: Heart,     label: "Heart",  color: "text-rose-300" },
  hug:    { Icon: HandHeart, label: "Hug",    color: "text-purple-300" },
  growth: { Icon: Sprout,    label: "Growth", color: "text-emerald-300" },
};

export default function Community() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const loadRooms = async () => {
    const { data } = await api.get("/community/rooms");
    setRooms(data || []);
  };
  const loadPosts = async () => {
    const { data } = await api.get(`/community/posts${slug ? `?room_slug=${slug}` : ""}`);
    setPosts(data || []);
  };

  useEffect(() => { loadRooms().catch(() => {}); }, []);
  useEffect(() => { if (slug) loadPosts().catch(() => {}); }, [slug]);

  const currentRoom = rooms.find((r) => r.slug === slug);

  const submit = async () => {
    if (content.trim().length < 3) return;
    setPosting(true);
    try {
      const { data } = await api.post("/community/posts", { room_slug: slug, content: content.trim() });
      if (data?.hidden) {
        toast.warning(data.reason || "Held for review");
      } else {
        toast.success("Posted anonymously · +8 XP");
      }
      setContent("");
      loadPosts();
      loadRooms();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not post");
    } finally {
      setPosting(false);
    }
  };

  const react = async (postId, reaction) => {
    try {
      const { data } = await api.post(`/community/posts/${postId}/react`, { reaction });
      setPosts((ps) => ps.map((p) => p.id === postId ? { ...p, reactions: data.reactions, user_reactions: data.user_reactions } : p));
    } catch {}
  };

  const report = async (postId) => {
    if (!confirm("Report this post for review?")) return;
    try {
      await api.post(`/community/posts/${postId}/report`, { reason: "user_reported" });
      toast.success("Thanks for the report. We'll review.");
      loadPosts();
    } catch { toast.error("Could not report"); }
  };

  const del = async (postId) => {
    if (!confirm("Delete your post?")) return;
    await api.delete(`/community/posts/${postId}`).catch(() => {});
    loadPosts();
    loadRooms();
  };

  // Room list view
  if (!slug) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Community</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold">Talk to people who get it.</h1>
          <p className="mt-2 text-slate-400 text-sm">Anonymous by default. AI-moderated for safety. Be kind.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((r) => (
            <button
              key={r.slug}
              onClick={() => nav(`/app/community/${r.slug}`)}
              data-testid={`room-${r.slug}`}
              className="glass rounded-3xl p-6 text-left hover:bg-white/[0.06] transition group"
            >
              <div className="text-3xl mb-3">{r.emoji}</div>
              <h3 className="font-display text-lg">{r.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{r.description}</p>
              <p className="text-xs text-purple-300 mt-3">{r.post_count} {r.post_count === 1 ? "post" : "posts"}</p>
            </button>
          ))}
        </div>
        {user?.is_admin && (
          <div className="mt-6 glass rounded-3xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-300" />
              <span className="text-sm">You have admin access</span>
            </div>
            <Link to="/app/admin" data-testid="admin-link" className="px-4 py-2 rounded-full bg-white/[0.06] text-sm hover:bg-white/[0.1]">Open admin panel</Link>
          </div>
        )}
      </div>
    );
  }

  // Room view
  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <button onClick={() => nav("/app/community")} data-testid="room-back" className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> All rooms
      </button>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">{currentRoom?.emoji} {currentRoom?.title}</p>
        <h1 className="font-display text-3xl font-semibold">{currentRoom?.description}</h1>
      </div>

      {/* Composer */}
      <div className="glass-strong rounded-3xl p-5">
        <textarea
          placeholder="Share what's on your mind. You're anonymous here."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={2000}
          data-testid="post-composer"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 outline-none focus:border-purple-400/40 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-500">{content.length}/2000</span>
          <button onClick={submit} disabled={posting || content.trim().length < 3}
            data-testid="post-submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand font-medium disabled:opacity-50">
            <Send className="w-4 h-4" /> {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        <AnimatePresence>
          {posts.length === 0 && (
            <div className="glass rounded-3xl p-10 text-center text-slate-400">
              Be the first to share something here. 💜
            </div>
          )}
          {posts.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass rounded-3xl p-5" data-testid={`post-${p.id}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full gradient-aurora grid place-items-center text-xs font-bold border border-white/[0.08]">
                    {p.handle.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{p.handle}</div>
                    <div className="text-[10px] text-slate-500">{new Date(p.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {p.is_own ? (
                    <button onClick={() => del(p.id)} data-testid={`post-delete-${p.id}`} className="p-2 text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => report(p.id)} data-testid={`post-report-${p.id}`} className="p-2 text-slate-500 hover:text-amber-300" title="Report">
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">{p.content}</p>
              <div className="flex items-center gap-1.5 mt-4">
                {Object.entries(REACTION_META).map(([key, { Icon, label, color }]) => {
                  const active = p.user_reactions?.includes(key);
                  const count = p.reactions?.[key] || 0;
                  return (
                    <button key={key} onClick={() => react(p.id, key)}
                      data-testid={`reaction-${key}-${p.id}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition ${
                        active ? "bg-white/[0.08] border-purple-400/40" : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                      }`}
                      title={label}>
                      <Icon className={`w-3.5 h-3.5 ${active ? color : "text-slate-400"}`} />
                      {count > 0 && <span className="text-slate-300">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
