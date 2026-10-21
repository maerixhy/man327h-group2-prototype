"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { isAdmin, viewer } from "@/lib/selectors";
import type { ModuleKey } from "@/lib/types";
import { Button, Card, OrgMark } from "./ui";

type NavItem = { href: string; label: string; module?: ModuleKey };

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/ledger", label: "Ledger" },
  { href: "/dues", label: "Dues", module: "dues" },
  { href: "/events", label: "Events", module: "events" },
  { href: "/reimbursements", label: "Reimbursements", module: "reimbursements" },
  { href: "/packets", label: "Funding packets", module: "packets" },
  { href: "/handoff", label: "Handoff", module: "handoff" },
  { href: "/settings", label: "Settings" },
];

const MEMBER_NAV: NavItem[] = [{ href: "/me", label: "My account" }];

export default function AppShell({ children }: { children: ReactNode }) {
  const { state, ready, update } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !state.onboarded) router.replace("/onboarding");
  }, [ready, state.onboarded, router]);

  if (!ready || !state.onboarded) {
    return <div className="p-10 text-sm text-stone-500">Loading workspace…</div>;
  }

  const admin = isAdmin(state);
  const me = viewer(state);
  const nav = (admin ? ADMIN_NAV : MEMBER_NAV).filter((n) => !n.module || state.org.modules[n.module]);
  const blocked = !admin && pathname !== "/me";

  const switchTo = (id: string) => {
    const next = state.members.find((m) => m.id === id);
    update((s) => ({ ...s, viewAs: id }));
    if (next?.role === "member") router.push("/me");
    else if (pathname === "/me") router.push("/dashboard");
  };

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar on desktop, top bar on mobile */}
      <aside className="no-print border-b border-stone-200 bg-white md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center gap-3 px-4 py-4 md:px-5 md:py-6">
          <OrgMark name={state.org.name} logo={state.org.logo} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink">{state.org.name}</div>
            <div className="text-xs text-stone-500">{state.org.term}</div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {nav.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm transition ${
                  active ? "bg-brand-soft font-medium text-brand" : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-100 px-4 py-3 md:absolute md:bottom-0 md:w-64 md:px-5 md:py-5">
          <label className="block text-[11px] font-medium uppercase tracking-wide text-stone-400">
            Demo: viewing as
          </label>
          <select
            value={me.id}
            onChange={(e) => switchTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-sm"
          >
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.role !== "member" ? ` (${m.title ?? m.role})` : ""}
              </option>
            ))}
          </select>
          <div className="mt-3 hidden items-center gap-1.5 text-xs text-stone-400 md:flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" /> Powered by Paper Trail
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-10 md:py-10">
        {blocked ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-stone-600">
              This page is for the board. You&apos;re viewing as {me.name}, a general member.
            </p>
            <Button className="mt-4" onClick={() => router.push("/me")}>
              Go to my account
            </Button>
          </Card>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
