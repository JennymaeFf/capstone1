"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import SiteFooter from "@/components/site-footer";
import MessageNotificationBadge from "@/components/message-notification-badge";
import { signOutUser, useAuthProfile } from "@/components/use-auth-profile";
import { getMyOrders } from "@/lib/supabase/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type OrderItem = {
  name: string;
  image: string;
  quantity: number;
  size?: string;
  finalPrice: number;
  addons?: { name: string; quantity: number; priceDelta: number }[];
};
type Order = {
  id: string;
  date: string;
  updatedAt: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  deliveryOption: string;
  customer?: {
    name: string;
    phone: string;
    address: string;
    payment: string;
    selectedBank?: string;
    paymentReference?: string;
    paymentProofUrl?: string;
  };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const { isLoading, isLoggedIn, userId, userName } = useAuthProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLLIElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push("/login");
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const loadOrders = async () => {
      try {
        setIsRefreshing(true);
        setError("");
        setOrders(await getMyOrders());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load orders.");
      } finally {
        setIsRefreshing(false);
      }
    };

    void loadOrders();

    const supabase = getSupabaseBrowserClient();
    let ordersChannel: RealtimeChannel | null = supabase.channel(`customer-orders-${userId}`);
    ordersChannel
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}` }, () => {
        void loadOrders();
      })
      .subscribe();

    return () => {
      if (ordersChannel) {
        void supabase.removeChannel(ordersChannel);
        ordersChannel = null;
      }
    };
  }, [isLoggedIn, userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
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

  const statusColor: Record<string, string> = {
    Pending: "bg-[#fffde7] text-[#8a6d00]",
    Preparing: "bg-[#fff3e0] text-[#f57c00]",
    Completed: "bg-[#DDF8B1] text-[#1b5e20]",
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
                  <Link href="/messages" className="flex items-center px-4 py-2 text-sm text-[#5d4037] transition hover:bg-[#DDF8B1]">
                    Messages
                    <MessageNotificationBadge userId={userId} />
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition">Log Out</button>
                </div>
              )}
            </li>
          )}
        </ul>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-36 pb-16">
        <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold text-[#1b5e20] mb-2">My Orders</h2>
            <p className="text-sm text-[#a1887f]">Track all your past and current orders</p>
          </div>
          <button
            onClick={async () => {
              try {
                setIsRefreshing(true);
                setError("");
                setOrders(await getMyOrders());
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to refresh orders.");
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="w-fit rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#1b5e20] shadow-sm transition hover:bg-[#FFF6DE]"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

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
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-[#5d4037]">Order #{order.id}</p>
                    <p className="text-xs text-[#a1887f]">Placed {order.date} · Updated {order.updatedAt}</p>
                    <p className="mt-1 text-xs font-semibold text-[#1b5e20]">{getStatusMessage(order.status, order.deliveryOption)}</p>
                    {order.customer && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-[#5d4037]">👤 {order.customer.name} · {order.customer.phone}</p>
                        <p className="text-xs text-[#a1887f]">📍 {order.customer.address}</p>
                        <p className="text-xs text-[#a1887f]">💳 {order.customer.payment} · {order.deliveryOption}</p>
                        {order.customer.paymentProofUrl && (
                          <a href={order.customer.paymentProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#1b5e20] hover:underline">
                            View payment proof
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {order.status}
                  </span>
                </div>
                <OrderProgress status={order.status} deliveryOption={order.deliveryOption} />
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
                        {(item.addons ?? []).length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.addons?.map((addon, addonIndex) => (
                              <p key={`${addon.name}-${addonIndex}`} className="text-[11px] text-[#a1887f]">
                                + {addon.name} x{addon.quantity}
                                {addon.priceDelta > 0 ? ` · P${(addon.priceDelta * addon.quantity).toFixed(2)}` : ""}
                              </p>
                            ))}
                          </div>
                        )}
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

function getStatusMessage(status: string, deliveryOption: string) {
  if (status === "Pending") return "Your order was received and is waiting for confirmation.";
  if (status === "Preparing") return "Your food is being prepared.";
  if (status === "On the way") return deliveryOption === "Pickup" ? "Your order is almost ready for pickup." : "Your order is on the way.";
  if (status === "Delivered") return deliveryOption === "Pickup" ? "Your order has been picked up." : "Your order has been delivered.";
  if (status === "Completed") return "Your order is complete.";
  if (status === "Cancelled") return "This order was cancelled.";
  return "Order status updated.";
}

function OrderProgress({ status, deliveryOption }: { status: string; deliveryOption: string }) {
  const steps = deliveryOption === "Pickup" ? ["Pending", "Preparing", "Ready", "Completed"] : ["Pending", "Preparing", "On the way", "Delivered"];
  const normalizedStatus = status === "Completed" && deliveryOption !== "Pickup" ? "Delivered" : status === "On the way" && deliveryOption === "Pickup" ? "Ready" : status;
  const activeIndex = normalizedStatus === "Completed" ? steps.length - 1 : steps.indexOf(normalizedStatus);
  const isCancelled = status === "Cancelled";

  return (
    <div className="border-b border-gray-100 bg-[#fffef8] px-5 py-4">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, index) => {
          const isActive = !isCancelled && index <= activeIndex;
          return (
            <div key={step} className="min-w-0">
              <div className={`h-2 rounded-full ${isActive ? "bg-[#4caf50]" : "bg-[#e8eadf]"}`} />
              <p className={`mt-2 truncate text-[11px] font-bold ${isActive ? "text-[#1b5e20]" : "text-[#a1887f]"}`}>{step}</p>
            </div>
          );
        })}
      </div>
      {isCancelled && <p className="mt-3 text-xs font-semibold text-red-500">This order was cancelled.</p>}
    </div>
  );
}
