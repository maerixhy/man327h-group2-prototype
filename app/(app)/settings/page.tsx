"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import OrgForm from "@/components/OrgForm";
import { useStore } from "@/lib/store";
import { Button, Card, PageHeader } from "@/components/ui";

export default function Settings() {
  const { state, update, log, reset } = useStore();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader title="Settings" sub="Branding, money basics, and which tabs your group sees." />
      {saved && (
        <div className="mb-4 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">Saved.</div>
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
      <Card className="mt-10 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <div className="font-medium">Reset demo</div>
          <div className="text-sm text-stone-500">Wipes this browser&apos;s demo data and starts over.</div>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            if (!window.confirm("Reset all demo data?")) return;
            reset();
            router.push("/onboarding");
          }}
        >
          Reset demo
        </Button>
      </Card>
    </>
  );
}
