"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { isOfficer, roleLabel } from "@/lib/selectors";
import type { ModuleKey } from "@/lib/types";
import { cap, label } from "@/lib/util";
import { Avatar, OrgMark, ThemeSwitch } from "./ui";

type NavItem = { href: string; label: string; module?: ModuleKey };

// Pages anyone signed in can open. Everything else is for officers.
const OPEN_TO_ALL = ["/me", "/profile", "/receipt"];

export default function AppShell({ children }: { children: ReactNode }) {
  const { state, ready, me } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const officer = isOfficer(me);
  const allowed = officer || OPEN_TO_ALL.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (!ready) return;
    if (!state.onboarded) router.replace("/");
    else if (!me) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace("/me");
  }, [ready, state.onboarded, me, allowed, pathname, router]);

  if (!ready || !state.onboarded || !me || !allowed) return null;

  const L = label(state.org.memberLabel);
  const officerNav: NavItem[] = [
    { href: "/dashboard", label: "Overview" },
    { href: "/ledger", label: "Ledger" },
    { href: "/dues", label: "Dues", module: "dues" },
    { href: "/events", label: "Events", module: "events" },
    { href: "/reimbursements", label: "Reimbursements", module: "reimbursements" },
    { href: "/packets", label: "Funding packets", module: "packets" },
    { href: "/members", label: cap(L.many) },
    { href: "/handoff", label: "Handoff", module: "handoff" },
    { href: "/settings", label: "Settings" },
  ];
  const memberNav: NavItem[] = [
    { href: "/me", label: "My account" },
    { href: "/profile", label: "Profile" },
  ];
  const nav = (officer ? officerNav : memberNav).filter((n) => !n.module || state.org.modules[n.module]);

  return (
    <div className="min-h-dvh md:flex">
      <aside className="no-print border-b border-rule bg-paper md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 md:px-5 md:pt-6 md:pb-5">
          <Link href={officer ? "/dashboard" : "/me"} className="flex min-w-0 items-center gap-2.5">
            <OrgMark name={state.org.name} logo={state.org.logo} size={32} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight text-ink">{state.org.name}</div>
              <div className="num text-[11px] text-muted">{state.org.term}</div>
            </div>
          </Link>
          <div className="md:hidden">
            <AccountMenu up={false} />
          </div>
        </div>

        <nav className="flex gap-4 overflow-x-auto px-4 pb-2 md:flex-1 md:flex-col md:gap-0 md:overflow-visible md:px-3 md:pb-0">
          {nav.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`shrink-0 border-b-2 py-1.5 text-sm transition md:border-b-0 md:border-l-2 md:px-3 md:py-[7px] ${
                  active ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-rule px-3 py-3 md:block">
          <AccountMenu up />
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

function AccountMenu({ up }: { up: boolean }) {
  const { state, me, signOut } = useStore();
  const router = useRouter();
  const officer = isOfficer(me);
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => ref.current?.removeAttribute("open");
  if (!me) return null;
  return (
    <details ref={ref} className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-[3px] px-1 py-1 hover:bg-ink/5 [&::-webkit-details-marker]:hidden">
        <Avatar name={me.name} src={me.avatar} size={30} />
        <span className="hidden min-w-0 flex-1 md:block">
          <span className="block truncate text-sm font-medium leading-tight">{me.name}</span>
          <span className="block truncate text-xs text-muted">{roleLabel(state, me)}</span>
        </span>
        <span className="hidden text-xs text-faint md:block">⋯</span>
      </summary>
      <div
        className={`absolute z-40 w-56 rounded-[3px] border border-rule-strong bg-sheet py-1 text-sm ${
          up ? "bottom-full left-0 mb-2" : "top-full right-0 mt-2"
        }`}
      >
        <div className="border-b border-rule px-3 py-2">
          <div className="truncate font-medium">{me.name}</div>
          <div className="num truncate text-xs text-muted">{me.email}</div>
        </div>
        <Link href="/profile" onClick={close} className="block px-3 py-1.5 hover:bg-ink/5">
          Profile
        </Link>
        {officer && (
          <Link href="/me" onClick={close} className="block px-3 py-1.5 hover:bg-ink/5">
            My payments
          </Link>
        )}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5">
          <span className="text-muted">Theme</span>
          <ThemeSwitch />
        </div>
        <button
          onClick={() => {
            close();
            signOut();
            router.push("/login");
          }}
          className="block w-full border-t border-rule px-3 py-1.5 text-left hover:bg-ink/5"
        >
          Sign out
        </button>
      </div>
    </details>
  );
}
