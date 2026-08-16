"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
} from "lucide-react";
import { auth } from "@/lib/firebase";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const actionCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    if (!actionCode || mode !== "resetPassword") {
      setError("This password reset link is invalid or incomplete.");
      setLoading(false);
      return;
    }

    setCode(actionCode);

    verifyPasswordResetCode(auth, actionCode)
      .then((accountEmail) => {
        setEmail(accountEmail);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Password reset verification error:", err);

        if (err?.code === "auth/expired-action-code") {
          setError("This password reset link has expired.");
        } else if (err?.code === "auth/invalid-action-code") {
          setError(
            "This password reset link is invalid or has already been used."
          );
        } else if (err?.code === "auth/user-disabled") {
          setError("This account has been disabled.");
        } else {
          setError("We couldn't verify this password reset link.");
        }

        setLoading(false);
      });
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!code) {
      setError("Invalid password reset link.");
      return;
    }

    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      await confirmPasswordReset(auth, code, password);

      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset error:", err);

      if (err?.code === "auth/expired-action-code") {
        setError("This password reset link has expired.");
      } else if (err?.code === "auth/invalid-action-code") {
        setError(
          "This password reset link is invalid or has already been used."
        );
      } else if (err?.code === "auth/weak-password") {
        setError("Please choose a stronger password.");
      } else {
        setError("We couldn't reset your password. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
            <Loader2 className="w-6 h-6 text-[#245B92] animate-spin" />
          </div>

          <h1 className="text-xl font-black text-slate-900">
            Verifying reset link
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Please wait while we verify your password reset request.
          </p>
        </div>
      </main>
    );
  }

  if (error && !code) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
            <LockKeyhole className="w-6 h-6 text-red-500" />
          </div>

          <h1 className="text-2xl font-black text-slate-900">
            Reset link unavailable
          </h1>

          <p className="text-sm text-slate-500 mt-2 leading-6">
            {error}
          </p>

          <button
            onClick={() => router.push("/")}
            className="w-full mt-6 bg-[#245B92] hover:bg-[#1d4d7d] text-white font-bold py-3 rounded-xl transition"
          >
            Back to DueBlink
          </button>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>

          <h1 className="text-2xl font-black text-slate-900">
            Password updated
          </h1>

          <p className="text-sm text-slate-500 mt-2 leading-6">
            Your DueBlink password has been successfully changed.
          </p>

          <button
            onClick={() => router.push("/login")}
            className="w-full mt-6 bg-[#245B92] hover:bg-[#1d4d7d] text-white font-bold py-3 rounded-xl transition"
          >
            Continue to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">

        <div className="bg-gradient-to-r from-[#245B92] to-[#20B8BE] px-7 py-7 text-white">
          <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center mb-5">
            <LockKeyhole size={21} />
          </div>

          <h1 className="text-2xl font-black">
            Reset your password
          </h1>

          <p className="text-sm text-white/80 mt-2">
            Create a new secure password for your DueBlink account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-7">

          <div className="mb-5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Account
            </label>

            <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 break-all">
              {email}
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              New password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Enter new password"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/10 text-sm"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Confirm new password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Enter password again"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 outline-none focus:border-[#245B92] focus:ring-2 focus:ring-[#245B92]/10 text-sm"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#245B92] hover:bg-[#1d4d7d] disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Updating password...
              </>
            ) : (
              "Reset Password"
            )}
          </button>

          <p className="text-center text-xs text-slate-400 mt-5">
            Your password is securely managed by Firebase Authentication.
          </p>
        </form>
      </div>
    </main>
  );
}

function ResetPasswordLoading() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <Loader2 className="w-6 h-6 text-[#245B92] animate-spin" />
        </div>

        <h1 className="text-xl font-black text-slate-900">
          Loading
        </h1>

        <p className="text-sm text-slate-500 mt-2">
          Please wait...
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
