import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import Protected from "@/components/Protected";
import AppShell from "@/components/AppShell";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Mood from "@/pages/Mood";
import Journal from "@/pages/Journal";
import Habits from "@/pages/Habits";
import Breathing from "@/pages/Breathing";
import Meditation from "@/pages/Meditation";
import Assessments from "@/pages/Assessments";
import Profile from "@/pages/Profile";
import Community from "@/pages/Community";
import Resources from "@/pages/Resources";
import Playlists from "@/pages/Playlists";
import Admin from "@/pages/Admin";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={
        <Protected requireOnboarding={false}><Onboarding /></Protected>
      } />
      <Route path="/app" element={<Protected><AppShell><Dashboard /></AppShell></Protected>} />
      <Route path="/app/chat" element={<Protected><AppShell><Chat /></AppShell></Protected>} />
      <Route path="/app/mood" element={<Protected><AppShell><Mood /></AppShell></Protected>} />
      <Route path="/app/journal" element={<Protected><AppShell><Journal /></AppShell></Protected>} />
      <Route path="/app/habits" element={<Protected><AppShell><Habits /></AppShell></Protected>} />
      <Route path="/app/breathing" element={<Protected><AppShell><Breathing /></AppShell></Protected>} />
      <Route path="/app/meditation" element={<Protected><AppShell><Meditation /></AppShell></Protected>} />
      <Route path="/app/assessments" element={<Protected><AppShell><Assessments /></AppShell></Protected>} />
      <Route path="/app/community" element={<Protected><AppShell><Community /></AppShell></Protected>} />
      <Route path="/app/community/:slug" element={<Protected><AppShell><Community /></AppShell></Protected>} />
      <Route path="/app/resources" element={<Protected><AppShell><Resources /></AppShell></Protected>} />
      <Route path="/app/playlists" element={<Protected><AppShell><Playlists /></AppShell></Protected>} />
      <Route path="/app/admin" element={<Protected><AppShell><Admin /></AppShell></Protected>} />
      <Route path="/app/profile" element={<Protected><AppShell><Profile /></AppShell></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(12, 8, 20, 0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
              color: "#fff",
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
