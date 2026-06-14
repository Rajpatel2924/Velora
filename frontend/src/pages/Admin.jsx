import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Shield, AlertTriangle, Check, X, Users, MessageSquare, BookHeart, Smile } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);

  const load = async () => {
    try {
      const [q, s] = await Promise.all([api.get("/admin/moderation"), api.get("/admin/stats")]);
      setQueue(q.data || []);
      setStats(s.data);
    } catch (e) {
      toast.error("Could not load admin data");
    }
  };

  useEffect(() => { if (user?.is_admin) load(); }, [user]);

  if (!user?.is_admin) return <Navigate to="/app" replace />;

  const act = async (postId, action) => {
    try {
      await api.post(`/admin/moderation/${postId}/action`, { action });
      toast.success(action === "approve" ? "Approved" : "Removed");
      load();
    } catch { toast.error("Failed"); }
  };

  const statCards = [
    { label: "Users",         value: stats?.users ?? "—",        icon: Users,        color: "from-purple-500/30 to-blue-500/30" },
    { label: "Active Posts",  value: stats?.posts_active ?? "—", icon: MessageSquare, color: "from-emerald-500/30 to-teal-500/30" },
    { label: "Hidden Posts",  value: stats?.posts_hidden ?? "—", icon: AlertTriangle, color: "from-amber-500/30 to-orange-500/30" },
    { label: "Total Moods",   value: stats?.moods_total ?? "—",  icon: Smile,         color: "from-pink-500/30 to-rose-500/30" },
    { label: "Journals",      value: stats?.journals_total ?? "—", icon: BookHeart,   color: "from-cyan-500/30 to-blue-500/30" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl gradient-brand grid place-items-center">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-1">Admin Panel</p>
          <h1 className="font-display text-3xl font-semibold">Velora Operations</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass rounded-2xl p-4 relative overflow-hidden">
              <div className={`absolute inset-0 opacity-60 bg-gradient-to-br ${s.color}`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300">{s.label}</p>
                  <Icon className="w-3.5 h-3.5 text-white/70" />
                </div>
                <p className="font-display text-2xl">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Moderation queue */}
      <div>
        <h2 className="font-display text-xl mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-300" /> Moderation Queue
        </h2>
        {queue.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center text-slate-400">All clear. Nothing pending review.</div>
        ) : (
          <div className="space-y-3">
            {queue.map((p) => (
              <div key={p.id} className="glass rounded-3xl p-5" data-testid={`mod-post-${p.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium">{p.handle} · {p.room_slug}</div>
                    <div className="text-[10px] text-slate-500">{new Date(p.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {p.ai_flagged && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200">
                        AI: {p.ai_severity || "flagged"}
                      </span>
                    )}
                    {p.report_count > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-200">
                        Reports: {p.report_count}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 capitalize">{p.status}</span>
                  </div>
                </div>
                <p className="text-slate-100 whitespace-pre-wrap mb-3">{p.content}</p>
                {p.ai_reason && (
                  <p className="text-xs text-amber-200/80 mb-3">AI reason: {p.ai_reason}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => act(p.id, "approve")} data-testid={`mod-approve-${p.id}`}
                    className="flex items-center gap-1 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-sm hover:bg-emerald-500/25">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => act(p.id, "remove")} data-testid={`mod-remove-${p.id}`}
                    className="flex items-center gap-1 px-4 py-2 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-200 text-sm hover:bg-rose-500/25">
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
