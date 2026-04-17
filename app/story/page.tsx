"use client";

import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import { useAuthProfile } from "@/components/use-auth-profile";

export default function StoryPage() {
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

      {/* OUR STORY SECTION */}
      <section className="bg-[#DDF8B1] px-6 pb-16 pt-32 md:px-16 md:pb-24 md:pt-40">
        <div className="mx-auto grid max-w-7xl items-center gap-10 rounded-3xl border border-[#cdeba2] bg-[#FFF6DE]/80 p-6 shadow-lg md:p-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 text-center lg:order-1 lg:text-left">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[#4caf50]">Our Story</p>
            <h2 className="mb-5 text-4xl font-bold leading-tight text-[#1b5e20] md:text-5xl">
              A family working together, one craving at a time.
            </h2>
            <p className="mb-5 text-base leading-relaxed text-[#5d4037] md:text-lg">
              IndaBest Crave Corner is a family-owned business built with love, teamwork, and a shared dream.
              Every day, the family works together to prepare good food, welcome customers, and keep improving
              the small business they are proud to call their own.
            </p>
            <p className="text-base leading-relaxed text-[#6d4c41] md:text-lg">
              From serving refreshing drinks to favorite comfort foods, their goal is simple: to make every
              customer feel at home and satisfied. For this family, IndaBest is more than a store. It is a
              place where hard work, care, and community come together.
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border-8 border-white bg-[#DDF8B1] shadow-2xl">
              <Image
                src="/indab.png"
                alt="Owner of IndaBest Crave Corner"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

