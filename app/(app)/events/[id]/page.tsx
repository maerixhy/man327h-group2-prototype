"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { eventSpend, memberName } from "@/lib/selectors";
import { longDate, money } from "@/lib/util";
import { Card, Empty, PageHeader, Progress, StatusBadge } from "@/components/ui";
import CollectionPanel from "@/components/CollectionPanel";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useStore();
  const ev = state.events.find((e) => e.id === id);
  if (!ev) return <Empty>That event doesn&apos;t exist.</Empty>;

  const sp = eventSpend(state, ev.id);
  const expenses = state.reimbursements.filter((r) => r.eventId === ev.id);

  return (
    <>
      <Link href="/events" className="text-sm text-stone-500 hover:text-ink">
        ← Events
      </Link>
      <div className="mt-3">
        <PageHeader
          title={ev.name}
          sub={`${longDate(ev.date)} · ${ev.location} · ${money(ev.price)} per person`}
        />
      </div>

      <CollectionPanel tag={{ kind: "event", eventId: ev.id }} path={`/pay/${ev.id}`} />

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-medium">Budget</h3>
          <div className="tabular text-sm text-stone-500">
            {money(sp.committed)} spent · {money(sp.pending)} pending · {money(ev.budget)} budget
          </div>
        </div>
        <Progress value={ev.budget ? (sp.committed + sp.pending) / ev.budget : 0} className="mt-3" />
        <ul className="mt-4 divide-y divide-stone-100">
          {expenses.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span>
                {r.vendor} <span className="text-stone-500">· {r.description}</span>
                <span className="block text-xs text-stone-400">Fronted by {memberName(state, r.submitterId)}</span>
              </span>
              <span className="flex items-center gap-3">
                <StatusBadge status={r.status} />
                <span className="tabular">{money(r.amount)}</span>
              </span>
            </li>
          ))}
          {expenses.length === 0 && <li className="py-3 text-sm text-stone-500">No expenses yet.</li>}
        </ul>
      </Card>
    </>
  );
}
