"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteFooter from "@/components/site-footer";
import { notifyAuthChange, signOutUser, useAuthProfile } from "@/components/use-auth-profile";
import { getMyProfile, uploadProfilePicture, upsertMyProfile } from "@/lib/supabase/data";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoading, isLoggedIn, userEmail, userName } = useAuthProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadProfile = async () => {
      try {
        setError("");
        const profile = await getMyProfile();
        setFullName(profile?.full_name ?? userName ?? "");
        setPhone(profile?.phone ?? "");
        setAddress(profile?.address ?? "");
        setAvatarUrl(profile?.avatar_url ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load your profile.");
      }
    };

    void loadProfile();
  }, [isLoggedIn, userName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await upsertMyProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatar_url: avatarUrl || null,
      });
      notifyAuthChange();
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    router.push("/");
  };

  const handleAvatarUpload = async (file: File | undefined) => {
    if (!file) return;

    try {
      setError("");
      setMessage("");
      setUploadingAvatar(true);
      const uploadedUrl = await uploadProfilePicture(file);
      setAvatarUrl(uploadedUrl);
      await upsertMyProfile({ avatar_url: uploadedUrl });
      notifyAuthChange();
      setMessage("Profile picture updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload profile picture.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#FFF6DE] px-6 md:px-16 py-5 flex justify-between items-center border-b border-[#ffe082] shadow-sm">
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
          <li><Link href="/orders" className="hover:text-[#4caf50]">MY ORDERS</Link></li>
          <li><button onClick={handleLogout} className="font-semibold text-red-500 hover:text-red-600">LOG OUT</button></li>
        </ul>
      </nav>

      <main className="flex-1 px-4 pt-36 pb-12 md:pt-44">
        <div className="mx-auto max-w-lg rounded-xl border border-[#ffe082] bg-[#FFF6DE] p-6 shadow-md">
          <div className="mb-5 text-center">
            {avatarUrl ? (
              <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-[#DDF8B1] bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="Profile picture" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#1b5e20] text-2xl font-bold text-white">
                {(fullName || userEmail || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="text-xl font-extrabold text-[#1b5e20]">My Profile</h2>
            <p className="text-xs text-[#a1887f]">{userEmail}</p>
          </div>

          {error && <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-500">{error}</p>}
          {message && <p className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-center text-xs text-green-600">{message}</p>}

          <form onSubmit={handleSave} className="space-y-3">
            <label className="block text-xs font-semibold text-[#5d4037]">
              Profile Picture
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingAvatar}
                onChange={(event) => {
                  void handleAvatarUpload(event.target.files?.[0]);
                  event.target.value = "";
                }}
                className="mt-1 block w-full text-sm text-[#5d4037] file:mr-3 file:rounded-lg file:border-0 file:bg-[#4caf50] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#388e3c] disabled:opacity-60"
              />
              <span className="mt-1 block text-[11px] font-normal text-[#a1887f]">
                JPG, PNG, or WebP under 3MB.
              </span>
            </label>
            <label className="block text-xs font-semibold text-[#5d4037]">
              Full Name
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 text-sm text-[#5d4037] outline-none focus:ring-2 focus:ring-[#4caf50]"
                required
              />
            </label>
            <label className="block text-xs font-semibold text-[#5d4037]">
              Phone Number
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXXX"
                className="mt-1 w-full rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 text-sm text-[#5d4037] outline-none focus:ring-2 focus:ring-[#4caf50]"
              />
            </label>
            <label className="block text-xs font-semibold text-[#5d4037]">
              Address
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Delivery address"
                className="mt-1 w-full resize-none rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 text-sm text-[#5d4037] outline-none focus:ring-2 focus:ring-[#4caf50]"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[#4caf50] py-2 text-sm font-bold text-white transition hover:bg-[#388e3c] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
