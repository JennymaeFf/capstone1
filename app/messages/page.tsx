"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { useAuthProfile } from "@/components/use-auth-profile";
import {
  CONTACT_MESSAGE_MAX_LENGTH,
  getMyContactMessages,
  markMyContactRepliesSeen,
  replyToMyContactMessage,
  type ContactMessage,
} from "@/lib/supabase/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function MessagesPage() {
  const { isLoading, isLoggedIn, userId } = useAuthProfile();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState("");
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
      <SiteHeader />

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

