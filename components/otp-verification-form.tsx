"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notifyAuthChange } from "@/components/use-auth-profile";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type OtpPurpose = "registration" | "login";

type PendingRegistration = {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "customer";
};

type PendingLogin = {
  email: string;
  role: string | null;
};

type OtpVerificationFormProps = {
  purpose: OtpPurpose;
  title: string;
  message: string;
};

const storageKeys = {
  registration: "indabest_pending_registration",
  login: "indabest_pending_login",
};

export default function OtpVerificationForm({ purpose, title, message }: OtpVerificationFormProps) {
  const router = useRouter();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const otp = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKeys[purpose]);
    if (!raw) {
      setError("No pending verification found. Please start again.");
      return;
    }

    try {
      const pending = JSON.parse(raw) as PendingRegistration | PendingLogin;
      setEmail(pending.email);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Pending verification data is invalid. Please start again.");
    }
  }, [purpose]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  async function sendOtp() {
    if (!email) {
      setError("Email address is missing. Please start again.");
      return;
    }

    setResending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to resend OTP.");
      }

      setDigits(["", "", "", "", "", ""]);
      setCooldown(60);
      setSuccess("A new verification code was sent to your email.");
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend OTP.");
    } finally {
      setResending(false);
    }
  }

  async function finishRegistration() {
    const raw = sessionStorage.getItem(storageKeys.registration);
    if (!raw) throw new Error("No pending registration found. Please register again.");

    const pending = JSON.parse(raw) as PendingRegistration;
    if (!pending.name || !pending.email || !pending.password) {
      console.error("[verify/register] Missing pending registration data", {
        hasName: Boolean(pending.name),
        hasEmail: Boolean(pending.email),
        hasPassword: Boolean(pending.password),
        role: pending.role,
      });
      throw new Error("Registration data is incomplete. Please register again.");
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        role: pending.role === "admin" ? "admin" : "customer",
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      console.error("[verify/register] Account creation failed after OTP", result);
      throw new Error(result.error || "Unable to create account.");
    }

    sessionStorage.removeItem(storageKeys.registration);
    setSuccess("Account verified! Redirecting to login...");
    window.setTimeout(() => router.push("/login"), 900);
  }

  async function finishLogin() {
    const raw = sessionStorage.getItem(storageKeys.login);
    const pending = raw ? (JSON.parse(raw) as PendingLogin) : null;

    sessionStorage.removeItem(storageKeys.login);
    notifyAuthChange();
    setSuccess("Login verified! Redirecting...");
    window.setTimeout(() => router.push(pending?.role === "admin" ? "/admin/dashboard" : "/dashboard"), 700);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please check .env.local.");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      inputRefs.current[digits.findIndex((digit) => !digit)]?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose, otp }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Invalid OTP.");
      }

      if (purpose === "registration") {
        await finishRegistration();
      } else {
        await finishLogin();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify OTP right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#fff7e8] px-4 py-8 text-[#5b3924]">
      <section className="w-full max-w-md rounded-3xl border border-[#ead7b7] bg-[#fffaf1] p-6 text-center shadow-[0_18px_45px_rgba(91,57,36,0.18)] sm:p-8">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#2f6b3f] text-3xl text-[#fff7e8] shadow-lg">
          {purpose === "login" ? "✓" : "🍽"}
        </div>
        <h1 className="text-2xl font-extrabold text-[#214d2e] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#74513a]">{message}</p>
        {email && <p className="mt-1 text-xs font-semibold text-[#2f6b3f]">{email}</p>}

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid grid-cols-6 gap-2" role="group" aria-label="6-digit verification code">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digits[index] && index > 0) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
                onPaste={(event) => {
                  event.preventDefault();
                  const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                  if (!pasted) return;
                  setDigits((current) => current.map((_, digitIndex) => pasted[digitIndex] || ""));
                  inputRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
                }}
                inputMode="numeric"
                maxLength={1}
                aria-label={`Digit ${index + 1}`}
                className="aspect-square w-full rounded-xl border-2 border-[#ead7b7] bg-white text-center text-xl font-bold text-[#5b3924] outline-none transition focus:border-[#e8862f] focus:ring-4 focus:ring-[#e8862f]/20"
              />
            ))}
          </div>
          <input type="hidden" name="otp" value={otp} />

          <p className="mt-4 min-h-5 text-sm text-red-600" aria-live="polite">{error}</p>
          {success && <p className="mt-1 text-sm text-[#2f6b3f]" aria-live="polite">{success}</p>}

          <button
            type="submit"
            disabled={loading || !email}
            className="mt-4 h-12 w-full rounded-xl bg-[#2f6b3f] font-bold text-[#fff7e8] shadow-lg transition hover:bg-[#214d2e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            onClick={sendOtp}
            disabled={resending || cooldown > 0 || !email}
            className="mt-3 h-12 w-full rounded-xl border border-[#ead7b7] bg-[#f3dfbd] font-bold text-[#5b3924] transition hover:bg-[#ecd3a8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend OTP (${cooldown}s)` : resending ? "Sending..." : "Resend OTP"}
          </button>
        </form>

        <Link href={purpose === "login" ? "/login" : "/register"} className="mt-5 inline-block text-xs font-semibold text-[#2f6b3f] hover:underline">
          Back to {purpose === "login" ? "login" : "registration"}
        </Link>
      </section>
    </main>
  );
}
