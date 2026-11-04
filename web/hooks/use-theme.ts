"use client";

import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "theme";

let currentTheme: Theme = "dark";
let initialized = false;
const listeners = new Set<() => void>();

/** Le thème réellement appliqué par le script d'amorçage du layout. */
function readAppliedTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getClientSnapshot(): Theme {
  if (!initialized) {
    initialized = true;
    currentTheme = readAppliedTheme();
  }
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "dark";
}

export function setTheme(theme: Theme) {
  currentTheme = theme;
  initialized = true;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // écriture impossible (navigation privée, stockage plein) : sans effet
  }
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  return { resolvedTheme, setTheme };
}
