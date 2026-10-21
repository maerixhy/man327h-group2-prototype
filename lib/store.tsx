"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { Member, State } from "./types";
import { seedState } from "./seed";
import { onColor, uid } from "./util";
import { hashPassword, normEmail } from "./auth";

// Everything lives in the browser for now. Swap this file for a database (e.g. Supabase) later.
const KEY = "paper-trail-v2";
// The signed-in account is kept per tab, so two tabs can be two different people.
const SESSION = "paper-trail-session";

type Ctx = {
  state: State;
  ready: boolean;
  me: Member | null;
  update: (fn: (s: State) => State) => void;
  log: (text: string) => void;
  reset: () => void;
  signIn: (email: string, password: string) => Promise<Member | null>;
  signInAs: (id: string) => void;
  signOut: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

function readSession() {
  try {
    return sessionStorage.getItem(SESSION) ?? localStorage.getItem(SESSION);
  } catch {
    return null;
  }
}

function writeSession(id: string | null) {
  try {
    if (id) {
      sessionStorage.setItem(SESSION, id);
      localStorage.setItem(SESSION, id);
    } else {
      sessionStorage.removeItem(SESSION);
      localStorage.removeItem(SESSION);
    }
  } catch {}
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seedState);
  const [ready, setReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  sessionRef.current = sessionId;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setSessionId(readSession());
    setReady(true);

    // Keeps tabs in sync, so a payment made on a payment link shows up on the treasurer's overview live.
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
      console.warn("Browser storage is full. Try smaller photos.");
    }
  }, [state, ready]);

  const update = useCallback((fn: (s: State) => State) => setState((s) => fn(s)), []);

  const log = useCallback(
    (text: string) =>
      setState((s) => ({
        ...s,
        log: [{ id: uid(), at: new Date().toISOString(), text, by: sessionRef.current ?? undefined }, ...s.log],
      })),
    []
  );

  const signInAs = useCallback((id: string) => {
    writeSession(id);
    setSessionId(id);
  }, []);

  const signOut = useCallback(() => {
    writeSession(null);
    setSessionId(null);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const m = state.members.find((x) => normEmail(x.email) === normEmail(email));
      if (!m?.passwordHash || m.passwordHash !== (await hashPassword(password))) return null;
      signInAs(m.id);
      return m;
    },
    [state.members, signInAs]
  );

  const reset = useCallback(() => {
    setState(seedState());
    writeSession(null);
    setSessionId(null);
  }, []);

  const me = state.members.find((m) => m.id === sessionId) ?? null;

  const brand = {
    "--brand": state.org.color,
    "--on-brand": onColor(state.org.color),
  } as CSSProperties;

  return (
    <StoreCtx.Provider value={{ state, ready, me, update, log, reset, signIn, signInAs, signOut }}>
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
