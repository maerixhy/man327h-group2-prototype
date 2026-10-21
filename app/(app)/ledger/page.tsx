"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { balance, eventName, memberName, tagName } from "@/lib/selectors";
import { csvCell, downloadFile, initials, money, shortDate } from "@/lib/util";
import { Button, PageHeader, Select } from "@/components/ui";

type Row = {
  id: string;
  no: number;
  at: string;
  who: string;
  what: string;
  category: string;
  amount: number; // positive in, negative out
  ref: string;
  initials?: string; // who approved the payout or logged the cash
  balance: number;
};

const amt = (n: number) => money(n).replace("$", "");

export default function Ledger() {
  const { state } = useStore();
  const [filter, setFilter] = useState("all");

  const rows = useMemo<Row[]>(() => {
    const ins = state.payments.map((p) => ({
      id: p.id,
      no: p.no,
      at: p.at,
      who: memberName(state, p.memberId),
      what: `${tagName(state, p.tag)}${p.via === "venmo" ? "" : ` (${p.via})`}`,
      category: p.tag.kind === "dues" ? "dues" : p.tag.eventId,
      amount: p.amount,
      ref: p.ref,
      initials: p.recordedBy ? initials(memberName(state, p.recordedBy)) : undefined,
    }));
    const outs = state.reimbursements
      .filter((r) => r.status === "paid")
      .map((r) => ({
        id: r.id,
        no: r.paidNo ?? r.no,
        at: r.paidAt ?? r.submittedAt,
        who: memberName(state, r.submitterId),
        what: `Paid back: ${r.vendor}, ${r.description}`,
        category: r.eventId ?? "general",
        amount: -r.amount,
        ref: "REIMB",
        initials: r.approvedBy ? initials(memberName(state, r.approvedBy)) : undefined,
      }));
    // Running balance, carried forward from the opening balance.
    let bal = state.org.openingBalance;
    return [...ins, ...outs]
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((r) => ({ ...r, balance: (bal += r.amount) }))
      .reverse();
  }, [state]);

  const all = filter === "all";
  const shown = all ? rows : rows.filter((r) => r.category === filter);
  const inflow = shown.filter((r) => r.amount > 0).reduce((a, r) => a + r.amount, 0);
  const outflow = shown.filter((r) => r.amount < 0).reduce((a, r) => a - r.amount, 0);

  const exportCsv = () => {
    const header = ["No.", "Date", "Who", "Description", "Category", "Tag", "Amount", "Balance"];
    const lines = shown.map((r) =>
      [
        r.no,
        new Date(r.at).toISOString().slice(0, 10),
        r.who,
        r.what,
        r.category === "dues" ? "Dues" : eventName(state, r.category === "general" ? null : r.category),
        r.ref,
        r.amount.toFixed(2),
        r.balance.toFixed(2),
      ]
        .map(csvCell)
        .join(",")
    );
    downloadFile(`${state.org.name} ledger.csv`, [header.join(","), ...lines].join("\n"), "text/csv");
  };

  const cols = "md:grid-cols-[52px_58px_minmax(0,1fr)_112px_80px_80px_88px]";

  return (
    <>
      <PageHeader
        title="Ledger"
        action={
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto py-1.5">
          <option value="all">All entries</option>
          <option value="dues">Dues</option>
          {state.events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
          <option value="general">General expenses</option>
        </Select>
        <div className="num flex gap-4 text-[13px] text-muted">
          <span>
            In <span className="text-ink">{money(inflow)}</span>
          </span>
          <span>
            Out <span className="text-red-ink">{money(outflow)}</span>
          </span>
          <span>{shown.length} entries</span>
        </div>
      </div>

      <div className="rounded-[3px] border border-rule bg-sheet">
        <div
          className={`num hidden gap-3 border-b border-ink px-4 py-2 text-[10.5px] uppercase tracking-wider text-muted md:grid ${cols}`}
        >
          <span>No.</span>
          <span>Date</span>
          <span>Entry</span>
          <span>Tag</span>
          <span className="text-right">In</span>
          <span className="text-right">Out</span>
          <span className="text-right">{all ? "Balance" : ""}</span>
        </div>
        <ul>
          {shown.map((r) => (
            <li
              key={r.id}
              className={`grid grid-cols-[1fr_auto] gap-x-3 border-b border-rule px-4 py-2 text-sm md:h-9 md:items-center md:py-0 ${cols}`}
            >
              <span className="num hidden text-[12px] text-faint md:block">{String(r.no).padStart(4, "0")}</span>
              <span className="num hidden text-[12px] text-muted md:block">{shortDate(r.at)}</span>
              <span className="min-w-0 truncate">
                <span className="font-medium md:font-normal">{r.who}</span>
                <span className="text-muted">, {r.what}</span>
                {r.initials && <span className="ml-2 font-hand text-[17px] leading-none text-blue-ink">{r.initials}</span>}
              </span>
              <span className="num hidden truncate text-[11px] text-muted md:block">{r.ref}</span>
              <span className="num text-right text-[13px] md:block">{r.amount > 0 ? amt(r.amount) : ""}</span>
              <span className="num hidden text-right text-[13px] text-red-ink md:block">
                {r.amount < 0 ? amt(-r.amount) : ""}
              </span>
              <span className="num hidden text-right text-[13px] md:block">{all ? amt(r.balance) : ""}</span>
              {/* Mobile second line */}
              <span className="num col-span-2 flex justify-between text-[11px] text-muted md:hidden">
                <span>
                  {String(r.no).padStart(4, "0")} · {shortDate(r.at)} · {r.ref}
                </span>
                {r.amount < 0 && <span className="text-[13px] text-red-ink">−{amt(-r.amount)}</span>}
              </span>
            </li>
          ))}
          {all && (
            <li className={`grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2 text-sm italic text-muted md:h-9 md:items-center md:py-0 ${cols}`}>
              <span className="hidden md:block" />
              <span className="hidden md:block" />
              <span>Brought forward from last term</span>
              <span className="hidden md:block" />
              <span className="hidden md:block" />
              <span className="hidden md:block" />
              <span className="num text-right text-[13px] not-italic md:block">{amt(state.org.openingBalance)}</span>
            </li>
          )}
        </ul>
        <div className="ruled h-16 border-t border-rule" />
        {all && (
          <div className="num flex justify-end gap-3 border-t-[3px] border-double border-ink px-4 py-2 text-sm">
            <span className="text-muted">Balance</span>
            <span className="font-medium">{money(balance(state))}</span>
          </div>
        )}
      </div>
    </>
  );
}
