"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { addPayment, isOfficer, tagName, tagPrice } from "@/lib/selectors";
import type { Member, PaymentTag } from "@/lib/types";
import { hashPassword, normEmail, validEmail } from "@/lib/auth";
import { longDate, money, sameTag, tagCode, uid } from "@/lib/util";
import { Avatar, Button, Field, Input, Notice, OrgMark } from "@/components/ui";
import Receipt from "@/components/Receipt";

// The link people open from the group chat. Pay in a few taps, no app needed.
export default function Pay() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, me, update, log, signInAs, signOut } = useStore();
  const [picked, setPicked] = useState<string>("");
  const [q, setQ] = useState("");
  const [joining, setJoining] = useState(false);
  const [join, setJoin] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"start" | "confirm" | "done">("start");

  if (!ready) return null;

  const ev = state.events.find((e) => e.id === id);
  const tag: PaymentTag | null = !state.onboarded
    ? null
    : id === "dues"
      ? { kind: "dues" }
      : ev
        ? { kind: "event", eventId: ev.id }
        : null;

  if (!tag)
    return <div className="p-10 text-center text-sm text-muted">This payment link isn&apos;t active anymore.</div>;

  const price = tagPrice(state, tag);
  const name = tagName(state, tag);
  const code = tagCode(tag);
  const who = me?.id ?? picked;
  const person = state.members.find((m) => m.id === who);
  const payment = who
    ? [...state.payments].reverse().find((p) => p.memberId === who && sameTag(p.tag, tag))
    : undefined;

  const venmoUrl = `https://venmo.com/${state.org.venmoHandle}?txn=pay&amount=${price.toFixed(2)}&note=${encodeURIComponent(
    `${name} ${code}`
  )}`;

  const matches =
    q.trim().length >= 2
      ? state.members.filter((m) => m.name.toLowerCase().split(/\s+/).some((w) => w.startsWith(q.trim().toLowerCase()))).slice(0, 6)
      : [];

  const record = () => {
    if (!person) return;
    update((s) =>
      addPayment(s, { memberId: person.id, amount: price, tag, via: "venmo", at: new Date().toISOString(), ref: code }, uid())
    );
    log(`${person.name} paid ${money(price)} for ${name} through the link`);
    setStep("done");
  };

  const addSelf = async () => {
    const email = normEmail(join.email);
    if (!join.name.trim()) return setError("Add your name.");
    if (!validEmail(email)) return setError("That email doesn't look right.");
    if (join.password.length < 8) return setError("Pick a password with at least 8 characters.");
    if (state.members.some((m) => normEmail(m.email) === email))
      return setError("That email already has an account. Sign in instead.");
    const m: Member = {
      id: uid(),
      name: join.name.trim(),
      email,
      role: "member",
      avatar: null,
      passwordHash: await hashPassword(join.password),
      joinedAt: new Date().toISOString(),
      source: "link",
    };
    update((s) => ({ ...s, members: [...s.members, m] }));
    log(`${m.name} joined from the ${name} payment link`);
    signInAs(m.id);
    setJoining(false);
    setError(null);
  };

  const showReceipt = !!payment && (step === "done" || step === "start");

  return (
    <div className="flex min-h-dvh justify-center px-4 py-8 md:py-14">
      <div className="w-full max-w-[380px]">
        <div className="rounded-[3px] border border-rule bg-sheet">
          <div className="h-1.5 rounded-t-[3px] bg-brand" />
          <div className="p-6">
            <div className="flex items-center gap-3">
              <OrgMark name={state.org.name} logo={state.org.logo} size={36} />
              <div className="text-sm font-semibold leading-tight">{state.org.name}</div>
            </div>
            <div className="mt-6 border-t border-rule pt-4 text-sm text-muted">{name}</div>
            <div className="num text-[48px] font-medium leading-none tracking-[-0.03em]">{money(price)}</div>
            {ev && (
              <div className="mt-2 text-xs text-muted">
                {longDate(ev.date)} · {ev.location}
              </div>
            )}

            {!showReceipt && (
              <div className="mt-6 space-y-4 border-t border-rule pt-5">
                {me ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar name={me.name} src={me.avatar} size={26} />
                      <span className="truncate">
                        Paying as <span className="font-medium">{me.name}</span>
                      </span>
                    </span>
                    <button onClick={signOut} className="shrink-0 text-xs text-muted underline-offset-2 hover:underline">
                      Not you?
                    </button>
                  </div>
                ) : joining ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Add yourself to {state.org.name}</div>
                    <Field label="Full name">
                      <Input autoComplete="name" value={join.name} onChange={(e) => setJoin({ ...join, name: e.target.value })} />
                    </Field>
                    <Field label="Email">
                      <Input
                        type="email"
                        autoComplete="email"
                        value={join.email}
                        onChange={(e) => setJoin({ ...join, email: e.target.value })}
                      />
                    </Field>
                    <Field label="Password" hint="to see your payments later">
                      <Input
                        type="password"
                        autoComplete="new-password"
                        value={join.password}
                        onChange={(e) => setJoin({ ...join, password: e.target.value })}
                      />
                    </Field>
                    {error && <Notice tone="red">{error}</Notice>}
                    <div className="flex gap-2">
                      <Button onClick={addSelf}>Create account</Button>
                      <Button variant="ghost" onClick={() => (setJoining(false), setError(null))}>
                        Back
                      </Button>
                    </div>
                  </div>
                ) : person ? (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      Paying as <span className="font-medium">{person.name}</span>
                    </span>
                    <button onClick={() => (setPicked(""), setStep("start"))} className="text-xs text-muted hover:underline">
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <Field label="Who's paying?">
                      <Input
                        placeholder="Start typing your name"
                        autoComplete="off"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />
                    </Field>
                    {matches.length > 0 && (
                      <ul className="mt-1 rounded-[3px] border border-rule">
                        {matches.map((m) => (
                          <li key={m.id}>
                            <button
                              onClick={() => (setPicked(m.id), setQ(""))}
                              className="block w-full border-b border-rule px-3 py-2 text-left text-sm last:border-0 hover:bg-ink/5"
                            >
                              {m.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.trim().length >= 2 && matches.length === 0 && (
                      <p className="mt-2 text-xs text-muted">No one by that name yet.</p>
                    )}
                    <div className="mt-3 flex justify-between text-xs">
                      <button onClick={() => setJoining(true)} className="font-medium text-brand-ink hover:underline">
                        Not on the list? Add yourself
                      </button>
                      <Link href={`/login?next=/pay/${id}`} className="text-muted hover:text-ink">
                        Sign in
                      </Link>
                    </div>
                  </div>
                )}

                {person && step === "start" && (
                  <a
                    href={venmoUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setStep("confirm")}
                    className="block rounded-[3px] bg-brand py-3 text-center text-sm font-medium text-on-brand hover:brightness-110"
                  >
                    Pay {money(price)} with Venmo
                  </a>
                )}

                {person && step === "confirm" && (
                  <div className="space-y-3 border-l-[3px] border-ink pl-3 text-sm">
                    <p>
                      Venmo opened with the amount and the note <code className="num text-xs">{code}</code> filled in. Did it go
                      through?
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={record}>
                        Yes, I paid
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setStep("start")}>
                        Not yet
                      </Button>
                    </div>
                  </div>
                )}

                {!joining && (
                  <p className="num text-center text-[11px] text-muted">
                    to @{state.org.venmoHandle} · paying cash? hand it to the treasurer
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {showReceipt && payment && person && (
          <div className="mt-6 flex flex-col items-center">
            <p className="mb-4 text-sm">
              {step === "done" ? "Got it" : "Already paid"}, {person.name.split(" ")[0]}. Here&apos;s your receipt.
            </p>
            <Receipt
              className="border-x border-t border-rule"
              r={{
                org: state.org.name,
                item: name,
                amount: payment.amount,
                payer: person.name,
                no: payment.no,
                id: payment.id,
                at: payment.at,
                via: payment.via,
                to: state.org.venmoHandle,
                code: payment.ref,
              }}
            />
          </div>
        )}

        <div className="mt-6 text-center text-xs text-muted">
          {me ? (
            <div className="flex justify-center gap-4">
              <Link href={isOfficer(me) ? "/dashboard" : "/me"} className="hover:text-ink">
                {isOfficer(me) ? "Back to overview →" : "See everything I've paid →"}
              </Link>
              {showReceipt && (
                <button onClick={() => (signOut(), setStep("start"))} className="hover:text-ink">
                  Not {me.name.split(" ")[0]}? Sign out
                </button>
              )}
            </div>
          ) : (
            showReceipt && (
              <Link href={`/login?next=/me`} className="hover:text-ink">
                Sign in to see everything you&apos;ve paid →
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
