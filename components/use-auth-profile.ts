"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const AUTH_CHANGE_EVENT = "indabest-auth-change";

type AuthProfile = {
  isLoading: boolean;
  isLoggedIn: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl: string;
  isSupabaseReady: boolean;
};

const DEFAULT_AUTH_PROFILE: AuthProfile = {
  isLoading: isSupabaseConfigured,
  isLoggedIn: false,
  userId: "",
  userName: "",
  userEmail: "",
  avatarUrl: "",
  isSupabaseReady: isSupabaseConfigured,
};

export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export async function signOutUser() {
  if (!isSupabaseConfigured) return;
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
  notifyAuthChange();
}

export function useAuthProfile() {
  const [state, setState] = useState<AuthProfile>(DEFAULT_AUTH_PROFILE);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    const refreshAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (!sessionUser) {
        setState({
          isLoading: false,
          isLoggedIn: false,
          userId: "",
          userName: "",
          userEmail: "",
          avatarUrl: "",
          isSupabaseReady: true,
        });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", sessionUser.id)
        .maybeSingle();

      const fullName = profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.email || "";

      setState({
        isLoading: false,
        isLoggedIn: true,
        userId: sessionUser.id,
        userName: fullName,
        userEmail: sessionUser.email || "",
        avatarUrl: profile?.avatar_url || "",
        isSupabaseReady: true,
      });
    };

    const authSub = supabase.auth.onAuthStateChange(() => {
      void refreshAuth();
    });

    const customListener = () => {
      void refreshAuth();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, customListener);
    void refreshAuth();

    return () => {
      authSub.data.subscription.unsubscribe();
      window.removeEventListener(AUTH_CHANGE_EVENT, customListener);
    };
  }, []);

  return state;
}
