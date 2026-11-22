"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { addReimbursement, memberName } from "@/lib/selectors";
import { fileToDataUrl, money, uid } from "@/lib/util";
import { Button, Card, Field, Input, Select } from "./ui";
import { ReceiptThumb } from "./Reimb";

// v1 replaces the reimbursement queue with a plain expense form. Lines are saved already approved,
// in the same shape the funding packet reads, so the queue can come back in v2 without a migration.
export function ExpenseForm({ eventId, chooseEvent = false }: { eventId?: string; chooseEvent?: boolean }) {
  const { state, me, update, log } = useStore();
  const [f, setF] = useState({ eventId: eventId ?? state.events[0]?.id ?? "", vendor: "", amount: "", purpose: "" });
  const [receipt, setReceipt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const amount = Number(f.amount);
  const target = eventId ?? f.eventId;
  const ok = me && f.vendor.trim() && f.purpose.trim() && amount > 0;

  const add = () => {
    if (!ok) return;
    const now = new Date().toISOString();
    update((s) =>
      addReimbursement(s, {
        id: uid(),
        submitterId: me.id,
        eventId: target || null,
        vendor: f.vendor.trim(),
        description: f.purpose.trim(),
        amount,
        receipt,
        status: "approved",
        submittedAt: now,
        approvedAt: now,
        approvedBy: me.id,
      })
    );
    log(`Added a ${money(amount)} expense at ${f.vendor.trim()}`);
    setF({ ...f, vendor: "", amount: "", purpose: "" });
    setReceipt(null);
  };

  return (
    <Card className="space-y-4 p-5">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Add expense</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {chooseEvent && (
          <Field label="Event">
            <Select value={f.eventId} onChange={(e) => setF({ ...f, eventId: e.target.value })}>
              {state.events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Vendor">
          <Input value={f.vendor} placeholder="H-E-B" onChange={(e) => setF({ ...f, vendor: e.target.value })} />
        </Field>
        <Field label="Amount">
          <Input
            inputMode="decimal"
            placeholder="0.00"
            className="num"
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^0-9.]/g, "") })}
          />
        </Field>
        <Field label="Purpose">
          <Input
            value={f.purpose}
            placeholder="Snacks for the meeting"
            onChange={(e) => setF({ ...f, purpose: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Receipt" hint="photo or scan">
        <div className="flex items-center gap-3">
          <ReceiptThumb src={receipt} alt="New receipt" />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="w-full min-w-0 text-sm text-muted file:mr-3 file:rounded-[3px] file:border file:border-rule-strong file:bg-sheet file:px-3 file:py-1.5 file:text-sm file:text-ink"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                setReceipt(await fileToDataUrl(file));
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      </Field>
      <Button onClick={add} disabled={!ok || busy || (!target && chooseEvent)}>
        Add {amount > 0 ? money(amount) : "expense"}
      </Button>
    </Card>
  );
}

export function ExpenseList({ eventId }: { eventId: string }) {
  const { state, update, log } = useStore();
  const lines = state.reimbursements
    .filter((r) => r.eventId === eventId && r.status !== "rejected")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const total = lines.reduce((a, r) => a + r.amount, 0);

  return (
    <ul>
      {lines.map((r) => (
        <li key={r.id} className="flex items-center gap-3 border-b border-rule py-2.5 text-sm">
          <ReceiptThumb src={r.receipt} alt={`${r.vendor} receipt`} />
          <span className="min-w-0 flex-1">
            <span className="num mr-2 text-[11px] text-faint">{String(r.no).padStart(4, "0")}</span>
            {r.vendor} <span className="text-muted">· {r.description}</span>
            <span className="block text-xs text-muted">Added by {memberName(state, r.submitterId)}</span>
          </span>
          <span className="num w-20 shrink-0 text-right text-[13px]">{r.amount.toFixed(2)}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (!window.confirm(`Remove the ${money(r.amount)} ${r.vendor} expense?`)) return;
              update((s) => ({ ...s, reimbursements: s.reimbursements.filter((x) => x.id !== r.id) }));
              log(`Removed the ${money(r.amount)} ${r.vendor} expense`);
            }}
          >
            Remove
          </Button>
        </li>
      ))}
      {lines.length === 0 ? (
        <li className="py-3 text-sm italic text-muted">No expenses yet. Add each receipt as you spend it.</li>
      ) : (
        <li className="num flex justify-end gap-3 py-2 text-sm">
          <span className="text-muted">Total</span>
          <span className="font-medium">{money(total)}</span>
        </li>
      )}
    </ul>
  );
}
