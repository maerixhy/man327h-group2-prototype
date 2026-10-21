"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OrgForm from "@/components/OrgForm";
import { useStore } from "@/lib/store";
import { hashPassword, normEmail, validEmail } from "@/lib/auth";
import { Card, Field, Input, Notice } from "@/components/ui";

export default function Onboarding() {
  const { state, ready, update, log, signInAs } = useStore();
  const router = useRouter();
  const [acct, setAcct] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  const treasurerId = state.members.find((m) => m.role === "treasurer")?.id ?? "m1";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Paper Trail
      </Link>
      <h1 className="mt-4 border-b-[3px] border-double border-ink pb-3 text-[32px] font-semibold tracking-[-0.02em]">
        Set up your workspace
      </h1>

      <Card className="mt-6 p-5 md:p-6 lg:mr-[364px]">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Your account</h2>
        <p className="mt-1 text-sm text-muted">You&apos;ll be the treasurer. You can hand the books off later.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Your name">
            <Input value={acct.name} autoComplete="name" onChange={(e) => setAcct({ ...acct, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              value={acct.email}
              onChange={(e) => setAcct({ ...acct, email: e.target.value })}
            />
          </Field>
          <Field label="Password" hint="8+ characters">
            <Input
              type="password"
              autoComplete="new-password"
              value={acct.password}
              onChange={(e) => setAcct({ ...acct, password: e.target.value })}
            />
          </Field>
        </div>
        {error && (
          <div className="mt-4">
            <Notice tone="red">{error}</Notice>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <OrgForm
          initial={state.org}
          submitLabel="Create workspace"
          onSubmit={async (org) => {
            const email = normEmail(acct.email);
            if (!acct.name.trim()) return setError("Add your name.");
            if (!validEmail(email)) return setError("That email doesn't look right.");
            if (acct.password.length < 8) return setError("Use a password with at least 8 characters.");
            if (state.members.some((m) => m.id !== treasurerId && normEmail(m.email) === email))
              return setError("Someone on the roster already uses that email.");
            const passwordHash = await hashPassword(acct.password);
            update((s) => ({
              ...s,
              org,
              onboarded: true,
              members: s.members.map((m) =>
                m.id === treasurerId
                  ? { ...m, name: acct.name.trim(), email, passwordHash, joinedAt: new Date().toISOString() }
                  : m
              ),
            }));
            signInAs(treasurerId);
            log(`Workspace created for ${org.name}`);
            router.push("/dashboard");
          }}
        />
      </div>
    </div>
  );
}
