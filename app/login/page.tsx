"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { notifyAuthChange } from "@/components/use-auth-profile";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getCurrentAppUserRole } from "@/lib/supabase/data";

type ResetStep = "email" | "otp" | "password" | "success";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetCooldown, setResetCooldown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!resetOpen || resetCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResetCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resetOpen, resetCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setError("Please confirm your email first. Check your inbox for the Supabase confirmation link.");
          return;
        }

        setError(signInError.message || "Invalid email or password.");
        return;
      }

      const user = data.user;
      console.log("[login] Supabase auth user:", { id: user?.id, email: user?.email });

      const role = await getCurrentAppUserRole(user?.id, user?.email);
      console.log("[login] Redirect role:", role);

      if (role === "admin") {
        notifyAuthChange();
        router.push("/admin/dashboard");
        return;
      }

      const otpResponse = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), purpose: "login" }),
      });
      const otpResult = await otpResponse.json();

      if (!otpResponse.ok) {
        await supabase.auth.signOut();
        setError(otpResult.error || "Unable to send login verification code.");
        return;
      }

      if (otpResult.enabled !== false) {
        sessionStorage.setItem("indabest_pending_login", JSON.stringify({ email: email.trim(), role }));
        router.push("/verify-login");
        return;
      }

      notifyAuthChange();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in right now.");
    } finally {
      setLoading(false);
    }
  };

  const openResetModal = () => {
    setResetOpen(true);
    setResetStep("email");
    setResetEmail(email.trim());
    setResetOtp("");
    setResetToken("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
    setResetError("");
    setResetMessage("");
    setResetCooldown(0);
  };

  const closeResetModal = () => {
    setResetOpen(false);
    setResetLoading(false);
  };

  const requestResetOtp = async (isResend = false) => {
    const emailAddress = resetEmail.trim().toLowerCase();
    setResetError("");
    setResetMessage("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      setResetError("Please enter a valid registered email address.");
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddress }),
      });
      const result = await response.json();

      if (!response.ok) {
        if (typeof result.cooldownSeconds === "number") setResetCooldown(result.cooldownSeconds);
        setResetError(result.error || "Unable to send password reset OTP.");
        return;
      }

      setResetEmail(emailAddress);
      setResetOtp("");
      setResetStep("otp");
      setResetCooldown(60);
      setResetMessage(isResend ? "A new OTP was sent to your email." : "OTP sent. Please check your email.");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Unable to send password reset OTP.");
    } finally {
      setResetLoading(false);
    }
  };

  const verifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    if (!/^\d{6}$/.test(resetOtp.trim())) {
      setResetError("Enter the 6-digit OTP from your email.");
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch("/api/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp.trim() }),
      });
      const result = await response.json();

      if (!response.ok) {
        setResetError(result.error || "Invalid or expired OTP.");
        return;
      }

      setResetToken(result.resetToken || "");
      setResetStep("password");
      setResetMessage("OTP verified. You can now change your password.");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Unable to verify OTP.");
    } finally {
      setResetLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    if (resetNewPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch("/api/password-reset/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          password: resetNewPassword,
          confirmPassword: resetConfirmPassword,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setResetError(result.error || "Unable to update password.");
        return;
      }

      setPassword("");
      setResetStep("success");
      setResetMessage("Password updated successfully. Please log in with your new password.");
      router.push("/login");
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Unable to update password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans flex flex-col">
      <SiteHeader />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-36 pb-10 md:pt-44">
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-[#1b5e20] font-extrabold text-2xl mt-2 tracking-wide">J&apos;BISTRO</h1>
          <p className="text-[#5d4037] text-sm mt-1">We got your cravings covered!</p>
        </div>

        <div className="bg-[#FFF6DE] border border-[#ffe082] rounded-xl shadow-md w-full max-w-xs p-5">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-md px-2 py-1.5 mb-3 text-center">{error}</p>
          )}
          <form onSubmit={handleLogin} className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
              required
            />
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Password"
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4caf50] hover:bg-[#388e3c] disabled:opacity-60 text-white font-bold py-2 rounded-lg text-sm transition"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="text-center mt-2">
            <button type="button" onClick={openResetModal} className="text-xs font-semibold text-[#4caf50] hover:underline">
              Forgot password?
            </button>
          </div>

          <hr className="border-[#ffe082] my-3" />

          <div className="text-center">
            <Link href="/register">
              <button className="bg-[#f57c00] hover:bg-[#ef6c00] text-white font-bold px-5 py-2 rounded-lg text-sm transition">
                Create new account
              </button>
            </Link>
          </div>
        </div>

        <Link href="/" className="mt-4 text-xs text-[#5d4037] hover:text-[#4caf50] transition">
          Back to Home
        </Link>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b2f1f]/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#f3d48f] bg-[#FFF6DE] shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-[#1b5e20] px-5 py-4 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffe082]">Password Reset</p>
                <h2 className="mt-1 text-xl font-extrabold">J&apos;Bistro Account</h2>
              </div>
              <button
                type="button"
                onClick={closeResetModal}
                aria-label="Close password reset"
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-5">
              <StepDots step={resetStep} />

              {resetError && (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-600">{resetError}</p>
              )}
              {resetMessage && (
                <p className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center text-xs text-green-700">{resetMessage}</p>
              )}

              {resetStep === "email" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    requestResetOtp();
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#1b5e20]">Registered email</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-2.5 text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full rounded-lg bg-[#4caf50] py-2.5 text-sm font-bold text-white transition hover:bg-[#388e3c] disabled:opacity-60"
                  >
                    {resetLoading ? "Checking email..." : "Send OTP"}
                  </button>
                </form>
              )}

              {resetStep === "otp" && (
                <form onSubmit={verifyResetOtp} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#1b5e20]">6-digit OTP</label>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-3 text-center text-2xl font-extrabold tracking-[0.35em] text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full rounded-lg bg-[#4caf50] py-2.5 text-sm font-bold text-white transition hover:bg-[#388e3c] disabled:opacity-60"
                  >
                    {resetLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={() => requestResetOtp(true)}
                    disabled={resetLoading || resetCooldown > 0}
                    className="w-full rounded-lg border border-[#f57c00] bg-white py-2.5 text-sm font-bold text-[#f57c00] transition hover:bg-[#fff3e0] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resetCooldown > 0 ? `Resend OTP in ${resetCooldown}s` : "Resend OTP"}
                  </button>
                </form>
              )}

              {resetStep === "password" && (
                <form onSubmit={updatePassword} className="space-y-3">
                  <PasswordInput
                    value={resetNewPassword}
                    onChange={setResetNewPassword}
                    placeholder="New password"
                    visible={showResetPassword}
                    onToggle={() => setShowResetPassword((value) => !value)}
                    required
                  />
                  <PasswordInput
                    value={resetConfirmPassword}
                    onChange={setResetConfirmPassword}
                    placeholder="Confirm password"
                    visible={showResetConfirmPassword}
                    onToggle={() => setShowResetConfirmPassword((value) => !value)}
                    required
                  />
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full rounded-lg bg-[#f57c00] py-2.5 text-sm font-bold text-white transition hover:bg-[#ef6c00] disabled:opacity-60"
                  >
                    {resetLoading ? "Updating password..." : "Change Password"}
                  </button>
                </form>
              )}

              {resetStep === "success" && (
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#4caf50] text-white">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={closeResetModal}
                    className="w-full rounded-lg bg-[#4caf50] py-2.5 text-sm font-bold text-white transition hover:bg-[#388e3c]"
                  >
                    Return to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 pr-10 text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
        required={required}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#5d4037] transition hover:text-[#4caf50]"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {visible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4 10 7a12.8 12.8 0 0 1-3 4.4" />
              <path d="M6.6 6.6A12.3 12.3 0 0 0 2 12c1 3 5 7 10 7a9.8 9.8 0 0 0 4.2-.9" />
            </>
          ) : (
            <>
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

function StepDots({ step }: { step: ResetStep }) {
  const steps: ResetStep[] = ["email", "otp", "password", "success"];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="mb-5 grid grid-cols-4 gap-2" aria-hidden="true">
      {steps.map((item, index) => (
        <div
          key={item}
          className={`h-1.5 rounded-full transition ${index <= currentIndex ? "bg-[#4caf50]" : "bg-[#ead7b7]"}`}
        />
      ))}
    </div>
  );
}
