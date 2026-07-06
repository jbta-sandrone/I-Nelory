import { AnimatePresence, motion } from "framer-motion";
import type { FormEvent, MouseEvent } from "react";
import { useState } from "react";
import { registerUser } from "../services/auth";

type SignupPageProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
};

type SignupFormState = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupFormErrors = Partial<Record<keyof SignupFormState, string>>;

export default function SignupPage({
  isOpen,
  onClose,
  onSwitchToLogin,
}: SignupPageProps) {
  const [signupForm, setSignupForm] = useState<SignupFormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [signupErrors, setSignupErrors] = useState<SignupFormErrors>({});
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  const clearSignupMessages = () => {
    setSignupError(null);
    setSignupSuccess(null);
  };

  const closeSignupModal = () => {
    clearSignupMessages();
    onClose();
  };

  const switchToLogin = () => {
    clearSignupMessages();
    onSwitchToLogin();
  };

  const updateSignupField = (field: keyof SignupFormState, value: string) => {
    setSignupForm((current) => ({ ...current, [field]: value }));
    clearSignupMessages();
    setSignupErrors((current) => {
      const nextErrors = { ...current };

      delete nextErrors[field];

      if (field === "password" || field === "confirmPassword") {
        delete nextErrors.confirmPassword;
      }

      return nextErrors;
    });
  };

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: SignupFormErrors = {};
    setSignupError(null);
    setSignupSuccess(null);

    if (!signupForm.username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setSignupErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSignupLoading(true);

    try {
      const result = await registerUser({
        username: signupForm.username.trim(),
        email: signupForm.email.trim(),
        password: signupForm.password,
      });

      setSignupSuccess(result.message || "Account created. You can log in now.");
      setSignupForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      setSignupError(
        error instanceof Error ? error.message : "Registration failed"
      );
    } finally {
      setIsSignupLoading(false);
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
          onClick={closeSignupModal}
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
                <p className="text-sm font-semibold text-emerald-600">
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
                onClick={closeSignupModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={handleSignupSubmit}
              noValidate
            >
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Username
                </span>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Choose a username"
                  value={signupForm.username}
                  onChange={(event) =>
                    updateSignupField("username", event.target.value)
                  }
                  aria-invalid={signupErrors.username ? "true" : undefined}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/20"
                />
                {signupErrors.username ? (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    {signupErrors.username}
                  </p>
                ) : null}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={signupForm.email}
                  onChange={(event) =>
                    updateSignupField("email", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/20"
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
                  value={signupForm.password}
                  onChange={(event) =>
                    updateSignupField("password", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/20"
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
                  value={signupForm.confirmPassword}
                  onChange={(event) =>
                    updateSignupField("confirmPassword", event.target.value)
                  }
                  aria-invalid={
                    signupErrors.confirmPassword ? "true" : undefined
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/20"
                />
                {signupErrors.confirmPassword ? (
                  <p className="mt-2 text-xs font-medium text-red-500">
                    {signupErrors.confirmPassword}
                  </p>
                ) : null}
              </label>

              {signupError ? (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {signupError}
                </p>
              ) : null}

              {signupSuccess ? (
                <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {signupSuccess}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSignupLoading}
                className="w-full rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSignupLoading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchToLogin}
                className="font-semibold text-emerald-600 transition hover:text-emerald-700"
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
