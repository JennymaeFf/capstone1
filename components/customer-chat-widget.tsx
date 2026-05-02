"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuthProfile } from "@/components/use-auth-profile";
import {
  CONTACT_MESSAGE_MAX_LENGTH,
  createContactMessage,
  getMyContactMessages,
  markMyContactRepliesSeen,
  type ContactMessage,
} from "@/lib/supabase/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ChatView = "list" | "chat";
type CustomerChatBubbleItem = {
  id: string;
  sender: "admin" | "customer";
  label: string;
  text: string;
  date: string;
};

const HIDDEN_PATH_PREFIXES = ["/admin", "/login", "/register", "/verify", "/verify-login", "/check-email"];

export default function CustomerChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isLoggedIn, userId, userName, userEmail } = useAuthProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ChatView>("list");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const customerThreadEndRef = useRef<HTMLDivElement>(null);

  const isHidden = HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages]
  );
  const timeline = useMemo(() => buildCustomerMessageTimeline(sortedMessages), [sortedMessages]);
  const latestMessage = timeline[timeline.length - 1];
  const unreadCount = sortedMessages.filter((message) => !message.customer_seen && (message.sender_role === "admin" || Boolean(message.admin_reply))).length;
  const preview = latestMessage ? shortenText(latestMessage.text, 52) : "Send us a message";

  const loadMessages = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      setIsLoadingMessages(true);
      setError("");
      setMessages(await getMyContactMessages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load messages.");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !userId || isHidden) return;

    void loadMessages();

    const supabase = getSupabaseBrowserClient();
    let channel: RealtimeChannel | null = supabase.channel(`customer-chat-widget-${userId}`);
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
  }, [isLoggedIn, userId, isHidden, loadMessages]);

  useEffect(() => {
    if (isOpen && view === "chat") {
      customerThreadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isOpen, view, timeline.length]);

  if (isHidden || isLoading) return null;

  const openWidget = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setIsOpen(true);
    setView("list");
    void loadMessages();
  };

  const openConversation = async () => {
    setView("chat");
    setError("");
    try {
      await markMyContactRepliesSeen();
      setMessages(await getMyContactMessages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open chat.");
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || isSending) return;

    try {
      setError("");
      setIsSending(true);
      await createContactMessage({
        name: userName || userEmail || "Customer",
        email: userEmail,
        message: text,
      });
      setDraft("");
      setMessages(await getMyContactMessages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[180] font-sans">
      {isOpen && (
        <div className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#d9e8cf] bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-[#174b21] px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{view === "chat" ? "Indabest Admin" : "Messages"}</p>
              <p className="text-xs text-[#d9f4c6]">{view === "chat" ? "Customer support" : "Indabest Crave Corner"}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/15"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {view === "list" ? (
            <div className="flex-1 overflow-y-auto bg-[#f6faef] p-3">
              <button
                onClick={() => void openConversation()}
                className="flex w-full items-start gap-3 rounded-xl border border-[#e4eddb] bg-white p-3 text-left shadow-sm transition hover:border-[#b8d7a8]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#246b2d] text-xs font-extrabold text-white">IA</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-extrabold text-[#174b21]">Indabest Admin</span>
                    {latestMessage && <span className="shrink-0 text-[11px] font-semibold text-[#8a7a70]">{formatShortDate(latestMessage.date)}</span>}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[#6f625a]">{preview}</span>
                </span>
                {unreadCount > 0 && <span className="mt-1 rounded-full bg-[#f57c00] px-2 py-0.5 text-[10px] font-bold text-white">{unreadCount}</span>}
              </button>
              {error && <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
              {isLoadingMessages && <p className="mt-3 text-center text-xs font-semibold text-[#6f625a]">Loading...</p>}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-[#eef3e8] bg-white px-3 py-2">
                <button
                  onClick={() => setView("list")}
                  className="rounded-lg border border-[#cbdcbe] px-3 py-1.5 text-xs font-bold text-[#174b21] transition hover:bg-[#edf5e5]"
                >
                  Back
                </button>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#246b2d] text-xs font-extrabold text-white">IA</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[#174b21]">Indabest Admin</p>
                  <p className="truncate text-xs text-[#6f625a]">Replies from the store team</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[#f6faef] px-3 py-4">
                {timeline.length === 0 ? (
                  <p className="rounded-xl bg-white px-3 py-3 text-sm text-[#6f625a] shadow-sm">Start a conversation with Indabest Admin.</p>
                ) : (
                  timeline.map((message) => (
                    <CustomerWidgetBubble
                      key={message.id}
                      align={message.sender === "customer" ? "right" : "left"}
                      label={message.label}
                      text={message.text}
                      date={message.date}
                    />
                  ))
                )}
                <div ref={customerThreadEndRef} />
              </div>

              <div className="border-t border-[#eef3e8] bg-white p-3">
                {error && <p className="mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={CONTACT_MESSAGE_MAX_LENGTH + 100}
                  placeholder="Write a message..."
                  className="h-20 w-full resize-none rounded-xl border border-[#c8e6c9] bg-[#fbfdf8] px-3 py-2 text-sm text-[#3f322b] outline-none focus:bg-white focus:ring-2 focus:ring-[#4caf50]"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className={`text-xs font-semibold ${draft.length > CONTACT_MESSAGE_MAX_LENGTH ? "text-red-600" : "text-[#7b7169]"}`}>
                    {draft.length}/{CONTACT_MESSAGE_MAX_LENGTH}
                  </span>
                  <button
                    onClick={() => void sendMessage()}
                    disabled={isSending || !draft.trim() || draft.length > CONTACT_MESSAGE_MAX_LENGTH}
                    className="rounded-xl bg-[#4caf50] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#388e3c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!isOpen && (
        <button
          onClick={openWidget}
          aria-label="Open messages"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#174b21] text-white shadow-xl transition hover:bg-[#246b2d]"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 0 1-8.7 8.3 9.3 9.3 0 0 1-3-.5L3 21l1.7-5.2A8 8 0 0 1 3 11.5a8.4 8.4 0 0 1 8.7-8.3 8.4 8.4 0 0 1 9.3 8.3Z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f57c00] px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function CustomerWidgetBubble({ align, label, text, date }: { align: "left" | "right"; label: string; text: string; date: string }) {
  const isRight = align === "right";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isRight ? "bg-[#246b2d] text-white" : "bg-white text-[#3f322b]"}`}>
        <p className={`mb-1 text-[11px] font-bold ${isRight ? "text-[#d9f4c6]" : "text-[#4f8a3b]"}`}>{label}</p>
        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        <p className={`mt-1 text-[10px] ${isRight ? "text-[#d9f4c6]" : "text-[#8a7a70]"}`}>{formatShortDate(date)}</p>
      </div>
    </div>
  );
}

function buildCustomerMessageTimeline(messages: ContactMessage[]): CustomerChatBubbleItem[] {
  return messages
    .flatMap((message) => {
      const isAdminMessage = message.sender_role === "admin";
      const items: CustomerChatBubbleItem[] = [{
        id: `${message.id}-${isAdminMessage ? "admin" : "customer"}-message`,
        sender: isAdminMessage ? "admin" : "customer",
        label: isAdminMessage ? "Admin" : "You",
        text: message.message,
        date: message.created_at,
      }];

      if (message.admin_reply) {
        items.push({
          id: `${message.id}-admin-reply`,
          sender: "admin",
          label: "Admin",
          text: message.admin_reply,
          date: message.replied_at ?? message.created_at,
        });
      }

      if (message.customer_reply) {
        items.push({
          id: `${message.id}-customer-reply`,
          sender: "customer",
          label: "You",
          text: message.customer_reply,
          date: message.customer_replied_at ?? message.created_at,
        });
      }

      return items;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function shortenText(text: string, maxLength: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
