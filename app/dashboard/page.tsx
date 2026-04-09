// app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#DDF8B1] p-8">
      <h1 className="text-4xl font-bold text-[#1b5e20] mb-6">Welcome to Dashboard</h1>
      <p className="text-lg text-gray-700">You are now logged in. You can place orders here.</p>

      <button
        onClick={() => {
          localStorage.removeItem("isLoggedIn");
          router.push("/");
        }}
        className="mt-8 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}