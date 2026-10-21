"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { balance, collection, eventSpend, memberName, owed } from "@/lib/selectors";
import { cap, entryNo, initials, label, longDate, money, relDays, shortDate, time } from "@/lib/util";
import { Caption, Empty, Progress, SectionTitle } from "@/components/ui";
import PaymentLink from "@/components/PaymentLink";

export default function Dashboard() {
  const { state, me } = useStore();
  const o = owed(state);
  const dues = collection(state, { kind: "dues" });
  const L = label(state.org.memberLabel);
  const now = new Date().toISOString();
  const upcoming = [...state.events]
    .filter((e) => new Date(e.date) > new Date())
    .sort((a, b) => a.date.localeCompare(b.date));

  const figures = [
    { k: "Owed to officers", v: money(o.approved), s: `${o.approvedCount} approved` },
    { k: "Awaiting approval", v: money(o.submitted), s: `${o.submittedCount} in queue`, href: "/reimbursements" },
    ...(state.org.modules.dues ? [{ k: "Dues collected", v: `${Math.round(dues.pct * 100)}%`, s: `${dues.unpaid.length} unpaid`, href: "/dues" }] : []),
    { k: cap(L.many), v: String(state.members.length), s: state.org.term, href: "/members" },
  ];

  const activity = [
    ...state.payments.map((p) => ({
      id: p.id,
      no: p.no as number | undefined,
      at: p.at,
      text: `${memberName(state, p.memberId)}`,
      sub: p.ref,
      amount: p.amount,
      by: undefined as string | undefined,
    })),
    ...state.reimbursements
      .filter((r) => r.status === "paid")
      .map((r) => ({
        id: r.id + "-out",
        no: r.paidNo ?? r.no,
        at: r.paidAt ?? r.submittedAt,
        text: `Paid back ${memberName(state, r.submitterId)}`,
        sub: r.vendor,
        amount: -r.amount,
        by: r.paidBy,
      })),
    ...state.log
      .filter((l) => !/^(Paid back|.* paid .* through the link)/.test(l.text))
      .map((l) => ({ id: l.id, no: undefined, at: l.at, text: l.text, sub: "", amount: 0, by: l.by })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  return (
    <>
      {/* Statement header */}
      <div className="border-b-[3px] border-double border-ink pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Caption>Balance</Caption>
          <div className="num text-[11px] text-muted">
            as of {longDate(now)}, {time(now)}
          </div>
        </div>
        <div className="num mt-1 text-[56px] font-medium leading-none tracking-[-0.04em] md:text-[76px]">
          {money(balance(state))}
        </div>
        <div className="mt-2 text-sm text-muted">Welcome back, {me?.name.split(" ")[0]}.</div>
      </div>

      <dl className="grid grid-cols-2 border-b border-rule md:grid-cols-4">
        {figures.map((f, i) => {
          const body = (
            <>
              <dt className="text-xs text-muted">{f.k}</dt>
              <dd className="num mt-0.5 text-xl font-medium">{f.v}</dd>
              <dd className="text-xs text-faint">{f.s}</dd>
            </>
          );
          const cls = `block py-3 pr-3 ${i % 2 ? "border-l border-rule pl-4" : ""} ${
            i > 0 ? "md:border-l md:border-rule md:pl-4" : ""
          }`;
          return f.href ? (
            <Link key={f.k} href={f.href} className={`${cls} hover:bg-ink/[0.03]`}>
              {body}
            </Link>
          ) : (
            <div key={f.k} className={cls}>
              {body}
            </div>
          );
        })}
      </dl>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-w-0 space-y-10">
          {state.org.modules.dues && (
            <section>
              <SectionTitle aside={<Link href="/dues" className="hover:text-ink">Open →</Link>}>
                {state.org.term} dues
              </SectionTitle>
              <div className="mt-3 flex items-baseline justify-between gap-4">
                <div className="num text-sm">
                  {money(dues.collected)} <span className="text-muted">of {money(dues.target)}</span>
                </div>
                <div className="num text-sm text-muted">
                  {dues.paidCount}/{state.members.length} paid
                </div>
              </div>
              <Progress value={dues.pct} className="mt-2" />
              <div className="mt-4">
                <PaymentLink path="/pay/dues" />
              </div>
            </section>
          )}

          {state.org.modules.events && (
            <section>
              <SectionTitle aside={<Link href="/events" className="hover:text-ink">All events →</Link>}>
                Upcoming events
              </SectionTitle>
              {upcoming.length === 0 ? (
                <div className="mt-3">
                  <Empty>Nothing on the calendar. Add the next event and its payment link goes out with it.</Empty>
                </div>
              ) : (
                <table className="mt-1 w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                      <th className="py-2 font-medium">Event</th>
                      <th className="py-2 font-medium">Date</th>
                      <th className="py-2 text-right font-medium">Collected</th>
                      <th className="hidden py-2 text-right font-medium sm:table-cell">Spent / budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((e) => {
                      const c = collection(state, { kind: "event", eventId: e.id });
                      const sp = eventSpend(state, e.id);
                      return (
                        <tr key={e.id} className="border-t border-rule">
                          <td className="py-2.5">
                            <Link href={`/events/${e.id}`} className="font-medium hover:underline">
                              {e.name}
                            </Link>
                            <div className="text-xs text-muted">{c.unpaid.length} unpaid</div>
                          </td>
                          <td className="num py-2.5 text-[13px] text-muted">
                            {shortDate(e.date)}
                            <div className="font-sans text-xs text-faint">{relDays(e.date)}</div>
                          </td>
                          <td className="num py-2.5 text-right text-[13px]">{Math.round(c.pct * 100)}%</td>
                          <td className="num hidden py-2.5 text-right text-[13px] sm:table-cell">
                            {money(sp.committed)} <span className="text-muted">/ {money(e.budget)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>

        <section className="min-w-0">
          <SectionTitle aside={<Link href="/ledger" className="hover:text-ink">Ledger →</Link>}>Recent entries</SectionTitle>
          <ul>
            {activity.map((a) => (
              <li key={a.id} className="flex items-baseline gap-3 border-b border-rule py-2 text-sm">
                <span className="num w-[52px] shrink-0 text-[11px] text-faint">
                  {a.no ? String(a.no).padStart(4, "0") : "—"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{a.text}</span>
                  <span className="num block truncate text-[11px] text-muted">
                    {relDays(a.at)}
                    {a.sub && ` · ${a.sub}`}
                    {a.by && ` · ${initials(memberName(state, a.by))}`}
                  </span>
                </span>
                {a.amount !== 0 && (
                  <span className={`num shrink-0 text-[13px] ${a.amount < 0 ? "text-red-ink" : ""}`}>
                    {a.amount < 0 ? "−" : "+"}
                    {money(Math.abs(a.amount)).replace("$", "")}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="num mt-2 text-[11px] text-faint">Last entry {activity[0] ? entryNo(Math.max(...activity.map((a) => a.no ?? 0))) : "—"}</div>
        </section>
      </div>
    </>
  );
}
