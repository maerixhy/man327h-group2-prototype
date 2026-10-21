"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { balance, eventName, memberName, tagName } from "@/lib/selectors";
import { csvCell, downloadFile, money, shortDate } from "@/lib/util";
import { Button, Card, PageHeader, Pill, Select } from "@/components/ui";

type Row = {
  id: string;
  at: string;
  who: string;
  what: string;
  category: string;
  amount: number; // positive in, negative out
  ref: string;
};

export default function Ledger() {
  const { state } = useStore();
  const [filter, setFilter] = useState("all");

  const rows = useMemo<Row[]>(() => {
    const ins: Row[] = state.payments.map((p) => ({
      id: p.id,
      at: p.at,
      who: memberName(state, p.memberId),
      what: `${tagName(state, p.tag)} via ${p.via}`,
      category: p.tag.kind === "dues" ? "dues" : p.tag.eventId,
      amount: p.amount,
      ref: p.ref,
    }));
    const outs: Row[] = state.reimbursements
      .filter((r) => r.status === "paid")
      .map((r) => ({
        id: r.id,
        at: r.paidAt ?? r.submittedAt,
        who: memberName(state, r.submitterId),
        what: `Paid back: ${r.vendor}, ${r.description}`,
        category: r.eventId ?? "general",
        amount: -r.amount,
        ref: "REIMB",
      }));
    return [...ins, ...outs].sort((a, b) => b.at.localeCompare(a.at));
  }, [state]);

  const shown = filter === "all" ? rows : rows.filter((r) => r.category === filter);
  const inflow = shown.filter((r) => r.amount > 0).reduce((a, r) => a + r.amount, 0);
  const outflow = shown.filter((r) => r.amount < 0).reduce((a, r) => a - r.amount, 0);

  const exportCsv = () => {
    const header = ["Date", "Who", "Description", "Category", "Tag", "Amount"];
    const lines = shown.map((r) =>
      [
        new Date(r.at).toISOString().slice(0, 10),
        r.who,
        r.what,
        r.category === "dues" ? "Dues" : eventName(state, r.category === "general" ? null : r.category),
        r.ref,
        r.amount.toFixed(2),
      ]
        .map(csvCell)
        .join(",")
    );
    downloadFile(`${state.org.name} ledger.csv`, [header.join(","), ...lines].join("\n"), "text/csv");
  };

  return (
    <>
      <PageHeader
        title="Ledger"
        sub={`Every dollar in and out, tagged automatically. Current balance ${money(balance(state))}.`}
        action={
          <Button variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-auto">
          <option value="all">Everything</option>
          <option value="dues">Dues</option>
          {state.events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
          <option value="general">General expenses</option>
        </Select>
        <div className="tabular text-sm text-stone-500">
          In <span className="font-medium text-emerald-700">{money(inflow)}</span> · Out{" "}
          <span className="font-medium text-red-700">{money(outflow)}</span>
        </div>
      </div>

      <Card className="ruled overflow-hidden">
        <div className="hidden grid-cols-[90px_1fr_1.4fr_110px_100px] gap-3 border-b border-stone-200 bg-stone-50 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-stone-500 md:grid">
          <span>Date</span>
          <span>Who</span>
          <span>What</span>
          <span>Tag</span>
          <span className="text-right">Amount</span>
        </div>
        <ul>
          {shown.map((r) => (
            <li
              key={r.id}
              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-b border-stone-100 px-5 py-3 text-sm last:border-0 md:grid-cols-[90px_1fr_1.4fr_110px_100px] md:items-center"
            >
              <span className="order-3 text-xs text-stone-500 md:order-none md:text-sm">{shortDate(r.at)}</span>
              <span className="order-1 font-medium md:order-none md:font-normal">{r.who}</span>
              <span className="order-4 col-span-2 text-stone-600 md:order-none md:col-span-1">{r.what}</span>
              <span className="hidden md:block">
                <Pill tone={r.amount < 0 ? "amber" : "brand"}>{r.ref}</Pill>
              </span>
              <span
                className={`tabular order-2 text-right font-medium md:order-none ${
                  r.amount < 0 ? "text-red-700" : "text-emerald-700"
                }`}
              >
                {r.amount < 0 ? "−" : "+"}
                {money(Math.abs(r.amount))}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
