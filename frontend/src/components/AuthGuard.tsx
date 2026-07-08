import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { clearAuthSession } from "../services/auth";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, setUser, isRestoringUser } = useAuth();

  useEffect(() => {
    if (user && user.emailVerified === false) {
      clearAuthSession();
      setUser(null);
    }
  }, [user, setUser]);

  if (isRestoringUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-4xl border border-slate-200 bg-white px-8 py-10 shadow-xl shadow-slate-950/10 text-center">
          <p className="text-sm font-medium text-slate-500">Restoring session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.emailVerified === false) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
