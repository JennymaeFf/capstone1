"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Check if email already exists
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u: { email: string }) => u.email === email)) {
      setError("Email already registered.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Save new user
      users.push({ name, email, password });
      localStorage.setItem("users", JSON.stringify(users));
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1000);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans flex flex-col">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-sm" style={{backdropFilter: 'none'}}>
        <div className="flex items-center gap-5">
          <Image src="/logo.png" alt="INDABEST CRAVE CORNER Logo" width={150} height={150} className="object-contain" />
          <div>
            <h1 className="text-[#5d4037] text-lg md:text-xl font-bold tracking-wide">INDABEST CRAVE CORNER</h1>
            <p className="text-[#a1887f] text-xs -mt-1">We got your cravings covered!</p>
          </div>
        </div>

        <ul className="hidden md:flex gap-6 text-[#5d4037] text-xs font-medium items-center">
          <li><Link href="/" className="hover:text-[#4caf50]">HOME</Link></li>
          <li><Link href="/menu" className="hover:text-[#4caf50]">MENU</Link></li>
          <li><Link href="/story" className="hover:text-[#4caf50]">OUR STORY</Link></li>
          <li><Link href="/contact" className="hover:text-[#4caf50]">CONTACT US</Link></li>
          <li>
            <button onClick={() => router.push("/menu")} className="relative">
              <span className="text-2xl">ðŸ›’</span>
            </button>
          </li>
          <li><Link href="/login" className="font-semibold text-[#4caf50] hover:text-[#388e3c]">LOGIN</Link></li>
        </ul>
      </nav>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-36 pb-10 md:pt-44">
        <div className="flex flex-col items-center mb-4">
          <Image src="/logo.png" alt="Logo" width={64} height={64} className="object-contain" />
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
              required
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
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
