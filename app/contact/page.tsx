"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import FoodImageCarousel from "@/components/food-image-carousel";
import { useAuthProfile } from "@/components/use-auth-profile";
import { CONTACT_MESSAGE_COOLDOWN_SECONDS, CONTACT_MESSAGE_MAX_LENGTH, createContactMessage } from "@/lib/supabase/data";

export default function ContactPage() {
  const { isLoggedIn, userName, userEmail } = useAuthProfile();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      setForm((previous) => ({
        ...previous,
        name: previous.name || userName || "",
        email: previous.email || userEmail || "",
      }));
    }
  }, [isLoggedIn, userName, userEmail]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (form.message.trim().length > CONTACT_MESSAGE_MAX_LENGTH) {
      setError(`Message is too long. Please keep it under ${CONTACT_MESSAGE_MAX_LENGTH} characters.`);
      return;
    }

    try {
      setIsSending(true);
      await createContactMessage(form);
      setStatusMessage(`Message sent. You can send another message after ${CONTACT_MESSAGE_COOLDOWN_SECONDS} seconds.`);
      setForm((previous) => ({ ...previous, message: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#DDF8B1] font-sans">

      <SiteHeader />

      <main className="bg-[#DDF8B1] px-6 pb-10 pt-28 md:px-16 md:pb-12 md:pt-32">
        <div className="max-w-7xl mx-auto">

          <h1 className="mb-6 text-center text-4xl font-bold text-[#1b5e20] md:text-5xl lg:text-left">Get In Touch</h1>

          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-center lg:gap-10">

            {/* FORM */}
            <form onSubmit={handleSend} className="w-full max-w-md space-y-4 md:w-1/2">
              {statusMessage && <p className="rounded-lg border border-[#c8e6c9] bg-white px-3 py-2 text-sm font-semibold text-[#1b5e20]">{statusMessage}</p>}
              {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <div className="flex flex-col">
                <label className="mb-1.5 text-sm font-semibold text-[#5d4037]">Name:</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[#c8e6c9] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1.5 text-sm font-semibold text-[#5d4037]">Email:</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-[#c8e6c9] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                />
              </div>
              <div className="flex flex-col">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-[#5d4037]">Message:</label>
                  <span className={`text-xs font-semibold ${form.message.length > CONTACT_MESSAGE_MAX_LENGTH ? "text-red-600" : "text-[#7b7169]"}`}>
                    {form.message.length}/{CONTACT_MESSAGE_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  value={form.message}
                  onChange={(event) => setForm((previous) => ({ ...previous, message: event.target.value }))}
                  maxLength={CONTACT_MESSAGE_MAX_LENGTH + 100}
                  className="h-28 w-full resize-none rounded-lg border border-[#c8e6c9] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                />
              </div>
              <button type="submit" disabled={isSending || form.message.length > CONTACT_MESSAGE_MAX_LENGTH} className="rounded-lg bg-[#4caf50] px-8 py-2.5 font-semibold text-white transition hover:bg-[#388e3c] disabled:cursor-not-allowed disabled:opacity-60">
                {isSending ? "Sending..." : "Send"}
              </button>
            </form>

            {/* FOOD IMAGES */}
            <div className="flex w-full justify-center md:w-1/2 md:justify-end">
              <FoodImageCarousel />
            </div>

          </div>
        </div>
      </main>

      <SiteFooter />

    </div>
  );
}

