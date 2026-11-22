"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PRO_PRICE } from "@/lib/features";
import { money } from "@/lib/util";
import { Button } from "./ui";

export const PLANS = {
  free: ["Event payment links", "Shared balance and ledger", "Venmo statement matching"],
  pro: ["Everything in Free", "Funding packets: print, PDF, and CSV", "Pre-submission check before you file"],
};

// Pro is held with a $5 refundable deposit. Nothing is charged here: holding a spot marks the group as Pro.
export default function UpgradeDialog({ onClose, reason }: { onClose: () => void; reason?: string }) {
  const { state, update, log } = useStore();
  const [billing, setBilling] = useState<"semester" | "year">("semester");

  const hold = () => {
    const at = new Date().toISOString();
    update((s) => ({ ...s, org: { ...s.org, plan: "pro", proBilling: billing, depositAt: at } }));
    log(`Held a Pro spot (${money(PRO_PRICE[billing])}/${billing}) with a $5 refundable deposit`);
    onClose();
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 md:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade to Pro"
        className="w-full max-w-[640px] rounded-[3px] border border-rule-strong bg-sheet p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b-[3px] border-double border-ink pb-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Funding packets are a Pro feature</h2>
            {reason && <p className="mt-1 text-sm text-muted">{reason}</p>}
          </div>
          <button onClick={onClose} className="text-sm text-muted hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[3px] border border-rule p-4">
            <div className="text-[13px] font-semibold uppercase tracking-[0.08em]">Free</div>
            <div className="num mt-1 text-2xl font-medium">$0</div>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              {PLANS.free.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            {state.org.plan === "free" && <div className="mt-4 text-xs text-muted">Your current plan</div>}
          </div>
          <div className="rounded-[3px] border-2 border-ink p-4">
            <div className="flex items-baseline justify-between">
              <div className="text-[13px] font-semibold uppercase tracking-[0.08em]">Pro</div>
              <div className="inline-flex rounded-[3px] border border-rule-strong p-0.5 text-xs" role="radiogroup">
                {(["semester", "year"] as const).map((b) => (
                  <button
                    key={b}
                    role="radio"
                    aria-checked={billing === b}
                    onClick={() => setBilling(b)}
                    className={`rounded-[2px] px-2 py-0.5 ${billing === b ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
                  >
                    {b === "semester" ? "Semester" : "Year"}
                  </button>
                ))}
              </div>
            </div>
            <div className="num mt-1 text-2xl font-medium">
              {money(PRO_PRICE[billing]).replace(".00", "")}
              <span className="text-sm text-muted">/{billing}</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {PLANS.pro.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={hold}>Hold your spot with a $5 refundable deposit</Button>
          <span className="text-xs text-muted">Refunded in full if you don&apos;t continue with Pro.</span>
        </div>
      </div>
    </div>
  );
}
