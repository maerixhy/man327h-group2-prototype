"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { State } from "./types";
import { seedState } from "./seed";
import { onColor, uid } from "./util";

// Prototype storage: everything lives in the browser so the demo runs with zero setup.
// Swap this file for a database (e.g. Supabase) when moving past the prototype.
const KEY = "paper-trail-demo-v1";

type Ctx = {
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
  log: (text: string) => void;
  reset: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seedState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setReady(true);

    // Keeps two tabs in sync, so a payment made on the member link shows up on the treasurer's dashboard live.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      console.warn("Browser storage is full. Try smaller receipt photos.");
    }
  }, [state, ready]);

  const update = useCallback((fn: (s: State) => State) => setState((s) => fn(s)), []);

  const log = useCallback(
    (text: string) =>
      setState((s) => ({ ...s, log: [{ id: uid(), at: new Date().toISOString(), text }, ...s.log] })),
    []
  );

  const reset = useCallback(() => setState(seedState()), []);

  const brand = {
    "--brand": state.org.color,
    "--on-brand": onColor(state.org.color),
  } as CSSProperties;

  return (
    <StoreCtx.Provider value={{ state, ready, update, log, reset }}>
      <div style={brand} className="min-h-dvh">
        {children}
      </div>
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
