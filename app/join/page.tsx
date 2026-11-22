"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { homePath } from "@/lib/selectors";
import type { Member } from "@/lib/types";
import { hashPassword, normEmail, validEmail } from "@/lib/auth";
import { label, normHandle, uid } from "@/lib/util";
import { Button, Field, Input, Notice, OrgMark } from "@/components/ui";

// The sign-up link officers share with the group. Everyone joins as a member; the treasurer can promote people later.
function JoinForm() {
  const { state, ready, me, update, log, signInAs, signOut } = useStore();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [f, setF] = useState({ name: "", email: "", venmo: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Right after signing up, continue to where they were headed.
  const [joined, setJoined] = useState(false);
  useEffect(() => {
    if (joined && me) router.replace(next?.startsWith("/") ? next : homePath(me));
  }, [joined, me, next, router]);

  if (!ready || joined) return null;

  if (!state.onboarded)
    return (
      <Shell>
        <p className="text-sm">There&apos;s no group set up here yet.</p>
        <p className="mt-2 text-sm text-muted">
          Ask your treasurer for the sign-up link, or set up a workspace for your own group.
        </p>
        <Link href="/onboarding" className="mt-5 inline-block text-sm font-medium hover:underline">
          Set up a workspace →
        </Link>
      </Shell>
    );

  // Someone is already signed in on this browser, e.g. the treasurer testing the link.
  if (me)
    return (
      <Shell org>
        <p className="text-sm">
          You&apos;re signed in as <span className="font-medium">{me.name}</span>. Sign out to create a new account.
        </p>
        <div className="mt-5 grid gap-2">
          <Button onClick={signOut}>Sign out and create an account</Button>
          <Button variant="secondary" onClick={() => router.push(homePath(me))}>
            Go to my dashboard
          </Button>
        </div>
      </Shell>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = normEmail(f.email);
    if (!f.name.trim()) return setError("Add your full name.");
    if (!validEmail(email)) return setError("That email doesn't look right.");
    if (f.password.length < 8) return setError("Pick a password with at least 8 characters.");
    if (state.members.some((m) => normEmail(m.email) === email))
      return setError("That email already has an account. Sign in instead.");
    setBusy(true);
    const m: Member = {
      id: uid(),
      name: f.name.trim(),
      email,
      venmo: f.venmo,
      role: "member",
      avatar: null,
      passwordHash: await hashPassword(f.password),
      joinedAt: new Date().toISOString(),
      source: "signup",
    };
    update((s) => ({ ...s, members: [...s.members, m] }));
    log(`${m.name} joined`);
    setJoined(true);
    signInAs(m.id);
  };

  return (
    <div className="flex min-h-dvh items-start justify-center px-4 py-12 md:items-center">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 border-b-[3px] border-double border-ink pb-4">
          <OrgMark name={state.org.name} logo={state.org.logo} size={40} />
          <div className="min-w-0">
            <div className="truncate font-semibold leading-tight">{state.org.name}</div>
            <div className="text-xs text-muted">Join as a {label(state.org.memberLabel).one}</div>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Full name">
            <Input autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
          <Field label="Venmo" hint="so your payments match to you">
            <Input placeholder="@your-handle" value={f.venmo} onChange={(e) => setF({ ...f, venmo: normHandle(e.target.value) })} />
          </Field>
          <Field label="Password" hint="8+ characters">
            <Input
              type="password"
              autoComplete="new-password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          </Field>
          {error && <Notice tone="red">{error}</Notice>}
          <Button type="submit" className="w-full" disabled={busy}>
            Create account
          </Button>
        </form>

        <p className="mt-6 border-t border-rule pt-4 text-sm text-muted">
          Already have an account?{" "}
          <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-ink hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Shell({ children, org = false }: { children: React.ReactNode; org?: boolean }) {
  const { state } = useStore();
  return (
    <div className="flex min-h-dvh items-start justify-center px-4 py-12 md:items-center">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-3 border-b-[3px] border-double border-ink pb-4">
          {org ? (
            <OrgMark name={state.org.name} logo={state.org.logo} size={40} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/icon.svg" alt="" width={32} height={32} />
          )}
          <div className="font-semibold leading-tight">{org ? state.org.name : "Paper Trail"}</div>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export default function Join() {
  return (
    <Suspense>
      <JoinForm />
    </Suspense>
  );
}
