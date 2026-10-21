"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { addReimbursement } from "@/lib/selectors";
import type { Reimbursement } from "@/lib/types";
import { fileToDataUrl, money, shortDate, uid } from "@/lib/util";
import { Button, Card, Field, Input, Select } from "./ui";

export function ReceiptThumb({ src, alt }: { src: string | null; alt: string }) {
  const [open, setOpen] = useState(false);
  if (!src)
    return (
      <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-[2px] border border-dashed border-red-ink/60 text-center text-[10px] leading-tight text-red-ink">
        No receipt
      </div>
    );
  return (
    <>
      <button onClick={() => setOpen(true)} className="shrink-0" aria-label={`View receipt: ${alt}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-16 w-12 rounded-[2px] border border-rule object-cover" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-full max-w-full rounded-[2px] bg-white" />
        </div>
      )}
    </>
  );
}

// Submitted → Approved → Paid, with the expected payback date front and center.
export function Timeline({ r }: { r: Reimbursement }) {
  if (r.status === "rejected")
    return (
      <p className="text-sm text-red-ink">
        Returned {shortDate(r.approvedAt)}: {r.rejectReason || "needs changes"}. Fix it and submit again.
      </p>
    );
  const steps = [
    { label: "Submitted", date: r.submittedAt, done: true },
    { label: "Approved", date: r.approvedAt, done: r.status !== "submitted" },
    {
      label: r.status === "paid" ? "Paid back" : r.expectedBy ? `Due ${shortDate(r.expectedBy)}` : "Paid back",
      date: r.paidAt,
      done: r.status === "paid",
    },
  ];
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => (
        <li key={s.label} className="flex flex-1 flex-col items-start">
          <div className="flex w-full items-center">
            <span className={`h-2.5 w-2.5 shrink-0 rotate-45 border ${s.done ? "border-ink bg-ink" : "border-rule-strong bg-sheet"}`} />
            {i < steps.length - 1 && (
              <span className={`h-px flex-1 ${steps[i + 1].done ? "bg-ink" : "border-t border-dashed border-rule-strong"}`} />
            )}
          </div>
          <span className={`mt-1.5 text-xs ${s.done ? "text-ink" : "text-muted"}`}>{s.label}</span>
          {s.date && s.done && <span className="num text-[11px] text-muted">{shortDate(s.date)}</span>}
        </li>
      ))}
    </ol>
  );
}

export function ReimbursementForm({ onDone }: { onDone?: () => void }) {
  const { state, me, update, log } = useStore();
  const [f, setF] = useState({ eventId: state.events[0]?.id ?? "", vendor: "", description: "", amount: "" });
  const [receipt, setReceipt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const amount = Number(f.amount);
  const ok = me && f.vendor && f.description && amount > 0;

  const submit = () => {
    if (!ok) return;
    update((s) =>
      addReimbursement(s, {
        id: uid(),
        submitterId: me.id,
        eventId: f.eventId || null,
        vendor: f.vendor,
        description: f.description,
        amount,
        receipt,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      })
    );
    log(`New reimbursement request: ${money(amount)} at ${f.vendor}`);
    setF({ ...f, vendor: "", description: "", amount: "" });
    setReceipt(null);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
    onDone?.();
  };

  return (
    <Card className="space-y-4 p-5">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Get paid back</h3>
      <Field label="Receipt photo" hint="snap it at the register">
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="For">
          <Select value={f.eventId} onChange={(e) => setF({ ...f, eventId: e.target.value })}>
            {state.events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
            <option value="">General, not one event</option>
          </Select>
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
        <Field label="Store or vendor">
          <Input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} placeholder="H-E-B" />
        </Field>
        <Field label="What was it for?">
          <Input
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
            placeholder="Snacks for the meeting"
          />
        </Field>
      </div>
      {!receipt && ok && (
        <p className="text-xs text-red-ink">No receipt yet. Funders will ask for one, so this line gets flagged in the packet.</p>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={!ok || busy}>
          Submit {amount > 0 ? money(amount) : ""}
        </Button>
        {done && <span className="text-sm text-muted">Submitted. It&apos;s in the queue below.</span>}
      </div>
    </Card>
  );
}
