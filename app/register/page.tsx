"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fullName = name.trim();
    const emailAddress = email.trim();

    if (!fullName || !emailAddress || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setLoading(true);

    try {
      const accountRole = new URLSearchParams(window.location.search).get("role") === "admin" ? "admin" : "customer";

      const otpResponse = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddress, purpose: "registration" }),
      });
      const otpResult = await otpResponse.json();

      if (!otpResponse.ok) {
        setError(otpResult.error || "Unable to send verification code.");
        return;
      }

      if (otpResult.enabled === false) {
        setError("Registration OTP verification is required. Please enable OTP and try again.");
        return;
      }

      sessionStorage.setItem(
        "indabest_pending_registration",
        JSON.stringify({ name: fullName, email: emailAddress, password, role: accountRole })
      );
      setSuccess("Verification code sent! Redirecting...");
      setTimeout(() => router.push("/check-email"), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans flex flex-col">
      <SiteHeader />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-36 pb-10 md:pt-44">
        <div className="flex flex-col items-center mb-4">
          <Image src="/logo.png" alt="Logo" width={96} height={96} className="object-contain drop-shadow-sm" priority />
          <h1 className="text-[#1b5e20] font-extrabold text-2xl mt-2 tracking-wide">INDABEST CRAVE CORNER</h1>
          <p className="text-[#5d4037] text-sm mt-1">We got your cravings covered!</p>
        </div>

        <div className="bg-[#FFF6DE] border border-[#ffe082] rounded-xl shadow-md w-full max-w-xs p-5">
          <h2 className="text-sm font-bold text-[#1b5e20] mb-0.5">Create Account</h2>
          <p className="text-xs text-[#a1887f] mb-4">Register to start placing your orders.</p>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-md px-2 py-1.5 mb-3 text-center">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-md px-2 py-1.5 mb-3 text-center">{success}</p>
          )}

          <form onSubmit={handleRegister} className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
              required
            />
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
            />
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm password"
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f57c00] hover:bg-[#ef6c00] disabled:opacity-60 text-white font-bold py-2 rounded-lg text-sm transition"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <hr className="border-[#ffe082] my-3" />

          <p className="text-xs text-[#a1887f] text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-[#4caf50] font-semibold hover:underline">Log in</Link>
          </p>
        </div>

        <Link href="/" className="mt-4 text-xs text-[#5d4037] hover:text-[#4caf50] transition">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 pr-10 text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
        required
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
