import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import {
  Home, MessageCircle, Smile, BookHeart, ListChecks, Wind, Sparkles,
  ClipboardCheck, User, LogOut, Phone, Menu, X
} from "lucide-react";
import { useState } from "react";
import SOSDialog from "./SOSDialog";

const navItems = [
  { to: "/app", label: "Home",       icon: Home,           testId: "nav-home" },
  { to: "/app/chat", label: "Velora",  icon: MessageCircle,  testId: "nav-chat" },
  { to: "/app/mood", label: "Mood",    icon: Smile,          testId: "nav-mood" },
  { to: "/app/journal", label: "Journal", icon: BookHeart,   testId: "nav-journal" },
  { to: "/app/habits", label: "Habits", icon: ListChecks,    testId: "nav-habits" },
  { to: "/app/breathing", label: "Breathe", icon: Wind,      testId: "nav-breathing" },
  { to: "/app/meditation", label: "Meditate", icon: Sparkles, testId: "nav-meditation" },
  { to: "/app/assessments", label: "Assess", icon: ClipboardCheck, testId: "nav-assessments" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  const handleLogout = () => {
    logout();
    nav("/");
  };

  const isActive = (to) =>
    to === "/app" ? loc.pathname === "/app" : loc.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex text-white">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 flex-col p-6 sticky top-0 h-screen border-r border-white/[0.06] glass">
        <Link to="/app" className="flex items-center gap-2 mb-10" data-testid="sidebar-logo">
          <div className="h-9 w-9 rounded-xl gradient-brand grid place-items-center font-display font-bold">V</div>
          <span className="font-display text-2xl font-semibold">Velora</span>
        </Link>
        <nav className="flex-1 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={item.testId}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-white/[0.06] text-white border border-purple-400/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2">
          <button
            onClick={() => setSosOpen(true)}
            data-testid="sos-button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-sm transition-all"
          >
            <Phone className="w-4 h-4" />
            Emergency / SOS
          </button>
          <Link
            to="/app/profile"
            data-testid="nav-profile"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
              isActive("/app/profile")
                ? "bg-white/[0.06] text-white border border-purple-400/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </Link>
          <div className="px-3 py-2 text-xs text-slate-500 flex items-center justify-between" data-testid="user-greeting">
            <span className="truncate">Hi, {user?.name || "friend"}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white" data-testid="logout-button" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 px-4 py-3 glass border-b border-white/[0.06] flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-brand grid place-items-center font-display font-bold text-sm">V</div>
          <span className="font-display text-lg font-semibold">Velora</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSosOpen(true)}
            data-testid="sos-mobile-button"
            className="h-9 w-9 rounded-full bg-red-500/15 border border-red-500/30 grid place-items-center"
          >
            <Phone className="w-4 h-4 text-red-300" />
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            data-testid="mobile-menu-open"
            className="h-9 w-9 rounded-full bg-white/[0.06] border border-white/[0.1] grid place-items-center"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-72 glass-strong p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <span className="font-display text-xl">Menu</span>
              <button onClick={() => setMobileOpen(false)} data-testid="mobile-menu-close" className="h-8 w-8 grid place-items-center rounded-full bg-white/[0.06]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    data-testid={`${item.testId}-mobile`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                      isActive(item.to) ? "bg-white/[0.08] text-white" : "text-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {item.label}
                  </Link>
                );
              })}
              <Link
                to="/app/profile"
                onClick={() => setMobileOpen(false)}
                data-testid="nav-profile-mobile"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300"
              >
                <User className="w-4 h-4" /> Profile
              </Link>
            </nav>
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 justify-center px-4 py-3 rounded-xl bg-white/[0.05] text-slate-300"
              data-testid="logout-mobile-button"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 pb-24 lg:pb-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 glass border-t border-white/[0.08]">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={`${item.testId}-bottom`}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] transition-all ${
                  active ? "text-white bg-white/[0.06]" : "text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <SOSDialog open={sosOpen} onClose={() => setSosOpen(false)} />
    </div>
  );
}
