"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { notifyAuthChange, useAuthProfile } from "@/components/use-auth-profile";
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
      <SiteHeader />

      <main className="flex-1 px-4 pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#FFF6DE] px-4 py-2 text-sm font-bold text-[#1b5e20] shadow-sm transition hover:bg-white"
          >
            <span aria-hidden="true">â†</span>
            Back
          </button>
        </div>

        <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-[#ffe082] bg-[#FFF6DE] p-6 text-center shadow-md">
            {avatarUrl ? (
              <div className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-[#DDF8B1] bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="Profile picture" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-[#1b5e20] text-4xl font-bold text-white shadow-sm">
                {(fullName || userEmail || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <h2 className="text-2xl font-extrabold text-[#1b5e20]">{fullName || "My Profile"}</h2>
            <p className="mt-1 break-words text-xs text-[#a1887f]">{userEmail}</p>
            <div className="mt-5 rounded-xl border border-[#ffe082] bg-white/70 px-4 py-3 text-left">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4caf50]">Account</p>
              <p className="mt-1 text-sm font-semibold text-[#5d4037]">Profile and delivery details</p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#ffe082] bg-[#FFF6DE] p-6 shadow-md">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-[#1b5e20]">Edit Profile</h2>
            <p className="text-xs text-[#a1887f]">Keep your delivery information updated.</p>
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
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

