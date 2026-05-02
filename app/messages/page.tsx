"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const router = useRouter();
  const conversations = useMemo(() => {
    if (messages.length === 0) return [];

    const sortedMessages = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return [{
      id: "admin-support",
      name: "Indabest Admin",
      messages: sortedMessages,
      latest: sortedMessages[sortedMessages.length - 1],
      unreadCount: sortedMessages.filter((message) => message.admin_reply && !message.customer_seen).length,
    }];
  }, [messages]);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0];
  const replyTarget = [...(selectedConversation?.messages ?? [])].reverse().find((message) => message.admin_reply) ?? selectedConversation?.latest;

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
          <div className="grid overflow-hidden rounded-2xl bg-white shadow-md lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="border-b border-[#eef3e8] lg:border-b-0 lg:border-r">
              <div className="border-b border-[#eef3e8] px-4 py-3">
                <p className="text-xs font-bold uppercase text-[#4f8a3b]">Chats</p>
              </div>
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={async () => {
                    setSelectedConversationId(conversation.id);
                    await markMyContactRepliesSeen();
                    setMessages(await getMyContactMessages());
                  }}
                  className={`flex w-full items-start gap-3 border-b border-[#f0f4eb] px-4 py-3 text-left transition ${
                    selectedConversation?.id === conversation.id ? "bg-[#edf5e5]" : "bg-white hover:bg-[#f8fbf4]"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1b5e20] text-sm font-extrabold text-white">IA</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-extrabold text-[#1b5e20]">{conversation.name}</span>
                      <span className="shrink-0 text-[11px] font-semibold text-[#8a7a70]">{formatShortDate(conversation.latest.created_at)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#6f625a]">{getCustomerPreview(conversation.latest)}</span>
                  </span>
                  {conversation.unreadCount > 0 && <span className="mt-1 rounded-full bg-[#f57c00] px-1.5 py-0.5 text-[10px] font-bold text-white">{conversation.unreadCount}</span>}
                </button>
              ))}
            </div>

            <div className="flex min-h-[560px] flex-col bg-[#f6faef]">
              {selectedConversation && replyTarget ? (
                <>
                  <div className="border-b border-[#eef3e8] bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b5e20] text-sm font-extrabold text-white">IA</span>
                      <div>
                        <p className="text-sm font-extrabold text-[#1b5e20]">Indabest Admin</p>
                        <p className="text-xs text-[#6f625a]">Customer support</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {selectedConversation.messages.map((message) => (
                      <div key={message.id} className="space-y-2">
                        <MessageBubble align="right" label="You" text={message.message} date={message.created_at} />
                        {message.admin_reply && <MessageBubble align="left" label="Admin" text={message.admin_reply} date={message.replied_at ?? message.created_at} />}
                        {message.customer_reply && <MessageBubble align="right" label="You" text={message.customer_reply} date={message.customer_replied_at ?? message.created_at} />}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#eef3e8] bg-white p-3">
                    {replyTarget.admin_reply ? (
                      <>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <label className="text-xs font-bold uppercase text-[#4f8a3b]">Reply</label>
                          <span className={`text-xs font-semibold ${(replyDrafts[replyTarget.id] ?? "").length > CONTACT_MESSAGE_MAX_LENGTH ? "text-red-600" : "text-[#7b7169]"}`}>
                            {(replyDrafts[replyTarget.id] ?? "").length}/{CONTACT_MESSAGE_MAX_LENGTH}
                          </span>
                        </div>
                        <textarea
                          value={replyDrafts[replyTarget.id] ?? ""}
                          onChange={(event) => setReplyDrafts((previous) => ({ ...previous, [replyTarget.id]: event.target.value }))}
                          maxLength={CONTACT_MESSAGE_MAX_LENGTH + 100}
                          placeholder="Write a reply..."
                          className="h-20 w-full resize-none rounded-xl border border-[#c8e6c9] bg-[#fbfdf8] px-3 py-2 text-sm text-[#5d4037] outline-none focus:bg-white focus:ring-2 focus:ring-[#4caf50]"
                        />
                        <button
                          onClick={() => void sendReply(replyTarget.id)}
                          disabled={sendingReplyId === replyTarget.id || !replyDrafts[replyTarget.id]?.trim() || (replyDrafts[replyTarget.id] ?? "").length > CONTACT_MESSAGE_MAX_LENGTH}
                          className="mt-2 rounded-xl bg-[#4caf50] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#388e3c] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {sendingReplyId === replyTarget.id ? "Sending..." : "Send"}
                        </button>
                      </>
                    ) : (
                      <p className="rounded-xl bg-[#fff8e8] px-3 py-3 text-sm font-semibold text-[#8a5a24]">Admin has not replied yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center px-4 text-sm text-[#7b7169]">Select a conversation.</div>
              )}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function MessageBubble({ align, label, text, date }: { align: "left" | "right"; label: string; text: string; date: string }) {
  const isRight = align === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isRight ? "bg-[#4caf50] text-white" : "bg-white text-[#3f322b]"}`}>
        <p className={`mb-1 text-[11px] font-bold ${isRight ? "text-[#edf8e6]" : "text-[#4f8a3b]"}`}>{label}</p>
        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        <p className={`mt-1 text-[10px] ${isRight ? "text-[#edf8e6]" : "text-[#8a7a70]"}`}>{formatShortDate(date)}</p>
      </div>
    </div>
  );
}

function getCustomerPreview(message: ContactMessage) {
  return message.customer_reply || message.admin_reply || message.message;
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

