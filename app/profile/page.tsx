"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SiteFooter from "@/components/site-footer";

type ProfileInfo = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileInfo>(() => {
    if (typeof window === "undefined") return { name: "", email: "", phone: "", address: "" };
    const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo") || "{}") as Partial<ProfileInfo>;
    return {
      name: localStorage.getItem("userName") || checkoutInfo.name || "",
      email: localStorage.getItem("userEmail") || checkoutInfo.email || "",
      phone: checkoutInfo.phone || "",
      address: checkoutInfo.address || "",
    };
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      router.push("/login");
    }
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const previousEmail = localStorage.getItem("userEmail");

    localStorage.setItem("userName", profile.name);
    localStorage.setItem("userEmail", profile.email);

    const checkoutInfo = JSON.parse(localStorage.getItem("checkoutInfo") || "{}");
    localStorage.setItem(
      "checkoutInfo",
      JSON.stringify({
        ...checkoutInfo,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
      })
    );

    const users = JSON.parse(localStorage.getItem("users") || "[]") as { name: string; email: string; password: string }[];
    const updatedUsers = users.map((user) =>
      user.email === previousEmail ? { ...user, name: profile.name, email: profile.email } : user
    );
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    router.push("/orders");
  };

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-sm" style={{backdropFilter: "none"}}>
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
          <li><Link href="/orders" className="hover:text-[#4caf50]">MY ORDERS</Link></li>
        </ul>
      </nav>

      <main className="px-6 pt-32 pb-12 md:px-16 md:pt-40">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#ffe082] bg-[#FFF6DE] p-6 shadow-lg md:p-8">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#c8e6c9] bg-white px-4 py-2 text-sm font-semibold text-[#1b5e20] transition hover:bg-[#f1f8e9] focus:outline-none focus:ring-2 focus:ring-[#4caf50] focus:ring-offset-2 focus:ring-offset-[#FFF6DE]"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>

          <div className="mb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#4caf50]">Profile</p>
            <h2 className="mt-2 text-3xl font-bold text-[#1b5e20] md:text-4xl">Your Personal Information</h2>
            <p className="mt-2 text-sm text-[#6d4c41]">
              Update your details here so checkout can be faster next time.
            </p>
          </div>

          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#5d4037]">Full Name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 text-sm text-[#5d4037] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#5d4037]">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 text-sm text-[#5d4037] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#5d4037]">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. 09XXXXXXXXX"
                className="w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 text-sm text-[#5d4037] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#5d4037]">Delivery Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                placeholder="e.g. Blk 1 Lot 2, Street, Barangay, City"
                rows={3}
                className="w-full resize-none rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 text-sm text-[#5d4037] focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-xl bg-[#4caf50] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#388e3c]"
            >
              Save Profile
            </button>

            {saved && <p className="text-center text-sm font-semibold text-[#1b5e20]">Profile saved successfully.</p>}
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
