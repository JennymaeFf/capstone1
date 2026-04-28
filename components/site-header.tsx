"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MessageNotificationBadge from "@/components/message-notification-badge";
import { signOutUser, useAuthProfile } from "@/components/use-auth-profile";

export default function SiteHeader() {
  const router = useRouter();
  const { isLoggedIn, userId, userName, userEmail, avatarUrl } = useAuthProfile();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLLIElement>(null);
  const displayName = userName || userEmail || "Profile";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    setShowProfile(false);
    router.push("/");
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-between border-b border-[#ffe082] bg-[#FFF6DE] px-6 py-5 shadow-sm md:px-16" style={{ backdropFilter: "none" }}>
      <Link href="/" className="flex items-center gap-5">
        <Image src="/logo.png" alt="INDABEST CRAVE CORNER Logo" width={150} height={150} className="object-contain" priority />
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
        {isLoggedIn && <li><Link href="/orders" className="hover:text-[#4caf50]">MY ORDERS</Link></li>}
        <li>
          <button
            onClick={() => router.push("/menu")}
            aria-label="Open cart"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDF8B1] text-[#1b5e20] transition hover:bg-[#c5e8a0]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
          </button>
        </li>

        {!isLoggedIn ? (
          <>
            <li><Link href="/login" className="font-semibold text-[#4caf50] hover:text-[#388e3c]">LOGIN</Link></li>
            <li>
              <Link
                href="/register"
                className="rounded-full bg-[#f57c00] px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-[#ef6c00]"
              >
                REGISTER
              </Link>
            </li>
          </>
        ) : (
          <li className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 rounded-full bg-[#DDF8B1] px-4 py-2 transition hover:bg-[#c5e8a0]"
            >
              {avatarUrl ? (
                <span className="relative h-7 w-7 overflow-hidden rounded-full bg-white">
                  <Image src={avatarUrl} alt={displayName} fill sizes="28px" className="object-cover" />
                </span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b5e20] text-xs font-bold text-white">
                  {initial}
                </span>
              )}
              <span className="max-w-[160px] truncate text-sm font-semibold text-[#1b5e20]">{displayName}</span>
            </button>

            {showProfile && (
              <div className="absolute right-0 z-[200] mt-2 w-44 rounded-xl border border-[#ffe082] bg-white py-2 shadow-lg">
                <p className="truncate border-b border-[#ffe082] px-4 py-2 text-xs text-[#a1887f]">{displayName}</p>
                <Link href="/profile" className="block px-4 py-2 text-sm text-[#5d4037] transition hover:bg-[#DDF8B1]">Profile</Link>
                <Link href="/orders" className="block px-4 py-2 text-sm text-[#5d4037] transition hover:bg-[#DDF8B1]">My Orders</Link>
                <Link href="/messages" className="flex items-center px-4 py-2 text-sm text-[#5d4037] transition hover:bg-[#DDF8B1]">
                  Messages
                  <MessageNotificationBadge userId={userId} />
                </Link>
                <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-500 transition hover:bg-red-50">
                  Log Out
                </button>
              </div>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}
