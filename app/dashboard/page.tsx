"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { useAuthProfile } from "@/components/use-auth-profile";

export default function Dashboard() {
  const router = useRouter();
  const { isLoading, isLoggedIn } = useAuthProfile();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isLoggedIn ? "/menu" : "/login");
  }, [isLoading, isLoggedIn, router]);

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">
      <SiteHeader />

      <main className="flex min-h-screen items-center justify-center px-6 pt-36 text-center">
        <div className="rounded-xl border border-[#ffe082] bg-[#FFF6DE] p-6 shadow-md">
          <h2 className="text-2xl font-extrabold text-[#1b5e20]">Opening your menu...</h2>
          <p className="mt-2 text-sm text-[#5d4037]">Your customer dashboard is the full Indabest ordering experience.</p>
        </div>
      </main>
    </div>
  );
}
