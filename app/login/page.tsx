"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const found = users.find(
        (u: { email: string; password: string }) =>
          u.email === email && u.password === password
      );
      if (found) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", found.email);
        localStorage.setItem("userName", found.name);
        router.push("/");
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans flex flex-col">

    {/* FIXED HEADER */}
          <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-sm">
            <div className="flex items-center gap-5">
              <Image
                src="/logo.png"
                alt="INDABEST CRAVE CORNER Logo"
                width={150}
                height={150}
                className="object-contain"
              />
              <div>
                <h1 className="text-[#5d4037] text-2xl md:text-3xl font-bold tracking-wide">
                  INDABEST CRAVE CORNER
                </h1>
                <p className="text-[#a1887f] text-sm -mt-1">
                  We got your cravinags covered!
                </p>
              </div>
            </div>
    
            <ul className="hidden md:flex gap-10 text-[#5d4037] text-base font-medium">
              <li><Link href="/" className="hover:text-[#4caf50]">HOME</Link></li>
              <li><Link href="/menu" className="hover:text-[#4caf50]">MENU</Link></li>
              <li><Link href="/story" className="hover:text-[#4caf50]">OUR STORY</Link></li>
              <li><Link href="/contact" className="hover:text-[#4caf50]">CONTACT US</Link></li>
              <li><Link href="/login" className="font-semibold text-[#4caf50] hover:text-[#388e3c]">LOGIN</Link></li>
            </ul>
          </nav>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-10">
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 bg-white border border-[#c8e6c9] rounded-lg text-sm text-[#5d4037] placeholder-[#bcaaa4] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
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
    </div>
  );
}
