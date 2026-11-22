"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OrgForm from "@/components/OrgForm";
import { useStore } from "@/lib/store";
import type { Member } from "@/lib/types";
import { hashPassword, normEmail, validEmail } from "@/lib/auth";
import { normHandle, uid } from "@/lib/util";
import { Card, Field, Input } from "@/components/ui";

export default function Onboarding() {
  const { state, ready, update, signInAs } = useStore();
  const router = useRouter();
  const [acct, setAcct] = useState({ name: "", email: "", venmo: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  // One workspace per browser: if it already exists, send people to sign in instead.
  useEffect(() => {
    if (ready && state.onboarded) router.replace("/");
  }, [ready, state.onboarded, router]);

  if (!ready || state.onboarded) return null;

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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          <Field label="Your Venmo" hint="optional">
            <Input
              placeholder="@your-handle"
              value={acct.venmo}
              onChange={(e) => setAcct({ ...acct, venmo: normHandle(e.target.value) })}
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
      </Card>

      <div className="mt-6">
        <OrgForm
          initial={state.org}
          submitLabel="Create workspace"
          error={error}
          onSubmit={async (org) => {
            const email = normEmail(acct.email);
            if (!acct.name.trim()) return setError("Add your name.");
            if (!validEmail(email)) return setError("That email doesn't look right.");
            if (acct.password.length < 8) return setError("Use a password with at least 8 characters.");
            if (!org.name.trim()) return setError("Give your group a name.");
            if (!org.venmoHandle) return setError("Add the group's Venmo handle so payment links know where to send money.");
            const now = new Date().toISOString();
            const owner: Member = {
              id: uid(),
              name: acct.name.trim(),
              email,
              venmo: acct.venmo,
              role: "treasurer",
              title: "Treasurer",
              avatar: null,
              passwordHash: await hashPassword(acct.password),
              joinedAt: now,
              source: "owner",
            };
            update((s) => ({
              ...s,
              org: { ...org, name: org.name.trim(), term: org.term.trim() || "This term" },
              onboarded: true,
              members: [owner],
              log: [{ id: uid(), at: now, text: `Workspace created for ${org.name.trim()}`, by: owner.id }],
            }));
            signInAs(owner.id);
            router.push("/dashboard");
          }}
        />
      </div>
    </div>
  );
}
