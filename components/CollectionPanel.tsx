"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { addPayment, collection, memberName, tagName, tagPrice } from "@/lib/selectors";
import type { PaymentTag } from "@/lib/types";
import { label, money, relDays, sameTag, shortDate, tagCode, uid } from "@/lib/util";
import { Button, Notice, Progress, SectionTitle } from "./ui";
import PaymentLink from "./PaymentLink";

// Shared by dues and events: who paid, who didn't, and one-tap reminders so nobody chases people by text.
export default function CollectionPanel({ tag, path }: { tag: PaymentTag; path: string }) {
  const { state, me, update, log } = useStore();
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
    setSent(ids.length === 1 ? `Reminder sent to ${memberName(state, ids[0])}.` : `Reminders sent to ${ids.length} ${L.many}.`);
    setTimeout(() => setSent(null), 3000);
  };

  const markCash = (memberId: string) => {
    update((s) =>
      addPayment(
        s,
        { memberId, amount: price, tag, via: "cash", at: new Date().toISOString(), ref: tagCode(tag), recordedBy: me?.id },
        uid()
      )
    );
    log(`Recorded ${money(price)} cash from ${memberName(state, memberId)} for ${name}`);
  };

  const message = `Hi! Quick reminder that ${name} is ${money(price)}. Pay here: ${origin}${path}`;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="num text-[32px] font-medium leading-none tracking-tight">
              {money(c.collected)}
              <span className="text-lg text-muted"> / {money(c.target)}</span>
            </div>
            <div className="num mt-1.5 text-[13px] text-muted">
              {money(price)} each · {Math.round(c.pct * 100)}% · {c.paidCount} of {state.members.length} paid · {c.unpaid.length} unpaid
            </div>
          </div>
          <Button onClick={() => remind(c.unpaid.map((m) => m.id))} disabled={c.unpaid.length === 0}>
            Remind all {c.unpaid.length} unpaid
          </Button>
        </div>
        <Progress value={c.pct} className="mt-4" />
        <div className="mt-5">
          <PaymentLink path={path} />
          <p className="mt-2 text-xs text-muted">
            Payments through this link carry <code className="num text-ink">{tagCode(tag)}</code> in the Venmo note.
          </p>
        </div>
        {sent && (
          <div className="mt-4">
            <Notice tone="brand">
              {sent} <span className="text-muted">“{message}”</span>
            </Notice>
          </div>
        )}
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="min-w-0">
          <SectionTitle aside={<span className="num">{c.unpaid.length}</span>}>Unpaid</SectionTitle>
          <ul>
            {c.unpaid.map((m) => {
              const r = lastReminder(m.id);
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 border-b border-rule py-1.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm">{m.name}</div>
                    {r && <div className="text-[11px] text-muted">Reminded {relDays(r.at)}</div>}
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
            {c.unpaid.length === 0 && <li className="py-3 text-sm italic text-muted">Everyone&apos;s in. Nobody to chase.</li>}
          </ul>
        </section>
        <section className="min-w-0">
          <SectionTitle aside={<span className="num">{c.paidCount}</span>}>Paid</SectionTitle>
          <ul>
            {[...c.payments]
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 border-b border-rule py-2 text-sm">
                  <span className="num w-10 shrink-0 text-[11px] text-faint">{String(p.no).padStart(4, "0")}</span>
                  <span className="min-w-0 flex-1 truncate">{memberName(state, p.memberId)}</span>
                  <span className="num shrink-0 text-[11px] text-muted">
                    {shortDate(p.at)} · {p.via}
                  </span>
                  <span className="num w-14 shrink-0 text-right text-[13px]">{p.amount.toFixed(2)}</span>
                </li>
              ))}
            {c.payments.length === 0 && (
              <li className="py-3 text-sm italic text-muted">No payments yet. Drop the link in the group chat.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
