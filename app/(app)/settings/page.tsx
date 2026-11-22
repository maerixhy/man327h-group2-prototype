"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import OrgForm from "@/components/OrgForm";
import { useStore } from "@/lib/store";
import { Button, Card, Notice, PageHeader } from "@/components/ui";
import { COMING_IN_V2 } from "@/lib/features";

export default function Settings() {
  const { state, me, update, log, reset } = useStore();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader title="Settings" />
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
            <div className="text-sm text-muted">Erases the ledger, receipts, and every account. This can&apos;t be undone.</div>
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
