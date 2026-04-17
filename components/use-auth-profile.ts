"use client";

import { useSyncExternalStore } from "react";

const AUTH_CHANGE_EVENT = "indabest-auth-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}

function getIsLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function getUserName() {
  return localStorage.getItem("userName") || localStorage.getItem("userEmail") || "";
}

export function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function useAuthProfile() {
  const isLoggedIn = useSyncExternalStore(subscribe, getIsLoggedIn, () => false);
  const userName = useSyncExternalStore(subscribe, getUserName, () => "");

  return { isLoggedIn, userName };
}
