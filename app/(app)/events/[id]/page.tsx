"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { eventSpend, memberName } from "@/lib/selectors";
import { longDate, money } from "@/lib/util";
import { Empty, PageHeader, Progress, SectionTitle, StatusStamp } from "@/components/ui";
import CollectionPanel from "@/components/CollectionPanel";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useStore();
  const ev = state.events.find((e) => e.id === id);
  if (!ev) return <Empty>That event isn&apos;t in the book.</Empty>;

  const sp = eventSpend(state, ev.id);
  const expenses = state.reimbursements.filter((r) => r.eventId === ev.id);

  return (
    <>
      <Link href="/events" className="text-sm text-muted hover:text-ink">
        ← Events
      </Link>
      <div className="mt-3">
        <PageHeader title={ev.name} />
      </div>
      <dl className="-mt-3 mb-8 grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
        {[
          ["Date", longDate(ev.date)],
          ["Location", ev.location || "—"],
          ["Price", money(ev.price)],
          ["Budget", money(ev.budget)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[11px] uppercase tracking-[0.1em] text-muted">{k}</dt>
            <dd className={k === "Price" || k === "Budget" ? "num" : ""}>{v}</dd>
          </div>
        ))}
      </dl>

      <CollectionPanel tag={{ kind: "event", eventId: ev.id }} path={`/pay/${ev.id}`} />

      <section className="mt-10">
        <SectionTitle
          aside={
            <span className="num">
              {money(sp.committed)} spent · {money(sp.pending)} pending
            </span>
          }
        >
          Budget
        </SectionTitle>
        <Progress value={ev.budget ? (sp.committed + sp.pending) / ev.budget : 0} className="mt-3" />
        <ul className="mt-2">
          {expenses.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-2.5 text-sm">
              <span className="min-w-0">
                <span className="num mr-2 text-[11px] text-faint">{String(r.no).padStart(4, "0")}</span>
                {r.vendor} <span className="text-muted">· {r.description}</span>
                <span className="block pl-[42px] text-xs text-muted">Fronted by {memberName(state, r.submitterId)}</span>
              </span>
              <span className="flex items-center gap-4">
                <StatusStamp status={r.status} by={r.approvedBy && memberName(state, r.approvedBy)} />
                <span className="num w-16 text-right text-[13px]">{r.amount.toFixed(2)}</span>
              </span>
            </li>
          ))}
          {expenses.length === 0 && (
            <li className="py-3 text-sm italic text-muted">Nothing spent yet. Receipts tagged to this event land here.</li>
          )}
        </ul>
      </section>
    </>
  );
}
