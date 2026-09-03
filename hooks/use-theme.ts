"use client";

import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

let currentTheme: Theme = "dark";
let initialized = false;
const listeners = new Set<() => void>();

function readStoredTheme(): Theme {
  try {
    return localStorage.getItem("theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getClientSnapshot(): Theme {
  if (!initialized) {
    initialized = true;
    currentTheme = readStoredTheme();
  }
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function setTheme(theme: Theme) {
  currentTheme = theme;
  document.documentElement.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignore write failures (private browsing, storage full, etc.)
  }
  notify();
}

export function useTheme() {
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  return { resolvedTheme, setTheme };
}
