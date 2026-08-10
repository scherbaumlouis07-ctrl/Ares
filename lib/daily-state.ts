"use client";

import { useCallback, useEffect, useState } from "react";
import { todayKey } from "./utils";

/**
 * Generic date-keyed local persistence.
 *
 * Every daily-reset feature (tasks, outreach, training) stores its state as
 * a map of `{ "YYYY-MM-DD": T }` under a single localStorage key. Reading a
 * date that doesn't exist yet returns the default value, so a "new day"
 * naturally starts empty without any timer or explicit reset step. History
 * for past dates is preserved for performance calculations. Supabase can
 * later replace this module's storage backend without touching call sites.
 */

type DailyMap<T> = Record<string, T>;

function storageKey(namespace: string): string {
  return `ares-os:daily:${namespace}`;
}

function readMap<T>(namespace: string): DailyMap<T> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(namespace));
    return raw ? (JSON.parse(raw) as DailyMap<T>) : {};
  } catch {
    return {};
  }
}

function writeMap<T>(namespace: string, map: DailyMap<T>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(namespace), JSON.stringify(map));
}

export function getDailyValue<T>(namespace: string, dateKey: string, fallback: T): T {
  const map = readMap<T>(namespace);
  return map[dateKey] ?? fallback;
}

export function setDailyValue<T>(namespace: string, dateKey: string, value: T): void {
  const map = readMap<T>(namespace);
  map[dateKey] = value;
  writeMap(namespace, map);
}

export function getDailyHistory<T>(namespace: string): DailyMap<T> {
  return readMap<T>(namespace);
}

/**
 * React hook: reads/writes today's value for a namespace, resetting
 * automatically whenever the calendar date changes.
 */
export function useDailyState<T>(namespace: string, fallback: T) {
  const [dateKey, setDateKey] = useState(todayKey());
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage is unavailable during SSR; reading it after mount (rather
    // than in a lazy useState initializer) keeps the first client render
    // identical to the server-rendered HTML and avoids a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(getDailyValue(namespace, dateKey, fallback));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, dateKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      const key = todayKey();
      setDateKey((prev) => (prev === key ? prev : key));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        setDailyValue(namespace, dateKey, resolved);
        return resolved;
      });
    },
    [namespace, dateKey]
  );

  return { value, setValue: update, dateKey, hydrated };
}

/** React hook exposing the full history map for a namespace (read-only, for charts). */
export function useDailyHistory<T>(namespace: string): DailyMap<T> {
  const [history, setHistory] = useState<DailyMap<T>>({});
  useEffect(() => {
    // Same SSR/hydration rationale as useDailyState above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(getDailyHistory<T>(namespace));
  }, [namespace]);
  return history;
}
