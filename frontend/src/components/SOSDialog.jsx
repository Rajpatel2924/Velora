import { useEffect, useState } from "react";
import { Phone, ExternalLink, X } from "lucide-react";
import api from "../lib/api";

export default function SOSDialog({ open, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || data) return;
    api.get("/emergency/resources").then(({ data }) => setData(data)).catch(() => {});
  }, [open, data]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md grid place-items-center p-4" onClick={onClose} data-testid="sos-dialog">
      <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-400 mb-1">Emergency Support</p>
            <h3 className="font-display text-2xl font-semibold">You're not alone</h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full bg-white/[0.06]" data-testid="sos-close-button">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-300 mb-5">
          If you're in crisis or thinking about hurting yourself, please reach out to someone right now.
        </p>

        <div className="space-y-2 mb-5">
          {(data?.hotlines || []).map((h) => (
            <a
              key={h.name}
              href={h.url}
              target="_blank"
              rel="noreferrer"
              data-testid={`sos-hotline-${h.name.split(" ")[0].toLowerCase()}`}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{h.name}</div>
                <div className="text-xs text-slate-400">{h.number}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
            </a>
          ))}
        </div>

        <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/[0.08]">
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Right now, try this</p>
          <ul className="text-sm text-slate-200 space-y-1.5 list-disc list-inside">
            {(data?.tips || []).map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>

        <a
          href="tel:988"
          data-testid="sos-call-button"
          className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium"
        >
          <Phone className="w-4 h-4" /> Call 988 now
        </a>
      </div>
    </div>
  );
}
