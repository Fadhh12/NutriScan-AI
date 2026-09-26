"use client";

import { useEffect, useState } from "react";
import type { PublicUser } from "./types";

const TOKEN_KEY = "nutriscan_token";
const USER_KEY = "nutriscan_user";
const AUTH_CHANGE_EVENT = "nutriscan-auth-change";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): PublicUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as PublicUser) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: PublicUser) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  } catch {
    // localStorage unavailable (private mode, etc.) — session just won't persist.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

/** Reads the guest/logged-in session from localStorage. `ready` flips true after the first read (SSR-safe). */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function sync() {
      setToken(getToken());
      setUser(getStoredUser());
      setReady(true);
    }
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { token, user, ready, isGuest: ready && !token };
}
