import type { User } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidAuthEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseServiceClient();
  const normalizedEmail = normalizeAuthEmail(email);
  const perPage = 1000;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(error.message || "Unable to check registered users.");
    }

    const match = data.users.find((user) => normalizeAuthEmail(user.email || "") === normalizedEmail);
    if (match) return match;
    if (data.users.length < perPage) return null;
  }

  return null;
}
