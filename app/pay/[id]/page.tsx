"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { collection, tagName, tagPrice } from "@/lib/selectors";
import type { PaymentTag } from "@/lib/types";
import { label, longDate, money, sameTag, tagCode, uid } from "@/lib/util";
import { Card, OrgMark, Progress, Select } from "@/components/ui";

// The public link members open from the group chat. No app, no login.
export default function Pay() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, update, log } = useStore();
  const viewerIsMember = state.members.find((m) => m.id === state.viewAs)?.role === "member";
  const [who, setWho] = useState<string>(viewerIsMember ? state.viewAs : "");
  const [step, setStep] = useState<"start" | "confirm" | "done">("start");

  if (!ready) return null;

  const ev = state.events.find((e) => e.id === id);
  const tag: PaymentTag | null = id === "dues" ? { kind: "dues" } : ev ? { kind: "event", eventId: ev.id } : null;

  if (!tag)
    return <div className="p-10 text-center text-sm text-stone-500">This payment link isn&apos;t active.</div>;

  const price = tagPrice(state, tag);
  const name = tagName(state, tag);
  const code = tagCode(tag);
  const c = collection(state, tag);
  const L = label(state.org.memberLabel);
  const person = state.members.find((m) => m.id === who);
  const alreadyPaid = !!who && state.payments.some((p) => p.memberId === who && sameTag(p.tag, tag));

  const venmoUrl = `https://venmo.com/${state.org.venmoHandle}?txn=pay&amount=${price.toFixed(2)}&note=${encodeURIComponent(
    `${name} ${code}`
  )}`;

  const record = () => {
    if (!person) return;
    update((s) => ({
      ...s,
      payments: [
        ...s.payments,
        { id: uid(), memberId: person.id, amount: price, tag, via: "venmo", at: new Date().toISOString(), ref: code },
      ],
    }));
    log(`${person.name} paid ${money(price)} for ${name} through the link`);
    setStep("done");
  };

  return (
    <div className="flex min-h-dvh items-start justify-center px-4 py-8 md:items-center">
      <Card className="w-full max-w-sm overflow-hidden">
        <div className="bg-brand px-6 py-6 text-on-brand">
          <div className="flex items-center gap-3">
            <OrgMark name={state.org.name} logo={state.org.logo} size={40} onBrand />
            <div className="text-sm font-semibold">{state.org.name}</div>
          </div>
          <div className="mt-6 text-sm opacity-80">{name}</div>
          <div className="font-display tabular text-5xl">{money(price)}</div>
          {ev && (
            <div className="mt-1 text-xs opacity-80">
              {longDate(ev.date)} · {ev.location}
            </div>
          )}
        </div>

        <div className="space-y-5 p-6">
          <div>
            <div className="tabular flex justify-between text-xs text-stone-500">
              <span>
                {c.paidCount} of {state.members.length} {L.many} paid
              </span>
              <span>{Math.round(c.pct * 100)}%</span>
            </div>
            <Progress value={c.pct} className="mt-1.5" />
          </div>

          {step === "done" || (alreadyPaid && step === "start") ? (
            <div className="rounded-xl bg-brand-soft p-4 text-center">
              <div className="text-2xl text-brand">✓</div>
              <div className="mt-1 font-medium">
                {person ? `${person.name.split(" ")[0]}, you're paid up.` : "You're paid up."}
              </div>
              <p className="mt-1 text-sm text-stone-600">
                It&apos;s on the shared ledger, tagged to {name}. Nobody needs a screenshot.
              </p>
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium">
                Who&apos;s paying?
                <Select value={who} onChange={(e) => setWho(e.target.value)} className="mt-1.5">
                  <option value="">Choose your name</option>
                  {state.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </label>

              {step === "start" && (
                <a
                  href={who ? venmoUrl : undefined}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!who) {
                      e.preventDefault();
                      return;
                    }
                    setStep("confirm");
                  }}
                  className={`block rounded-xl bg-brand py-3 text-center text-sm font-medium text-on-brand ${
                    who ? "" : "pointer-events-none opacity-40"
                  }`}
                >
                  Pay {money(price)} with Venmo
                </a>
              )}

              {step === "confirm" && (
                <div className="space-y-2 rounded-xl border border-stone-200 p-4 text-sm">
                  <p>
                    Venmo opened with the amount and the note <code className="font-mono text-xs">{code}</code>{" "}
                    filled in. Did it go through?
                  </p>
                  <div className="flex gap-2">
                    <button onClick={record} className="rounded-lg bg-brand px-3 py-1.5 font-medium text-on-brand">
                      Yes, I paid
                    </button>
                    <button onClick={() => setStep("start")} className="rounded-lg px-3 py-1.5 text-stone-600">
                      Not yet
                    </button>
                  </div>
                </div>
              )}

              {step === "start" && who && (
                <button onClick={record} className="w-full text-center text-xs text-stone-400 underline">
                  Demo: simulate a Venmo payment
                </button>
              )}

              <p className="text-center text-xs text-stone-400">
                Goes to @{state.org.venmoHandle}. Paying cash? Hand it to the treasurer and they&apos;ll log it.
              </p>
            </>
          )}

          <div className="border-t border-stone-100 pt-4 text-center">
            <Link
              href="/me"
              onClick={() => who && update((s) => ({ ...s, viewAs: who }))}
              className="text-xs text-stone-500 hover:text-ink"
            >
              See everything I&apos;ve paid →
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
