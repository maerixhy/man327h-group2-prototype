"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { collection, memberName, tagName, tagPrice } from "@/lib/selectors";
import type { PaymentTag } from "@/lib/types";
import { label, money, relDays, sameTag, tagCode, uid } from "@/lib/util";
import { Button, Card, Pill, Progress } from "./ui";
import PaymentLink from "./PaymentLink";

// Shared by dues and events: who paid, who didn't, and one-tap reminders so nobody chases people by text.
export default function CollectionPanel({ tag, path }: { tag: PaymentTag; path: string }) {
  const { state, update, log } = useStore();
  const [origin, setOrigin] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);

  const c = collection(state, tag);
  const name = tagName(state, tag);
  const price = tagPrice(state, tag);
  const L = label(state.org.memberLabel);

  const lastReminder = (memberId: string) =>
    state.reminders
      .filter((r) => r.memberId === memberId && sameTag(r.tag, tag))
      .sort((a, b) => b.at.localeCompare(a.at))[0];

  const remind = (ids: string[]) => {
    const at = new Date().toISOString();
    update((s) => ({
      ...s,
      reminders: [...s.reminders, ...ids.map((memberId) => ({ id: uid(), memberId, tag, at }))],
    }));
    log(`Sent ${ids.length} reminder${ids.length === 1 ? "" : "s"} for ${name}`);
    setSent(
      ids.length === 1
        ? `Reminder sent to ${memberName(state, ids[0])}.`
        : `Reminders sent to ${ids.length} ${L.many}.`
    );
    setTimeout(() => setSent(null), 2500);
  };

  const markCash = (memberId: string) => {
    update((s) => ({
      ...s,
      payments: [
        ...s.payments,
        { id: uid(), memberId, amount: price, tag, via: "cash", at: new Date().toISOString(), ref: tagCode(tag) },
      ],
    }));
    log(`Recorded ${money(price)} cash from ${memberName(state, memberId)} for ${name}`);
  };

  const message = `Hi! Quick reminder that ${name} is ${money(price)}. Pay in 10 seconds here: ${origin}${path}`;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Collection</div>
            <div className="font-display tabular mt-1 text-2xl">
              {Math.round(c.pct * 100)}% collected, {c.unpaid.length} unpaid
            </div>
            <div className="tabular text-sm text-stone-500">
              {money(c.collected)} of {money(c.target)} · {c.paidCount} of {state.members.length} {L.many}
            </div>
          </div>
          <Button onClick={() => remind(c.unpaid.map((m) => m.id))} disabled={c.unpaid.length === 0}>
            Remind all {c.unpaid.length} unpaid
          </Button>
        </div>
        <Progress value={c.pct} className="mt-4" />
        <div className="mt-5">
          <div className="mb-2 text-sm font-medium">Payment link</div>
          <PaymentLink path={path} />
          <p className="mt-2 text-xs text-stone-500">
            Payments through this link carry the tag <code className="font-mono">{tagCode(tag)}</code> in the
            Venmo note, so they land on the ledger already sorted.
          </p>
        </div>
        {sent && (
          <div className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">
            {sent} <span className="text-stone-600">Message: “{message}”</span>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-medium">Unpaid ({c.unpaid.length})</h3>
          <ul className="mt-3 divide-y divide-stone-100">
            {c.unpaid.map((m) => {
              const r = lastReminder(m.id);
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm">{m.name}</div>
                    {r && <div className="text-xs text-stone-400">Reminded {relDays(r.at)}</div>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => markCash(m.id)}>
                      Got cash
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => remind([m.id])}>
                      Remind
                    </Button>
                  </div>
                </li>
              );
            })}
            {c.unpaid.length === 0 && <li className="py-3 text-sm text-stone-500">Everyone has paid.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="font-medium">Paid ({c.paidCount})</h3>
          <ul className="mt-3 divide-y divide-stone-100">
            {[...c.payments]
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="truncate">{memberName(state, p.memberId)}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Pill>{p.via}</Pill>
                    <span className="tabular">{money(p.amount)}</span>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
