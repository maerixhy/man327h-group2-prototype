"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { eventName, isOfficer, memberName, memberObligations, memberTotals, tagName, tagPath } from "@/lib/selectors";
import { entryNo, money, relDays, shortDate } from "@/lib/util";
import { ButtonLink, Caption, PageHeader, SectionTitle, Stamp, StatusStamp } from "@/components/ui";
import { Timeline } from "@/components/Reimb";

export default function Me() {
  const { state, me } = useStore();
  if (!me) return null;
  const totals = memberTotals(state, me.id);
  const due = memberObligations(state, me.id).filter((o) => !o.payment && !o.past);
  const paid = [...totals.payments].sort((a, b) => b.at.localeCompare(a.at));
  const mine = isOfficer(me)
    ? state.reimbursements.filter((r) => r.submitterId === me.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    : [];

  return (
    <>
      <PageHeader title="My account" />

      <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
        <div>
          <Caption>Paid this term</Caption>
          <div className="num mt-1 text-[44px] font-medium leading-none tracking-[-0.03em]">{money(totals.total)}</div>
        </div>
        <div className="sm:text-right">
          <Caption>Still to pay</Caption>
          <div className={`num mt-1 text-[44px] font-medium leading-none tracking-[-0.03em] ${due.length ? "" : "text-muted"}`}>
            {money(due.reduce((a, o) => a + o.price, 0))}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <SectionTitle>Coming up</SectionTitle>
        {due.length === 0 ? (
          <p className="py-4 text-sm italic text-muted">You&apos;re all paid up. Nothing owed to {state.org.name}.</p>
        ) : (
          <ul>
            {due.map((o) => (
              <li key={o.name} className="flex items-center justify-between gap-3 border-b border-rule py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium">{o.name}</span>
                  {o.date && (
                    <span className="num block text-xs text-muted">
                      {shortDate(o.date)} · {relDays(o.date)}
                    </span>
                  )}
                </span>
                <ButtonLink href={tagPath(o.tag)} size="sm">
                  Pay <span className="num">{money(o.price)}</span>
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <SectionTitle aside={<span className="num">{paid.length}</span>}>Paid</SectionTitle>
        {paid.length === 0 ? (
          <p className="py-4 text-sm italic text-muted">No payments on file yet.</p>
        ) : (
          <ul>
            {paid.map((p) => (
              <li key={p.id} className="border-b border-rule">
                <Link href={`/receipt/${p.id}`} className="flex items-center gap-3 py-3 text-sm hover:bg-ink/[0.03]">
                  <span className="num hidden w-16 shrink-0 text-[11px] text-faint sm:block">{entryNo(p.no)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{tagName(state, p.tag)}</span>
                    <span className="num block text-[11px] text-muted">
                      {shortDate(p.at)} · {p.via}
                    </span>
                  </span>
                  <Stamp tilt={-5} className="hidden sm:inline-flex">
                    Paid
                  </Stamp>
                  <span className="num w-16 shrink-0 text-right text-[13px]">{p.amount.toFixed(2)}</span>
                  <span className="text-xs text-muted">Receipt →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {mine.length > 0 && (
        <section className="mt-10">
          <SectionTitle aside={<Link href="/reimbursements" className="hover:text-ink">Queue →</Link>}>
            My reimbursements
          </SectionTitle>
          <ul>
            {mine.map((r) => (
              <li key={r.id} className="border-b border-rule py-4">
                <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
                  <span>
                    <span className="num font-medium">{money(r.amount)}</span> · {r.vendor}
                    <span className="block text-xs text-muted">
                      {eventName(state, r.eventId)} · sent {relDays(r.submittedAt)}
                    </span>
                  </span>
                  <StatusStamp status={r.status} by={r.approvedBy && memberName(state, r.approvedBy)} />
                </div>
                <div className="mt-3 max-w-md">
                  <Timeline r={r} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
