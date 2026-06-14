import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api, { API_BASE } from "../lib/api";
import { Send, Sparkles, Mic, Square, Loader2 } from "lucide-react";

const SUGGESTED = [
  "I'm feeling overwhelmed with studies",
  "Help me wind down for sleep",
  "I had a rough day — can we talk?",
  "Give me a quick breathing exercise",
  "I need motivation to start a task",
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content }, { role: "assistant", content: "", streaming: true }]);
    setSending(true);

    try {
      const token = localStorage.getItem("velora_token");
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: content, session_id: sessionId }),
      });
      if (!res.body) throw new Error("No stream body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const obj = JSON.parse(payload);
            if (obj.session_id) setSessionId(obj.session_id);
            if (obj.delta) {
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + obj.delta };
                return next;
              });
            }
            if (obj.done) {
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = { ...next[next.length - 1], streaming: false };
                return next;
              });
            }
            if (obj.error) {
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = { role: "assistant", content: "Sorry, I hit a snag. Try again?", streaming: false };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", content: "Connection issue. Please retry.", streaming: false };
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAndSend(blob);
      };
      mr.start();
      setRecording(true);
    } catch {
      alert("Microphone permission required.");
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && recording) {
      mediaRef.current.stop();
      setRecording(false);
    }
  };

  const transcribeAndSend = async (blob) => {
    setTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "voice.webm");
      const { data } = await api.post("/voice/transcribe", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (data?.text) await sendMessage(data.text);
    } catch (e) {
      alert("Could not transcribe voice.");
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">Velora · AI Companion</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold">Tell me what's on your mind</h1>
      </div>

      <div ref={scrollRef} className="glass rounded-3xl p-4 md:p-6 h-[55vh] overflow-y-auto" data-testid="chat-messages-container">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-2xl gradient-brand grid place-items-center mb-4 pulse-glow">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-slate-400 max-w-sm">I'm Velora — a warm space to vent, plan, or just feel heard. Try one of these to start:</p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  data-testid={`suggested-${s.split(" ")[0].toLowerCase()}`}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 hover:bg-white/[0.08] transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role !== "user" && (
                  <div className="h-8 w-8 rounded-full gradient-brand grid place-items-center text-xs font-bold flex-shrink-0">V</div>
                )}
                <div
                  data-testid={`msg-${m.role}-${i}`}
                  className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-purple-600/80 text-white rounded-tr-sm"
                      : "glass text-slate-100 rounded-tl-sm"
                  }`}
                >
                  {m.content}
                  {m.streaming && <span className="inline-block w-1.5 h-4 bg-purple-300 ml-1 animate-pulse" />}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className="glass-strong rounded-2xl p-2 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder={transcribing ? "Transcribing voice…" : "Type how you feel…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={transcribing}
          data-testid="chat-input"
          className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder:text-slate-500"
        />
        {recording ? (
          <button type="button" onClick={stopRecording} data-testid="chat-mic-stop"
            className="h-10 w-10 rounded-full bg-red-500 grid place-items-center text-white animate-pulse">
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={startRecording} disabled={sending || transcribing} data-testid="chat-mic-start"
            className="h-10 w-10 rounded-full bg-white/[0.06] border border-white/[0.08] grid place-items-center text-slate-300 hover:bg-white/[0.1]">
            {transcribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
        <button
          type="submit"
          disabled={sending || !input.trim()}
          data-testid="chat-send-button"
          className="h-10 w-10 rounded-full gradient-brand grid place-items-center disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
