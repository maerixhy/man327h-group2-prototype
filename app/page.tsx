"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Button, ButtonLink, Stamp, ThemeSwitch } from "@/components/ui";
import Receipt from "@/components/Receipt";

// A page out of a group's book, so people see the product instead of reading about it.
const SAMPLE: { no: string; date: string; entry: string; tag: string; inn?: string; out?: string; bal: string; note?: string }[] = [
  { no: "0228", date: "Oct 12", entry: "Hannah Park, Fall dues", tag: "PT-DUES", inn: "40.00", bal: "2,302.50" },
  { no: "0229", date: "Oct 13", entry: "Chris Wu, Game Night", tag: "PT-EV-GAMES", inn: "5.00", bal: "2,307.50" },
  { no: "0230", date: "Oct 13", entry: "Paid back M. Chen, H-E-B snacks", tag: "REIMB", out: "86.42", bal: "2,221.08", note: "AR" },
  { no: "0231", date: "Oct 14", entry: "Maya Chen, Fall Formal", tag: "PT-EV-FORMAL", inn: "35.00", bal: "2,256.08" },
  { no: "0232", date: "Oct 14", entry: "Diego Flores, Fall Formal", tag: "PT-EV-FORMAL", inn: "35.00", bal: "2,291.08" },
  { no: "0233", date: "Oct 15", entry: "Leah Patel, Fall dues (cash)", tag: "PT-DUES", inn: "40.00", bal: "2,331.08" },
  { no: "0234", date: "Oct 16", entry: "Paid back J. Lee, ballroom deposit", tag: "REIMB", out: "400.00", bal: "1,931.08", note: "AR" },
];

export default function Landing() {
  const { state, ready, me, reset } = useStore();
  const router = useRouter();
  const existing = ready && state.onboarded;

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" width={26} height={26} />
          <span className="text-[17px] font-semibold tracking-tight">Paper Trail</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitch className="hidden sm:inline-flex" />
          {existing && (
            <Link href={me ? "/dashboard" : "/login"} className="text-sm font-medium text-ink hover:underline">
              {me ? "Open workspace" : "Sign in"}
            </Link>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 pt-8 pb-20 md:pt-16 lg:pb-72 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <div>
          <p className="num text-xs uppercase tracking-[0.14em] text-muted">
            For student orgs, PTAs, teams, and small nonprofits
          </p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[64px]">
            Your treasurer&apos;s Venmo shouldn&apos;t be your group&apos;s bank.
          </h1>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted">
            Paper Trail keeps one shared book on top of the payment apps your group already uses. Every
            payment comes in tagged, every receipt has a place, and the record outlasts every officer change.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {existing ? (
              <>
                <ButtonLink href={me ? "/dashboard" : "/login"}>{me ? "Open workspace" : "Sign in"}</ButtonLink>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!window.confirm(`Start a new workspace? ${state.org.name} will be deleted from this browser.`))
                      return;
                    reset();
                    router.push("/onboarding");
                  }}
                >
                  Set up a new workspace
                </Button>
              </>
            ) : (
              <ButtonLink href="/onboarding">Set up a workspace</ButtonLink>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[3px] border border-rule bg-sheet">
            <div className="flex items-baseline justify-between border-b-[3px] border-double border-ink px-4 pt-4 pb-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]">General ledger</div>
              <div className="num text-[11px] text-muted">Fall 2026 · p. 7</div>
            </div>
            <div className="num overflow-hidden text-[12px]">
              <div className="grid grid-cols-[40px_48px_1fr_64px_64px] gap-2 border-b border-rule px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted sm:grid-cols-[40px_48px_1fr_96px_60px_60px_72px]">
                <span>No.</span>
                <span>Date</span>
                <span>Entry</span>
                <span className="hidden sm:block">Tag</span>
                <span className="text-right">In</span>
                <span className="text-right">Out</span>
                <span className="hidden text-right sm:block">Balance</span>
              </div>
              {SAMPLE.map((r) => (
                <div
                  key={r.no}
                  className="grid h-8 grid-cols-[40px_48px_1fr_64px_64px] items-center gap-2 border-b border-rule px-4 sm:grid-cols-[40px_48px_1fr_96px_60px_60px_72px]"
                >
                  <span className="text-faint">{r.no}</span>
                  <span className="text-muted">{r.date}</span>
                  <span className="truncate font-sans text-[13px]">
                    {r.entry}
                    {r.note && <span className="ml-2 font-hand text-base text-blue-ink">ok {r.note}</span>}
                  </span>
                  <span className="hidden truncate text-[10.5px] text-muted sm:block">{r.tag}</span>
                  <span className="text-right">{r.inn ?? ""}</span>
                  <span className="text-right text-red-ink">{r.out ?? ""}</span>
                  <span className="hidden text-right sm:block">{r.bal}</span>
                </div>
              ))}
              <div className="ruled h-24 lg:h-72" />
            </div>
          </div>
          <Stamp className="absolute top-[330px] left-8 hidden lg:inline-flex" ink="blue" large tilt={-8}>
            Reconciled
          </Stamp>
          <div className="relative z-10 -mt-12 mr-2 ml-auto w-fit rotate-[2.5deg] lg:absolute lg:top-[300px] lg:right-6 lg:mt-0 lg:mr-0">
            <Receipt
              className="border-x border-t border-rule"
              r={{
                org: "Sunrise Cultural Association",
                item: "Fall Formal",
                amount: 35,
                payer: "Maya Chen",
                no: 231,
                id: "x8f2k",
                at: "2026-10-14T19:42:00",
                via: "venmo",
                to: "sunrise-ut",
                code: "PT-EV-FORMAL",
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
