"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import OrgForm from "@/components/OrgForm";
import { useStore } from "@/lib/store";
import { Button, Card, Notice, PageHeader } from "@/components/ui";

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
