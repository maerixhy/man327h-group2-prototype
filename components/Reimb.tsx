"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Reimbursement } from "@/lib/types";
import { fileToDataUrl, money, shortDate, uid } from "@/lib/util";
import { Button, Card, Field, Input, Select } from "./ui";

export function ReceiptThumb({ src, alt }: { src: string | null; alt: string }) {
  const [open, setOpen] = useState(false);
  if (!src)
    return (
      <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-red-300 bg-red-50 text-center text-[10px] leading-tight text-red-600">
        No receipt
      </div>
    );
  return (
    <>
      <button onClick={() => setOpen(true)} className="shrink-0" aria-label={`View receipt: ${alt}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-16 w-12 rounded-lg border border-stone-200 object-cover" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-full max-w-full rounded-xl bg-white shadow-2xl" />
        </div>
      )}
    </>
  );
}

// Submitted → Approved → Paid, with the expected payback date front and center.
export function Timeline({ r }: { r: Reimbursement }) {
  if (r.status === "rejected")
    return (
      <p className="text-sm text-red-700">
        Sent back {shortDate(r.approvedAt)}: {r.rejectReason || "needs changes"}. Fix it and submit again.
      </p>
    );
  const steps = [
    { label: "Submitted", date: r.submittedAt, done: true },
    { label: "Approved", date: r.approvedAt, done: r.status !== "submitted" },
    {
      label: r.status === "paid" ? "Paid back" : r.expectedBy ? `Expected by ${shortDate(r.expectedBy)}` : "Paid back",
      date: r.paidAt,
      done: r.status === "paid",
    },
  ];
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => (
        <li key={s.label} className="flex flex-1 flex-col items-start">
          <div className="flex w-full items-center">
            <span
              className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                s.done ? "border-brand bg-brand" : "border-stone-300 bg-white"
              }`}
            />
            {i < steps.length - 1 && (
              <span className={`h-0.5 flex-1 ${steps[i + 1].done ? "bg-brand" : "bg-stone-200"}`} />
            )}
          </div>
          <span className={`mt-1.5 text-xs ${s.done ? "text-ink" : "text-stone-400"}`}>{s.label}</span>
          {s.date && s.done && <span className="text-[11px] text-stone-400">{shortDate(s.date)}</span>}
        </li>
      ))}
    </ol>
  );
}

export function ReimbursementForm({ onDone }: { onDone?: () => void }) {
  const { state, update, log } = useStore();
  const [f, setF] = useState({ eventId: state.events[0]?.id ?? "", vendor: "", description: "", amount: "" });
  const [receipt, setReceipt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const amount = Number(f.amount);
  const ok = f.vendor && f.description && amount > 0;

  const submit = () => {
    if (!ok) return;
    update((s) => ({
      ...s,
      reimbursements: [
        {
          id: uid(),
          submitterId: s.viewAs,
          eventId: f.eventId || null,
          vendor: f.vendor,
          description: f.description,
          amount,
          receipt,
          status: "submitted",
          submittedAt: new Date().toISOString(),
        },
        ...s.reimbursements,
      ],
    }));
    log(`New reimbursement request: ${money(amount)} at ${f.vendor}`);
    setF({ ...f, vendor: "", description: "", amount: "" });
    setReceipt(null);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
    onDone?.();
  };

  return (
    <Card className="space-y-4 p-5">
      <h3 className="font-display text-xl">Get paid back</h3>
      <Field label="Receipt photo" hint="snap it at the register">
        <div className="flex items-center gap-3">
          <ReceiptThumb src={receipt} alt="New receipt" />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="w-full min-w-0 text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand"
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
        <p className="text-xs text-amber-700">
          No receipt yet. Requests without one get flagged before they go into a funding packet.
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={!ok || busy}>
          Submit {amount > 0 ? money(amount) : ""}
        </Button>
        {done && <span className="text-sm text-brand">Sent to the treasurer. Track it below.</span>}
      </div>
    </Card>
  );
}
