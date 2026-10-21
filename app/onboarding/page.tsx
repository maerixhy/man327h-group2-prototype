"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import OrgForm from "@/components/OrgForm";
import { useStore } from "@/lib/store";

export default function Onboarding() {
  const { state, ready, update, log } = useStore();
  const router = useRouter();

  if (!ready) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <Link href="/" className="text-sm text-stone-500 hover:text-ink">
        ← Paper Trail
      </Link>
      <h1 className="font-display mt-4 text-4xl tracking-tight">Set up your workspace</h1>
      <p className="mt-2 max-w-xl text-stone-600">
        Make it look like your group, and keep only the tabs you need. You can change all of this
        later in Settings.
      </p>
      <div className="mt-8">
        <OrgForm
          initial={state.org}
          submitLabel="Create workspace"
          onSubmit={(org) => {
            update((s) => ({ ...s, org, onboarded: true }));
            log(`Workspace created for ${org.name}`);
            router.push("/dashboard");
          }}
        />
      </div>
    </div>
  );
}
