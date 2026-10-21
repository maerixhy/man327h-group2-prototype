"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { balance, collection, eventSpend, owed, viewer } from "@/lib/selectors";
import { cap, label, money, relDays, shortDate } from "@/lib/util";
import { Card, PageHeader, Progress, Stat } from "@/components/ui";
import PaymentLink from "@/components/PaymentLink";

export default function Dashboard() {
  const { state } = useStore();
  const me = viewer(state);
  const o = owed(state);
  const dues = collection(state, { kind: "dues" });
  const L = label(state.org.memberLabel);
  const upcoming = [...state.events]
    .filter((e) => new Date(e.date) > new Date())
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHeader
        title={`Hi, ${me.name.split(" ")[0]}`}
        sub={`Everyone on the board sees the same numbers. No more asking the treasurer to check their Venmo.`}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Balance" value={money(balance(state))} sub="Live, shared with the board" />
        <Stat
          label="Owed back to officers"
          value={money(o.approved)}
          sub={`${o.approvedCount} approved, scheduled`}
        />
        <Stat
          label="Waiting for approval"
          value={money(o.submitted)}
          sub={
            state.org.modules.reimbursements ? (
              <Link href="/reimbursements" className="text-brand underline-offset-2 hover:underline">
                {o.submittedCount} in the queue →
              </Link>
            ) : (
              `${o.submittedCount} requests`
            )
          }
        />
        <Stat label={cap(L.many)} value={state.members.length} sub={state.org.term} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {state.org.modules.dues && (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl">{state.org.term} dues</h2>
                  <p className="tabular mt-1 text-sm text-stone-500">
                    {money(dues.collected)} of {money(dues.target)} · {dues.unpaid.length} {L.many} unpaid
                  </p>
                </div>
                <div className="text-right">
                  <div className="tabular font-display text-3xl text-brand">{Math.round(dues.pct * 100)}%</div>
                  <Link href="/dues" className="text-xs text-brand hover:underline">
                    Remind unpaid →
                  </Link>
                </div>
              </div>
              <Progress value={dues.pct} className="mt-4" />
              <div className="mt-4">
                <PaymentLink path="/pay/dues" />
              </div>
            </Card>
          )}

          {state.org.modules.events && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">Upcoming events</h2>
                <Link href="/events" className="text-sm text-brand hover:underline">
                  All events
                </Link>
              </div>
              <div className="mt-3 divide-y divide-stone-100">
                {upcoming.map((e) => {
                  const c = collection(state, { kind: "event", eventId: e.id });
                  const sp = eventSpend(state, e.id);
                  return (
                    <Link key={e.id} href={`/events/${e.id}`} className="block py-4 hover:bg-stone-50/60">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="font-medium">{e.name}</div>
                        <div className="text-xs text-stone-500">
                          {shortDate(e.date)} · {relDays(e.date)}
                        </div>
                      </div>
                      <div className="tabular mt-1 text-sm text-stone-600">
                        {Math.round(c.pct * 100)}% collected, {c.unpaid.length} unpaid · spent{" "}
                        {money(sp.committed)} of {money(e.budget)} budget
                      </div>
                      <Progress value={c.pct} className="mt-2" />
                    </Link>
                  );
                })}
                {upcoming.length === 0 && <p className="py-4 text-sm text-stone-500">No upcoming events.</p>}
              </div>
            </Card>
          )}
        </div>

        <Card className="p-5">
          <h2 className="font-display text-xl">Activity</h2>
          <ul className="mt-3 space-y-3">
            {[
              ...state.payments.map((p) => ({
                id: p.id,
                at: p.at,
                text: `${state.members.find((m) => m.id === p.memberId)?.name} paid ${money(p.amount)}`,
                sub: p.ref,
              })),
              ...state.log.map((l) => ({ id: l.id, at: l.at, text: l.text, sub: "" })),
            ]
              .sort((a, b) => b.at.localeCompare(a.at))
              .slice(0, 10)
              .map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="min-w-0 flex-1">
                    <span className="text-ink">{a.text}</span>
                    {a.sub && <span className="ml-2 font-mono text-[11px] text-stone-400">{a.sub}</span>}
                    <span className="block text-xs text-stone-400">{relDays(a.at)}</span>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
