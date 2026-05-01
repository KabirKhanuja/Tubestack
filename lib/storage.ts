"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "tubestack:v1";

export function loadFromStorage<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // quota or serialization error — ignore
  }
}

export function clearStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function usePersistentState<T>(
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean, () => void] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);
  const initialRef = useRef(initial);

  useEffect(() => {
    const stored = loadFromStorage<T | null>(null as T | null);
    if (stored !== null) setState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveToStorage(state);
  }, [state, hydrated]);

  // After hydration finishes, allow saving on next change
  useEffect(() => {
    if (hydrated) skipNextSave.current = false;
  }, [hydrated]);

  // Wipe localStorage and reset to initial — suppresses the autosave that would
  // otherwise re-persist the cleared state on the next render.
  const reset = useCallback(() => {
    skipNextSave.current = true;
    clearStorage();
    setState(initialRef.current);
  }, []);

  return [state, setState, hydrated, reset];
}
