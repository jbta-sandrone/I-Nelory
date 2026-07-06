import { AnimatePresence, motion } from "framer-motion";
import type { FormEvent, MouseEvent } from "react";
import { useState } from "react";
import { loginUser, saveAuthSession, type AuthUser } from "../services/auth";

type LoginPageProps = {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  onSwitchToSignup: () => void;
};

export default function LoginPage({
  isOpen,
  onClose,
  onLoginSuccess,
  onSwitchToSignup,
}: LoginPageProps) {
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const closeLoginModal = () => {
    setLoginError(null);
    onClose();
  };

  const switchToSignup = () => {
    setLoginError(null);
    onSwitchToSignup();
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setIsLoginLoading(true);

    try {
      const result = await loginUser({
        username: loginForm.username,
        password: loginForm.password,
      });

      saveAuthSession(result.token, result.user);
      onLoginSuccess(result.user);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={closeLoginModal}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-8"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event: MouseEvent<HTMLDivElement>) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600">
                  Welcome back
                </p>
                <h2
                  id="login-title"
                  className="mt-2 text-3xl font-semibold tracking-tight text-slate-950"
                >
                  Login to I-Nelory
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Continue preserving your private digital memories.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close login modal"
                onClick={closeLoginModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleLoginSubmit}
              noValidate
            >
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Username
                </span>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={loginForm.username}
                  onChange={(event) => {
                    setLoginError(null);
                    setLoginForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }));
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/20"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Password
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(event) => {
                    setLoginError(null);
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }));
                  }}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/20"
                />
              </label>

              {loginError ? (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {loginError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isLoginLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={switchToSignup}
                className="font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                Sign up
              </button>
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
