"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SiteFooter from "@/components/site-footer";
import { notifyAuthChange, useAuthProfile } from "@/components/use-auth-profile";

type OrderItem = { name: string; image: string; quantity: number; size?: string; finalPrice: number };
type Order = { id: string; date: string; items: OrderItem[]; total: number; status: string; customer?: { name: string; phone: string; address: string; payment: string } };

export default function OrdersPage() {
  const [orders] = useState<Order[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("orders");
    return saved ? JSON.parse(saved) : [];
  });
  const { isLoggedIn, userName } = useAuthProfile();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLLIElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.push("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    notifyAuthChange();
    setShowProfile(false);
    router.push("/");
  };

  const statusColor: Record<string, string> = {
    Preparing: "bg-[#fff3e0] text-[#f57c00]",
    "On the way": "bg-[#e3f2fd] text-[#1565c0]",
    Delivered: "bg-[#DDF8B1] text-[#1b5e20]",
    Cancelled: "bg-red-50 text-red-500",
  };

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-sm" style={{ backdropFilter: "none" }}>
        <div className="flex items-center gap-5">
          <Image src="/logo.png" alt="Logo" width={150} height={150} className="object-contain" />
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
          <li>
            <button onClick={() => router.push("/menu")} className="relative">
              <span className="text-2xl">🛒</span>
            </button>
          </li>
          {!isLoggedIn ? (
            <li><Link href="/login" className="font-semibold text-[#4caf50] hover:text-[#388e3c]">LOGIN</Link></li>
          ) : (
            <li className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 bg-[#DDF8B1] hover:bg-[#c5e8a0] px-4 py-2 rounded-full transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#1b5e20] flex items-center justify-center text-white text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-[#1b5e20]">{userName}</span>
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#ffe082] rounded-xl shadow-lg py-2 z-[200]">
                  <p className="px-4 py-2 text-xs text-[#a1887f] border-b border-[#ffe082]">{userName}</p>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-[#5d4037] hover:bg-[#DDF8B1] transition">Profile</Link>
                  <Link href="/orders" className="block px-4 py-2 text-sm text-[#5d4037] hover:bg-[#DDF8B1] transition">My Orders</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition">Log Out</button>
                </div>
              )}
            </li>
          )}
        </ul>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-36 pb-16">
        <h2 className="text-3xl font-bold text-[#1b5e20] mb-2">My Orders</h2>
        <p className="text-sm text-[#a1887f] mb-8">Track all your past and current orders</p>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <div className="text-5xl mb-4">🛍️</div>
            <p className="text-[#5d4037] font-semibold text-lg mb-1">No orders yet</p>
            <p className="text-[#a1887f] text-sm mb-6">Go to the menu and place your first order!</p>
            <Link href="/menu">
              <button className="bg-[#4caf50] hover:bg-[#388e3c] text-white font-semibold px-8 py-3 rounded-xl transition">
                Order Now
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {[...orders].reverse().map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-[#5d4037]">Order #{order.id}</p>
                    <p className="text-xs text-[#a1887f]">{order.date}</p>
                    {order.customer && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-[#5d4037]">👤 {order.customer.name} · {order.customer.phone}</p>
                        <p className="text-xs text-[#a1887f]">📍 {order.customer.address}</p>
                        <p className="text-xs text-[#a1887f]">💳 {order.customer.payment}</p>
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {order.status}
                  </span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="relative w-12 h-12 flex-shrink-0 bg-[#f8fafc] rounded-lg overflow-hidden">
                        <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#5d4037]">
                          {item.name}
                          {item.size && <span className="ml-1 text-xs text-[#4caf50] font-bold">({item.size})</span>}
                        </p>
                        <p className="text-xs text-[#a1887f]">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-[#2e7d32]">P{(item.finalPrice * item.quantity).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center px-5 py-4 bg-[#f8fafc] border-t border-gray-100">
                  <span className="text-xs text-[#a1887f]">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="text-sm font-bold text-[#1b5e20]">Total: P{order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
