"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const SESSION_KEY = "watch-party-admin-session";
const LAST_ACTIVE_KEY = "watch-party-admin-last-active-at";
const IDLE_LIMIT_MS = 15 * 60 * 1000;

function parseSession(value) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readLastActive(session) {
  const stored = Number(window.localStorage.getItem(LAST_ACTIVE_KEY));
  if (Number.isFinite(stored) && stored > 0) {
    return stored;
  }

  const createdAt = Number(session?.createdAt ? Date.parse(session.createdAt) : NaN);
  if (Number.isFinite(createdAt) && createdAt > 0) {
    return createdAt;
  }

  return Date.now();
}

export function AdminSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef(null);

  useEffect(() => {
    function clearSession() {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(LAST_ACTIVE_KEY);
    }

    function redirectHome() {
      router.replace("/");
    }

    function logout() {
      clearSession();
      redirectHome();
    }

    const session = parseSession(window.localStorage.getItem(SESSION_KEY));
    if (!session) {
      if (pathname !== "/") {
        redirectHome();
      }
      return undefined;
    }

    const lastActive = readLastActive(session);
    const expired = Date.now() - lastActive >= IDLE_LIMIT_MS;

    if (expired) {
      logout();
      return undefined;
    }

    if (pathname === "/") {
      router.replace("/dashboard");
      return undefined;
    }

    window.localStorage.setItem(LAST_ACTIVE_KEY, String(lastActive));

    function scheduleLogout() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const currentLastActive = Number(window.localStorage.getItem(LAST_ACTIVE_KEY)) || Date.now();
      const remaining = Math.max(IDLE_LIMIT_MS - (Date.now() - currentLastActive), 1000);
      timeoutRef.current = window.setTimeout(logout, remaining);
    }

    function markActivity() {
      if (!window.localStorage.getItem(SESSION_KEY)) {
        return;
      }

      window.localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
      scheduleLogout();
    }

    const events = ["pointerdown", "keydown", "touchstart", "mousemove", "scroll", "click"];
    events.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    scheduleLogout();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
    };
  }, [pathname, router]);

  return null;
}
