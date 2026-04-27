"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import SiteFooter from "@/components/site-footer";
import MessageNotificationBadge from "@/components/message-notification-badge";
import { signOutUser, useAuthProfile } from "@/components/use-auth-profile";
import {
  CONTACT_MESSAGE_MAX_LENGTH,
  getMyContactMessages,
  markMyContactRepliesSeen,
  replyToMyContactMessage,
  type ContactMessage,
} from "@/lib/supabase/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function MessagesPage() {
  const { isLoading, isLoggedIn, userId, userName } = useAuthProfile();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState("");
  const profileRef = useRef<HTMLLIElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.push("/login");
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const loadMessages = async () => {
      try {
        setIsRefreshing(true);
        setError("");
        setMessages(await getMyContactMessages());
        await markMyContactRepliesSeen();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load messages.");
      } finally {
        setIsRefreshing(false);
      }
    };

    void loadMessages();

    const supabase = getSupabaseBrowserClient();
    let channel: RealtimeChannel | null = supabase.channel(`customer-messages-${userId}`);
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages", filter: `user_id=eq.${userId}` }, () => {
        void loadMessages();
      })
      .subscribe();

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [isLoggedIn, userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    setShowProfile(false);
    router.push("/");
  };

  const sendReply = async (messageId: string) => {
    try {
      setError("");
      setSendingReplyId(messageId);
      await replyToMyContactMessage(messageId, replyDrafts[messageId] ?? "");
      setReplyDrafts((previous) => ({ ...previous, [messageId]: "" }));
      setMessages(await getMyContactMessages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reply.");
    } finally {
      setSendingReplyId("");
    }
  };

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">
      <nav className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-between border-b border-[#ffe082] bg-[#FFF6DE] px-6 py-5 shadow-sm md:px-16">
        <div className="flex items-center gap-5">
          <Image src="/logo.png" alt="INDABEST CRAVE CORNER Logo" width={150} height={150} className="object-contain" />
          <div>
            <h1 className="text-lg font-bold tracking-wide text-[#5d4037] md:text-xl">INDABEST CRAVE CORNER</h1>
            <p className="-mt-1 text-xs text-[#a1887f]">We got your cravings covered!</p>
          </div>
        </div>
        <ul className="hidden items-center gap-6 text-xs font-medium text-[#5d4037] md:flex">
          <li><Link href="/" className="hover:text-[#4caf50]">HOME</Link></li>
          <li><Link href="/menu" className="hover:text-[#4caf50]">MENU</Link></li>
          <li><Link href="/story" className="hover:text-[#4caf50]">OUR STORY</Link></li>
          <li><Link href="/contact" className="hover:text-[#4caf50]">CONTACT US</Link></li>
          <li><Link href="/orders" className="hover:text-[#4caf50]">MY ORDERS</Link></li>
          <li>
            <button onClick={() => router.push("/menu")} className="relative">
              <span className="text-2xl">🛒</span>
            </button>
          </li>
          <li className="relative" ref={profileRef}>
            <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 rounded-full bg-[#DDF8B1] px-4 py-2 transition hover:bg-[#c5e8a0]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b5e20] text-xs font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-[#1b5e20]">{userName}</span>
            </button>
            {showProfile && (
              <div className="absolute right-0 z-[200] mt-2 w-48 rounded-xl border border-[#ffe082] bg-white py-2 shadow-lg">
                <p className="border-b border-[#ffe082] px-4 py-2 text-xs text-[#a1887f]">{userName}</p>
                <Link href="/profile" className="block px-4 py-2 text-sm text-[#5d4037] transition hover:bg-[#DDF8B1]">Profile</Link>
                <Link href="/orders" className="block px-4 py-2 text-sm text-[#5d4037] transition hover:bg-[#DDF8B1]">My Orders</Link>
                <Link href="/messages" className="flex items-center px-4 py-2 text-sm text-[#5d4037] transition hover:bg-[#DDF8B1]">
                  Messages
                  <MessageNotificationBadge userId={userId} />
                </Link>
                <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-500 transition hover:bg-red-50">Log Out</button>
              </div>
            )}
          </li>
        </ul>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pb-16 pt-36">
        <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-[#1b5e20]">Messages</h2>
            <p className="text-sm text-[#5d4037]">See your Contact Us messages and admin replies.</p>
          </div>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              setError("");
              try {
                setMessages(await getMyContactMessages());
                await markMyContactRepliesSeen();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to refresh messages.");
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

        {messages.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <p className="mb-1 text-lg font-semibold text-[#5d4037]">No messages yet</p>
            <p className="mb-6 text-sm text-[#a1887f]">Send a message from Contact Us and replies will appear here.</p>
            <Link href="/contact" className="inline-flex rounded-xl bg-[#4caf50] px-6 py-3 font-semibold text-white transition hover:bg-[#388e3c]">Contact Us</Link>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((message) => (
              <article key={message.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">
                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-[#5d4037]">{new Date(message.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${message.admin_reply ? "bg-[#DDF8B1] text-[#1b5e20]" : "bg-[#fff3e0] text-[#f57c00]"}`}>
                      {message.admin_reply ? "Replied" : "Waiting"}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-[#5d4037]">{message.message}</p>
                </div>
                <div className="bg-[#fffef8] px-5 py-4">
                  <p className="mb-2 text-xs font-bold uppercase text-[#4f8a3b]">Admin Reply</p>
                  {message.admin_reply ? (
                    <p className="whitespace-pre-wrap text-sm text-[#3f322b]">{message.admin_reply}</p>
                  ) : (
                    <p className="text-sm text-[#a1887f]">No reply yet.</p>
                  )}

                  {message.customer_reply && (
                    <div className="mt-4 rounded-xl border border-[#c8e6c9] bg-white px-3 py-2">
                      <p className="mb-1 text-xs font-bold uppercase text-[#4f8a3b]">Your Latest Reply</p>
                      <p className="whitespace-pre-wrap text-sm text-[#5d4037]">{message.customer_reply}</p>
                    </div>
                  )}

                  {message.admin_reply && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <label className="text-xs font-bold uppercase text-[#4f8a3b]">Reply Back</label>
                        <span className={`text-xs font-semibold ${(replyDrafts[message.id] ?? "").length > CONTACT_MESSAGE_MAX_LENGTH ? "text-red-600" : "text-[#7b7169]"}`}>
                          {(replyDrafts[message.id] ?? "").length}/{CONTACT_MESSAGE_MAX_LENGTH}
                        </span>
                      </div>
                      <textarea
                        value={replyDrafts[message.id] ?? ""}
                        onChange={(event) => setReplyDrafts((previous) => ({ ...previous, [message.id]: event.target.value }))}
                        maxLength={CONTACT_MESSAGE_MAX_LENGTH + 100}
                        className="h-24 w-full resize-none rounded-xl border border-[#c8e6c9] bg-white px-3 py-2 text-sm text-[#5d4037] outline-none focus:ring-2 focus:ring-[#4caf50]"
                      />
                      <button
                        onClick={() => void sendReply(message.id)}
                        disabled={sendingReplyId === message.id || !replyDrafts[message.id]?.trim() || (replyDrafts[message.id] ?? "").length > CONTACT_MESSAGE_MAX_LENGTH}
                        className="mt-2 rounded-xl bg-[#4caf50] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#388e3c] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingReplyId === message.id ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
