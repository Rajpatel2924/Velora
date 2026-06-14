import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Protected({ children, requireOnboarding = true }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) {
    nav("/auth", { replace: true });
    return null;
  }
  if (requireOnboarding && !user.onboarding_complete) {
    nav("/onboarding", { replace: true });
    return null;
  }
  return children;
}
