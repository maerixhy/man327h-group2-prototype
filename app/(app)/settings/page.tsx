"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import OrgForm from "@/components/OrgForm";
import { useStore } from "@/lib/store";
import { Button, Card, Notice, PageHeader } from "@/components/ui";
import { COMING_IN_V2, PRO_PRICE } from "@/lib/features";
import UpgradeDialog, { PLANS } from "@/components/Upgrade";
import { longDate, money } from "@/lib/util";

export default function Settings() {
  const { state, me, update, log, reset } = useStore();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  const plan = state.org.plan;
  const setPlan = (p: "free" | "pro") => {
    update((s) => ({
      ...s,
      org: { ...s.org, plan: p, proBilling: p === "pro" ? (s.org.proBilling ?? "semester") : s.org.proBilling },
    }));
    log(`Switched to the ${p === "pro" ? "Pro" : "Free"} plan`);
  };

  return (
    <>
      <PageHeader title="Settings" />

      <section className="mb-8 rounded-[3px] border border-rule bg-sheet p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Plan</h2>
            <div className="mt-2 text-xl font-medium">
              {plan === "pro" ? "Pro" : "Free"}
              {plan === "pro" && (
                <span className="num ml-2 text-sm font-normal text-muted">
                  {money(PRO_PRICE[state.org.proBilling ?? "semester"])}/{state.org.proBilling ?? "semester"}
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-muted">{(plan === "pro" ? PLANS.pro : PLANS.free).join(" · ")}</div>
            {state.org.depositAt && (
              <div className="num mt-1 text-xs text-muted">$5 deposit held {longDate(state.org.depositAt)}</div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className="inline-flex rounded-[3px] border border-rule-strong p-0.5"
              role="radiogroup"
              aria-label="Plan"
            >
              {(["free", "pro"] as const).map((p) => (
                <button
                  key={p}
                  role="radio"
                  aria-checked={plan === p}
                  onClick={() => setPlan(p)}
                  className={`rounded-[2px] px-3 py-1 text-sm ${plan === p ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
                >
                  {p === "pro" ? "Pro" : "Free"}
                </button>
              ))}
            </div>
            {plan === "free" && (
              <button onClick={() => setUpgrade(true)} className="text-xs font-medium text-brand-ink hover:underline">
                See Pro plans →
              </button>
            )}
          </div>
        </div>
      </section>
      {upgrade && <UpgradeDialog onClose={() => setUpgrade(false)} />}
      {saved && (
        <div className="mb-4">
          <Notice tone="brand">Saved.</Notice>
        </div>
      )}
      <OrgForm
        key={state.org.name + state.org.color}
        initial={state.org}
        submitLabel="Save changes"
        onSubmit={(org) => {
          update((s) => ({ ...s, org }));
          log("Updated workspace settings");
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      />
      <Card className="mt-10 p-5 md:p-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Coming in v2</h2>
        <div className="mt-4 -mb-2 divide-y divide-rule">
          {COMING_IN_V2.map((f) => (
            <label key={f.name} className="flex cursor-not-allowed items-start gap-3 py-2.5 opacity-60">
              <input type="checkbox" disabled className="mt-0.5 h-4 w-4" />
              <span>
                <span className="block text-sm font-medium">{f.name}</span>
                <span className="block text-[13px] text-muted">{f.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      {me?.role === "treasurer" && (
        <Card className="mt-10 flex flex-wrap items-center justify-between gap-3 border-red-ink/40 p-5">
          <div>
            <div className="font-medium">Delete workspace</div>
            <div className="text-sm text-muted">
              Erases the ledger, receipts, and every account. This can&apos;t be undone.
            </div>
          </div>
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm(`Delete ${state.org.name} and everything in it?`)) return;
              reset();
              router.push("/");
            }}
          >
            Delete workspace
          </Button>
        </Card>
      )}
    </>
  );
}
