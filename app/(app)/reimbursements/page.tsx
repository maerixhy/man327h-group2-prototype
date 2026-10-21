"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { eventName, memberName, owed } from "@/lib/selectors";
import type { ReimbStatus } from "@/lib/types";
import { addDays, entryNo, money, relDays } from "@/lib/util";
import { Button, Empty, Input, PageHeader, StatusStamp } from "@/components/ui";
import { ReceiptThumb, ReimbursementForm, Timeline } from "@/components/Reimb";

const TABS: { key: ReimbStatus; label: string }[] = [
  { key: "submitted", label: "Needs approval" },
  { key: "approved", label: "To pay back" },
  { key: "paid", label: "Paid back" },
  { key: "rejected", label: "Returned" },
];

const EMPTY: Record<ReimbStatus, string> = {
  submitted: "Queue's clear. Nobody's waiting on you.",
  approved: "Nothing owed right now. Everyone who fronted money has been paid back.",
  paid: "No paybacks yet this term.",
  rejected: "Nothing's been sent back.",
};

const PAYOUT_DAYS = 5;

export default function Reimbursements() {
  const { state, me, update, log } = useStore();
  const [tab, setTab] = useState<ReimbStatus>("submitted");
  const [showForm, setShowForm] = useState(false);
  const [payDates, setPayDates] = useState<Record<string, string>>({});
  const o = owed(state);

  const list = state.reimbursements
    .filter((r) => r.status === tab)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const setStatus = (id: string, status: ReimbStatus, extra: Record<string, string> = {}) =>
    update((s) => {
      // Paying someone back is a new entry in the book, so it takes the next number.
      const payout = status === "paid";
      return {
        ...s,
        seq: payout ? s.seq + 1 : s.seq,
        reimbursements: s.reimbursements.map((r) =>
          r.id === id ? { ...r, status, ...extra, ...(payout ? { paidNo: s.seq } : {}) } : r
        ),
      };
    });

  return (
    <>
      <PageHeader
        title="Reimbursements"
        action={
          <Button size="sm" variant={showForm ? "secondary" : "primary"} onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "Submit a receipt"}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-6">
          <ReimbursementForm onDone={() => setTab("submitted")} />
        </div>
      )}

      <div className="mb-2 flex gap-5 overflow-x-auto border-b border-rule">
        {TABS.map((t) => {
          const n = state.reimbursements.filter((r) => r.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px shrink-0 border-b-2 py-2 text-sm transition ${
                tab === t.key ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label} <span className="num text-xs text-muted">{n}</span>
            </button>
          );
        })}
      </div>
      {tab === "submitted" && o.submittedCount > 0 && (
        <div className="num mb-2 text-xs text-muted">{money(o.submitted)} waiting</div>
      )}
      {tab === "approved" && o.approvedCount > 0 && (
        <div className="num mb-2 text-xs text-muted">{money(o.approved)} owed to officers</div>
      )}

      <div>
        {list.length === 0 && <Empty>{EMPTY[tab]}</Empty>}
        {list.map((r) => {
          const defaultPay = (r.expectedBy ?? addDays(new Date().toISOString(), PAYOUT_DAYS)).slice(0, 10);
          const payDate = payDates[r.id] ?? defaultPay;
          const by = r.status === "paid" ? r.paidBy ?? r.approvedBy : r.approvedBy;
          return (
            <article key={r.id} className="border-b border-rule py-5">
              <div className="flex gap-4">
                <ReceiptThumb src={r.receipt} alt={`${r.vendor} receipt`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="num text-[11px] text-faint">{entryNo(r.no)}</div>
                      <div className="font-medium">
                        {memberName(state, r.submitterId)} fronted <span className="num">{money(r.amount)}</span>
                      </div>
                      <div className="text-sm text-muted">
                        {r.vendor} · {r.description} · {eventName(state, r.eventId)}
                      </div>
                      <div className="text-xs text-faint">Submitted {relDays(r.submittedAt)}</div>
                    </div>
                    <StatusStamp status={r.status} by={by && memberName(state, by)} />
                  </div>

                  <div className="mt-4 max-w-md">
                    <Timeline r={r} />
                  </div>

                  {r.status === "submitted" && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-sm whitespace-nowrap text-muted">
                        Pay back by
                        <Input
                          type="date"
                          value={payDate}
                          onChange={(e) => setPayDates({ ...payDates, [r.id]: e.target.value })}
                          className="num w-auto py-1 text-[13px]"
                        />
                      </label>
                      <Button
                        size="sm"
                        onClick={() => {
                          setStatus(r.id, "approved", {
                            approvedAt: new Date().toISOString(),
                            approvedBy: me?.id ?? "",
                            expectedBy: new Date(payDate + "T12:00").toISOString(),
                          });
                          log(`Approved ${memberName(state, r.submitterId)}'s ${money(r.amount)} request`);
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          const reason = window.prompt("What needs to change?", "Please attach an itemized receipt");
                          if (reason === null) return;
                          setStatus(r.id, "rejected", {
                            approvedAt: new Date().toISOString(),
                            approvedBy: me?.id ?? "",
                            rejectReason: reason,
                          });
                          log(`Returned ${memberName(state, r.submitterId)}'s ${money(r.amount)} request`);
                        }}
                      >
                        Send back
                      </Button>
                    </div>
                  )}

                  {r.status === "approved" && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setStatus(r.id, "paid", { paidAt: new Date().toISOString(), paidBy: me?.id ?? "" });
                          log(`Paid back ${memberName(state, r.submitterId)} ${money(r.amount)} for ${r.vendor}`);
                        }}
                      >
                        Mark as paid back
                      </Button>
                      <span className="text-xs text-muted">
                        Due {r.expectedBy ? relDays(r.expectedBy) : "soon"}.{" "}
                        {memberName(state, r.submitterId).split(" ")[0]} can see the date.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
