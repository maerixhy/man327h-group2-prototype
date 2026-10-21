"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

const FEATURES = [
  {
    k: "01",
    t: "Every payment arrives tagged",
    d: "Members pay through a link that opens Venmo with the amount and a tag code filled in. No retagging by hand.",
  },
  {
    k: "02",
    t: "One queue for paybacks",
    d: "Snap a receipt, see where your money is and the date it's coming back. Fronting costs stops being a gamble.",
  },
  {
    k: "03",
    t: "Funding packets, built for you",
    d: "Itemized requests in the format your funding office or grant funder wants, with missing receipts flagged first.",
  },
  {
    k: "04",
    t: "Handoff in one click",
    d: "The next treasurer inherits the full ledger, receipts, and open requests, not a mystery spreadsheet.",
  },
];

export default function Landing() {
  const { state, ready, reset } = useStore();

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={30} height={30} />
          <span className="font-display text-xl">Paper Trail</span>
        </div>
        {ready && state.onboarded && (
          <Link href="/dashboard" className="text-sm font-medium text-stone-600 hover:text-ink">
            Open workspace →
          </Link>
        )}
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 md:pt-20">
        <p className="text-sm font-medium tracking-wide text-[#1f6f5c]">
          For student orgs, PTAs, teams, and small nonprofits
        </p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl leading-[1.05] tracking-tight md:text-7xl">
          Your treasurer&apos;s Venmo shouldn&apos;t be your group&apos;s bank.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-stone-600">
          Paper Trail is a shared money ledger that sits on top of the payment apps your group already
          uses. Everyone sees the balance, nobody chases receipts, and the record survives every
          officer change.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/onboarding"
            onClick={() => {
              if (ready && state.onboarded) reset();
            }}
            className="rounded-xl bg-[#1f6f5c] px-5 py-3 text-sm font-medium text-white hover:brightness-110"
          >
            Set up a demo workspace
          </Link>
          {ready && state.onboarded && (
            <Link
              href="/dashboard"
              className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium hover:bg-stone-50"
            >
              Continue where I left off
            </Link>
          )}
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-px bg-stone-200 md:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.k} className="bg-white p-6 md:p-8">
              <div className="tabular text-xs text-stone-400">{f.k}</div>
              <h3 className="font-display mt-3 text-xl">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-8 text-xs text-stone-400">
        Prototype v1.0 · MAN 327H Team 2 · Demo data is stored only in your browser.
      </footer>
    </div>
  );
}
