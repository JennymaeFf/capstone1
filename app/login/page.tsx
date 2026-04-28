"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { notifyAuthChange } from "@/components/use-auth-profile";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getCurrentAppUserRole } from "@/lib/supabase/data";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans flex flex-col">

      <SiteHeader />

      {/* CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-36 pb-10 md:pt-44">
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-[#1b5e20] font-extrabold text-2xl mt-2 tracking-wide">INDABEST CRAVE CORNER</h1>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 pr-10 text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#5d4037] transition hover:text-[#4caf50]"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4caf50] hover:bg-[#388e3c] disabled:opacity-60 text-white font-bold py-2 rounded-lg text-sm transition"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="text-center mt-2">
            <Link href="#" className="text-xs text-[#4caf50] hover:underline">Forgot password?</Link>
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
          ← Back to Home
        </Link>
      </div>

      <SiteFooter />
    </div>
  );
}
