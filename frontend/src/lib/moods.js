export const MOODS = [
  { key: "happy",      emoji: "😄", label: "Happy",     color: "from-amber-400 to-pink-500" },
  { key: "good",       emoji: "😊", label: "Good",      color: "from-emerald-400 to-teal-500" },
  { key: "relaxed",    emoji: "😌", label: "Relaxed",   color: "from-sky-400 to-cyan-500" },
  { key: "neutral",    emoji: "😐", label: "Neutral",   color: "from-slate-400 to-slate-500" },
  { key: "sad",        emoji: "😔", label: "Sad",       color: "from-indigo-400 to-blue-500" },
  { key: "depressed",  emoji: "😢", label: "Down",      color: "from-blue-500 to-violet-600" },
  { key: "angry",      emoji: "😡", label: "Angry",     color: "from-red-500 to-rose-600" },
  { key: "anxious",    emoji: "😰", label: "Anxious",   color: "from-fuchsia-500 to-purple-600" },
  { key: "burned_out", emoji: "😞", label: "Burned out", color: "from-orange-500 to-red-500" },
];

export const moodByKey = (k) => MOODS.find((m) => m.key === k);
