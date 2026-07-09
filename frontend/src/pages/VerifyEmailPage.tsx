import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { clearAuthSession, verifyEmail } from "../services/auth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string>("Verifying your email...");
  const [error, setError] = useState<string | null>(null);
  const [verifiedType, setVerifiedType] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setMessage("Invalid verification link.");
      setError("Missing token.");
      return;
    }

    verifyEmail(token)
      .then(({ message: successMessage, type }) => {
        setVerifiedType(type ?? null);
        setMessage(successMessage || "Email verified successfully.");

        if (type === "CHANGE_EMAIL") {
          clearAuthSession();
          setUser(null);
          window.setTimeout(() => navigate("/"), 1200);
        }
      })
      .catch((error) => {
        setMessage(
          "Unable to verify your email. Please try the link again or resend it from your account."
        );
        setError(error instanceof Error ? error.message : "Verification failed.");
      });
  }, [token]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-24 text-slate-950">
      <div className="mx-auto max-w-3xl rounded-4xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-950/10">
        <div className="space-y-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Email verification
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {error ? "Verification failed" : "Email verified"}
          </h1>
          <p className="text-sm leading-6 text-slate-600">{message}</p>
          {error ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Back to home
            </button>
            {!error ? (
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                {verifiedType === "CHANGE_EMAIL" ? "Go to sign in" : "Log in"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
