"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { isOfficer } from "@/lib/selectors";
import { normEmail } from "@/lib/auth";
import { Button, Field, Input, Notice, OrgMark } from "@/components/ui";

function LoginForm() {
  const { state, ready, me, signIn, signOut } = useStore();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !state.onboarded) router.replace("/");
  }, [ready, state.onboarded, router]);

  if (!ready || !state.onboarded) return null;

  const home = (officer: boolean) => (next && next.startsWith("/") ? next : officer ? "/dashboard" : "/me");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const m = await signIn(email, password);
    setBusy(false);
    if (m) return router.push(home(isOfficer(m)));
    const known = state.members.find((x) => normEmail(x.email) === normEmail(email));
    setError(
      known && !known.passwordHash
        ? "That account doesn't have a password yet. Ask an officer to set a temporary one for you."
        : "That email and password don't match."
    );
  };

  return (
    <div className="flex min-h-dvh items-start justify-center px-4 py-12 md:items-center">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-3 border-b-[3px] border-double border-ink pb-4">
          <OrgMark name={state.org.name} logo={state.org.logo} size={40} />
          <div className="min-w-0">
            <div className="truncate font-semibold leading-tight">{state.org.name}</div>
            <div className="text-xs text-muted">Sign in</div>
          </div>
        </div>

        {me ? (
          <div className="mt-6 space-y-4 text-sm">
            <p>
              You&apos;re signed in as <span className="font-medium">{me.name}</span>.
            </p>
            <Button className="w-full" onClick={() => router.push(home(isOfficer(me)))}>
              Continue as {me.name.split(" ")[0]}
            </Button>
            <Button variant="secondary" className="w-full" onClick={signOut}>
              Use a different account
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            {error && <Notice tone="red">{error}</Notice>}
            <Button type="submit" className="w-full" disabled={busy}>
              Sign in
            </Button>
            <p className="text-xs leading-relaxed text-muted">
              Forgot your password? Any officer can set a temporary one from the member list.
            </p>
          </form>
        )}

        <div className="mt-10 border-t border-rule pt-4 text-xs text-muted">
          <Link href="/" className="hover:text-ink">
            ← Paper Trail
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
