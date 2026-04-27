"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
      <nav className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-between border-b border-[#ffe082] bg-[#FFF6DE] px-6 py-5 shadow-sm md:px-16">
        <Link href="/" className="flex items-center gap-5">
          <Image src="/logo.png" alt="INDABEST CRAVE CORNER Logo" width={150} height={150} className="object-contain" />
          <div>
            <h1 className="text-lg font-bold tracking-wide text-[#5d4037] md:text-xl">INDABEST CRAVE CORNER</h1>
            <p className="-mt-1 text-xs text-[#a1887f]">We got your cravings covered!</p>
          </div>
        </Link>
        <ul className="hidden items-center gap-6 text-xs font-medium text-[#5d4037] md:flex">
          <li><Link href="/" className="hover:text-[#4caf50]">HOME</Link></li>
          <li><Link href="/menu" className="hover:text-[#4caf50]">MENU</Link></li>
          <li><Link href="/story" className="hover:text-[#4caf50]">OUR STORY</Link></li>
          <li><Link href="/contact" className="hover:text-[#4caf50]">CONTACT US</Link></li>
          <li><Link href="/orders" className="hover:text-[#4caf50]">MY ORDERS</Link></li>
        </ul>
      </nav>

      <main className="flex min-h-screen items-center justify-center px-6 pt-36 text-center">
        <div className="rounded-xl border border-[#ffe082] bg-[#FFF6DE] p-6 shadow-md">
          <h2 className="text-2xl font-extrabold text-[#1b5e20]">Opening your menu...</h2>
          <p className="mt-2 text-sm text-[#5d4037]">Your customer dashboard is the full Indabest ordering experience.</p>
        </div>
      </main>
    </div>
  );
}
