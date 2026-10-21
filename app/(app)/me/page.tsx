"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { eventName, memberObligations, memberTotals, tagName, viewer } from "@/lib/selectors";
import { money, relDays, shortDate } from "@/lib/util";
import { Card, PageHeader, Pill, StatusBadge } from "@/components/ui";
import { ReceiptThumb, ReimbursementForm, Timeline } from "@/components/Reimb";

export default function Me() {
  const { state } = useStore();
  const me = viewer(state);
  const totals = memberTotals(state, me.id);
  const obligations = memberObligations(state, me.id);
  const due = obligations.filter((o) => !o.paid);
  const mine = state.reimbursements
    .filter((r) => r.submitterId === me.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return (
    <>
      <PageHeader
        title={`Hi, ${me.name.split(" ")[0]}`}
        sub={`Everything you've paid ${state.org.name} this term, and anything you're owed back.`}
      />

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Paid this term</div>
          <div className="font-display tabular mt-1 text-4xl">{money(totals.total)}</div>
          <ul className="mt-4 divide-y divide-stone-100">
            {obligations.map((o) => (
              <li key={o.name} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  {o.name} <span className="tabular text-stone-500">· {money(o.price)}</span>
                </span>
                {o.paid ? (
                  <Pill tone="brand">✓ Paid</Pill>
                ) : (
                  <Link
                    href={o.tag.kind === "dues" ? "/pay/dues" : `/pay/${o.tag.eventId}`}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-on-brand"
                  >
                    Pay {money(o.price)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          {due.length === 0 && <p className="mt-2 text-sm text-brand">You&apos;re all paid up.</p>}
        </Card>

        <Card className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Payment history</div>
          <ul className="mt-3 divide-y divide-stone-100">
            {[...totals.payments]
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    {tagName(state, p.tag)}
                    <span className="block text-xs text-stone-400">
                      {shortDate(p.at)} · {p.via}
                    </span>
                  </span>
                  <span className="tabular font-medium">{money(p.amount)}</span>
                </li>
              ))}
            {totals.payments.length === 0 && <li className="py-3 text-sm text-stone-500">No payments yet.</li>}
          </ul>
        </Card>
      </div>

      {state.org.modules.reimbursements && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          <ReimbursementForm />
          <div className="space-y-3">
            <h3 className="font-display text-xl">Your requests</h3>
            {mine.length === 0 && (
              <p className="text-sm text-stone-500">
                Fronted money for the group? Submit the receipt and you&apos;ll see exactly when it&apos;s coming back.
              </p>
            )}
            {mine.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex gap-3">
                  <ReceiptThumb src={r.receipt} alt={`${r.vendor} receipt`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="text-sm">
                        <span className="tabular font-medium">{money(r.amount)}</span> · {r.vendor}
                        <span className="block text-xs text-stone-500">
                          {eventName(state, r.eventId)} · sent {relDays(r.submittedAt)}
                        </span>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="mt-3">
                      <Timeline r={r} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
