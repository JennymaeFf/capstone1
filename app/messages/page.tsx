"use client";

import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">
      <SiteHeader />

      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-36 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-md">
          <p className="mb-2 text-xs font-bold uppercase text-[#4f8a3b]">Messages</p>
          <h2 className="mb-3 text-3xl font-extrabold text-[#1b5e20]">Chat with Indabest Admin</h2>
          <p className="text-sm leading-relaxed text-[#5d4037]">
            Use the message button on the lower-right corner to open your chat list and conversation.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
