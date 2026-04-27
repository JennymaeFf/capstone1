"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getUnreadContactReplyCount } from "@/lib/supabase/data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function MessageNotificationBadge({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => setCount(0));
      return;
    }

    let isMounted = true;

    const loadCount = async () => {
      try {
        const nextCount = await getUnreadContactReplyCount();
        if (isMounted) setCount(nextCount);
      } catch {
        if (isMounted) setCount(0);
      }
    };

    void loadCount();

    const supabase = getSupabaseBrowserClient();
    let channel: RealtimeChannel | null = supabase.channel(`contact-replies-${userId}`);
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages", filter: `user_id=eq.${userId}` }, () => {
        void loadCount();
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [userId]);

  if (count === 0) return null;

  return (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#f57c00] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {count}
    </span>
  );
}
