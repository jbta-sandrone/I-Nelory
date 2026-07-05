import { AnimatePresence, motion } from "framer-motion";
import type { MouseEvent } from "react";

type SignupPageProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
};

export default function SignupPage({
  isOpen,
  onClose,
  onSwitchToLogin,
}: SignupPageProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
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
                <p className="text-sm font-semibold text-indigo-600">
                  Create your space
                </p>
                <h2
                  id="signup-title"
                  className="mt-2 text-3xl font-semibold tracking-tight text-slate-950"
                >
                  Sign up for I-Nelory
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Start building your private memory archive.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close sign up modal"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={(event) => event.preventDefault()}
            >
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Confirm password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25"
              >
                Create Account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-semibold text-indigo-600 transition hover:text-indigo-700"
              >
                Login
              </button>
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
