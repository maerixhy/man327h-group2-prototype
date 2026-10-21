"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { eventName, memberName, owed } from "@/lib/selectors";
import type { ReimbStatus } from "@/lib/types";
import { addDays, money, relDays } from "@/lib/util";
import { Button, Card, Empty, Input, PageHeader, StatusBadge } from "@/components/ui";
import { ReceiptThumb, ReimbursementForm, Timeline } from "@/components/Reimb";

const TABS: { key: ReimbStatus; label: string }[] = [
  { key: "submitted", label: "Needs approval" },
  { key: "approved", label: "Approved, to pay" },
  { key: "paid", label: "Paid back" },
  { key: "rejected", label: "Sent back" },
];

const PAYOUT_DAYS = 5;

export default function Reimbursements() {
  const { state, update, log } = useStore();
  const [tab, setTab] = useState<ReimbStatus>("submitted");
  const [showForm, setShowForm] = useState(false);
  const [payDates, setPayDates] = useState<Record<string, string>>({});
  const o = owed(state);

  const list = state.reimbursements
    .filter((r) => r.status === tab)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const setStatus = (id: string, status: ReimbStatus, extra: Record<string, string> = {}) =>
    update((s) => ({
      ...s,
      reimbursements: s.reimbursements.map((r) => (r.id === id ? { ...r, status, ...extra } : r)),
    }));

  return (
    <>
      <PageHeader
        title="Reimbursements"
        sub={`${money(o.submitted)} waiting for approval · ${money(o.approved)} approved and scheduled`}
        action={
          <Button variant={showForm ? "secondary" : "primary"} onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "Submit a receipt"}
          </Button>
        }
      />

      {showForm && (
        <div className="mb-6">
          <ReimbursementForm onDone={() => setTab("submitted")} />
        </div>
      )}

      <div className="mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const n = state.reimbursements.filter((r) => r.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
                tab === t.key ? "bg-brand text-on-brand" : "bg-white text-stone-600 ring-1 ring-stone-200"
              }`}
            >
              {t.label} <span className="opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {list.length === 0 && <Empty>Nothing here right now.</Empty>}
        {list.map((r) => {
          const defaultPay = (r.expectedBy ?? addDays(new Date().toISOString(), PAYOUT_DAYS)).slice(0, 10);
          const payDate = payDates[r.id] ?? defaultPay;
          return (
            <Card key={r.id} className="p-4 md:p-5">
              <div className="flex gap-4">
                <ReceiptThumb src={r.receipt} alt={`${r.vendor} receipt`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {memberName(state, r.submitterId)} fronted{" "}
                        <span className="tabular">{money(r.amount)}</span>
                      </div>
                      <div className="text-sm text-stone-600">
                        {r.vendor} · {r.description} · {eventName(state, r.eventId)}
                      </div>
                      <div className="text-xs text-stone-400">Submitted {relDays(r.submittedAt)}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="mt-4 max-w-md">
                    <Timeline r={r} />
                  </div>

                  {r.status === "submitted" && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-stone-600">
                        Pay back by
                        <Input
                          type="date"
                          value={payDate}
                          onChange={(e) => setPayDates({ ...payDates, [r.id]: e.target.value })}
                          className="w-auto py-1.5"
                        />
                      </label>
                      <Button
                        size="sm"
                        onClick={() => {
                          setStatus(r.id, "approved", {
                            approvedAt: new Date().toISOString(),
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
                          setStatus(r.id, "rejected", { approvedAt: new Date().toISOString(), rejectReason: reason });
                          log(`Sent back ${memberName(state, r.submitterId)}'s ${money(r.amount)} request`);
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
                          setStatus(r.id, "paid", { paidAt: new Date().toISOString() });
                          log(`Paid back ${memberName(state, r.submitterId)} ${money(r.amount)} for ${r.vendor}`);
                        }}
                      >
                        Mark as paid back
                      </Button>
                      <span className="text-xs text-stone-500">
                        {memberName(state, r.submitterId).split(" ")[0]} can see this is due{" "}
                        {r.expectedBy ? relDays(r.expectedBy) : "soon"}.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
