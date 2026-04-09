"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const bestSellers = [
  { name: "Indabest Burger", price: "P89.00", image: "/burgers.png" },
  { name: "Indabest Fries", price: "P30.00", image: "/frenchfries.png" },
  { name: "Blueberry Lemonade", price: "P39.00", image: "/blueberry.png" },
  { name: "Hawaiian Pizza", price: "P120.00", image: "/hawaiianpizza.png" },
  { name: "Coke Float", price: "P49.00", image: "/cokefloat.png" },
  { name: "Asado Siopao", price: "P45.00", image: "/asado.png" },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    setUserName(localStorage.getItem("userName") || localStorage.getItem("userEmail") || "");
  }, []);

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">

      {/* FIXED HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-md">
        <div className="flex items-center gap-5">
          <Image src="/logo.png" alt="INDABEST CRAVE CORNER Logo" width={150} height={150} className="object-contain" />
          <div>
            <h1 className="text-[#5d4037] text-lg md:text-xl font-bold tracking-wide">INDABEST CRAVE CORNER</h1>
            <p className="text-[#a1887f] text-xs -mt-1">We got your cravings covered!</p>
          </div>
        </div>

        <ul className="hidden md:flex gap-10 text-[#5d4037] text-base font-medium items-center">
          <li><Link href="/" className="hover:text-[#4caf50]">HOME</Link></li>
          <li><Link href="/menu" className="hover:text-[#4caf50]">MENU</Link></li>
          <li><Link href="/story" className="hover:text-[#4caf50]">OUR STORY</Link></li>
          <li><Link href="/contact" className="hover:text-[#4caf50]">CONTACT US</Link></li>
          
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

      {/* HERO SECTION */}
      <section className="pt-32 md:pt-40 pb-20 md:pb-28 px-6 md:px-16 bg-[#DDF8B1]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="md:w-1/2 text-left">
            <h2 className="text-4xl md:text-6xl font-bold text-[#1b5e20] leading-tight mb-12">
              Enjoy rich flavor<br className="hidden md:block" /> and freshness
            </h2>
            <div className="flex flex-wrap gap-6">
              <Link href="/menu">
                <button className="bg-[#4caf50] hover:bg-[#388e3c] text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-md transition">
                  Discover the Drinks
                </button>
              </Link>
              <Link href="/menu">
                <button className="bg-[#f57c00] hover:bg-[#ef6c00] text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-md transition">
                  Order Now
                </button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-end">
            <div className="flex gap-6">
              <Image src="/fries.png" alt="Fries" width={260} height={220} className="object-contain drop-shadow-lg" />
              <Image src="/burger.png" alt="Burger" width={300} height={240} className="object-contain drop-shadow-2xl" priority />
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="px-6 md:px-16 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-[#1b5e20] mb-3">Best Sellers</h3>
            <p className="text-[#5d4037] text-lg">Our most loved and frequently ordered items</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {bestSellers.map((item, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
                <div className="relative h-56 bg-[#f8fafc] flex items-center justify-center p-4">
                  <Image src={item.image} alt={item.name} fill className="object-contain" />
                </div>
                <div className="p-5 text-center">
                  <h4 className="text-lg font-semibold text-[#5d4037] mb-1">{item.name}</h4>
                  <p className="text-[#2e7d32] font-bold text-xl mb-5">{item.price}</p>
                  <Link href="/menu">
                    <button className="w-full bg-[#DDF8B1] hover:bg-[#c2e8a3] text-[#1b5e20] font-semibold py-3 rounded-xl transition">
                      Order Now
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#FFF6DE] py-8 text-center text-[#6d4c41] text-sm border-t border-[#ffe082]">
        EST 2024 • INDABEST CRAVE CORNER
      </footer>

    </div>
  );
}
