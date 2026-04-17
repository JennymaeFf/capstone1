"use client";

import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import FoodImageCarousel from "@/components/food-image-carousel";
import { useAuthProfile } from "@/components/use-auth-profile";

export default function ContactPage() {
  const { isLoggedIn, userName } = useAuthProfile();

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">

      {/* FIXED HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-sm">
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
          {isLoggedIn && <li><Link href="/orders" className="hover:text-[#4caf50]">MY ORDERS</Link></li>}

          {/* LOGIN or PROFILE */}
          {!isLoggedIn ? (
            <li>
              <Link href="/login" className="font-semibold text-[#4caf50] hover:text-[#388e3c]">LOGIN</Link>
            </li>
          ) : (
            <li className="flex items-center gap-2 bg-[#DDF8B1] px-4 py-2 rounded-full">
              <div className="w-7 h-7 rounded-full bg-[#1b5e20] flex items-center justify-center text-white text-xs font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-[#1b5e20]">{userName}</span>
            </li>
          )}
        </ul>
      </nav>

      <main className="bg-[#DDF8B1] px-6 pb-10 pt-28 md:px-16 md:pb-12 md:pt-32">
        <div className="max-w-7xl mx-auto">

          <h1 className="mb-6 text-center text-4xl font-bold text-[#1b5e20] md:text-5xl lg:text-left">Get In Touch</h1>

          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-center lg:gap-10">

            {/* FORM */}
            <form className="w-full max-w-md space-y-4 md:w-1/2">
              <div className="flex flex-col">
                <label className="mb-1.5 text-sm font-semibold text-[#5d4037]">Name:</label>
                <input type="text" className="h-11 w-full rounded-lg border border-[#c8e6c9] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1.5 text-sm font-semibold text-[#5d4037]">Email:</label>
                <input type="email" className="h-11 w-full rounded-lg border border-[#c8e6c9] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1.5 text-sm font-semibold text-[#5d4037]">Message:</label>
                <textarea className="h-28 w-full resize-none rounded-lg border border-[#c8e6c9] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"></textarea>
              </div>
              <button type="submit" className="rounded-lg bg-[#4caf50] px-8 py-2.5 font-semibold text-white transition hover:bg-[#388e3c]">
                Send
              </button>
            </form>

            {/* FOOD IMAGES */}
            <div className="flex w-full justify-center md:w-1/2 md:justify-end">
              <FoodImageCarousel />
            </div>

          </div>
        </div>
      </main>

      <SiteFooter />

    </div>
  );
}
