"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { collection, memberName, treasurer } from "@/lib/selectors";
import type { PacketTemplate } from "@/lib/types";
import { csvCell, downloadFile, longDate, money, shortDate } from "@/lib/util";
import { Button, Card, OrgMark, PageHeader, Select } from "@/components/ui";

// Builds a funding request (or a grant expense report) from the receipts already in Paper Trail,
// and flags the problems that usually get requests denied before anyone submits.
export default function Packets() {
  const { state, update } = useStore();
  // Start on the event with the most expenses, since that's the packet most likely due.
  const [eventId, setEventId] = useState(
    () =>
      [...state.events].sort(
        (a, b) =>
          state.reimbursements.filter((r) => r.eventId === b.id).length -
          state.reimbursements.filter((r) => r.eventId === a.id).length
      )[0]?.id ?? ""
  );
  const ev = state.events.find((e) => e.id === eventId);
  const tpl: PacketTemplate = state.org.packetTemplate;

  if (!ev) return <PageHeader title="Funding packets" sub="Create an event first." />;

  const lines = state.reimbursements
    .filter((r) => r.eventId === ev.id && r.status !== "rejected")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const total = lines.reduce((a, r) => a + r.amount, 0);
  const income = collection(state, { kind: "event", eventId: ev.id });
  const t = treasurer(state);

  const checks = [
    { ok: lines.length > 0, text: "At least one itemized expense" },
    {
      ok: lines.every((r) => r.receipt),
      text: "Every expense has a receipt",
      fix: lines.filter((r) => !r.receipt).map((r) => `${r.vendor} (${money(r.amount)})`),
    },
    {
      ok: lines.every((r) => r.status !== "submitted"),
      text: "Every expense is approved by the board",
      fix: lines.filter((r) => r.status === "submitted").map((r) => `${r.vendor} (${money(r.amount)})`),
    },
    { ok: lines.every((r) => r.vendor && r.description), text: "Every line names a vendor and purpose" },
    { ok: ev.purpose.trim().length > 15, text: "Event purpose is described" },
    { ok: total <= ev.budget, text: `Spending is within the ${money(ev.budget)} budget` },
  ];
  const ready = checks.every((c) => c.ok);

  const title = tpl === "university" ? "Student Organization Funding Request" : "Program Expense Report";

  const exportCsv = () => {
    const rows = [
      ["Date", "Vendor", "Description", "Submitted by", "Receipt", "Status", "Amount"],
      ...lines.map((r) => [
        new Date(r.submittedAt).toISOString().slice(0, 10),
        r.vendor,
        r.description,
        memberName(state, r.submitterId),
        r.receipt ? "Attached" : "MISSING",
        r.status,
        r.amount.toFixed(2),
      ]),
      ["", "", "", "", "", "Total", total.toFixed(2)],
    ];
    downloadFile(
      `${ev.name} ${tpl === "university" ? "funding request" : "expense report"}.csv`,
      rows.map((r) => r.map(csvCell).join(",")).join("\n"),
      "text/csv"
    );
  };

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Funding packets"
          sub="Built from the receipts you already have, in the format your funder expects."
        />
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <Card className="space-y-4 p-5">
            <label className="block text-sm font-medium">
              Event
              <Select value={eventId} onChange={(e) => setEventId(e.target.value)} className="mt-1.5">
                {state.events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {shortDate(e.date)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-sm font-medium">
              Format
              <Select
                value={tpl}
                onChange={(e) =>
                  update((s) => ({ ...s, org: { ...s.org, packetTemplate: e.target.value as PacketTemplate } }))
                }
                className="mt-1.5"
              >
                <option value="university">University student org funding request</option>
                <option value="grant">Funder or grant expense report</option>
              </Select>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => window.print()}>Print or save as PDF</Button>
              <Button variant="secondary" onClick={exportCsv}>
                Download CSV
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Pre-submission check</h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  ready ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                }`}
              >
                {ready ? "Ready to submit" : `${checks.filter((c) => !c.ok).length} to fix`}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {checks.map((c) => (
                <li key={c.text} className="text-sm">
                  <span className={c.ok ? "text-emerald-700" : "text-amber-700"}>{c.ok ? "✓" : "!"}</span>{" "}
                  <span className={c.ok ? "text-stone-600" : "text-ink"}>{c.text}</span>
                  {!c.ok && c.fix && c.fix.length > 0 && (
                    <span className="block pl-4 text-xs text-stone-500">Fix: {c.fix.join(", ")}</span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="mt-8 mb-3 text-xs font-medium uppercase tracking-wide text-stone-500">Preview</div>
      </div>

      {/* The printable packet */}
      <div className="print-sheet mx-auto max-w-[8.5in] rounded-sm border border-stone-200 bg-white p-8 shadow-sm md:p-12">
        <div className="flex items-start justify-between gap-6 border-b-2 border-ink pb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{title}</div>
            <div className="font-display mt-1 text-2xl">{state.org.name}</div>
          </div>
          <OrgMark name={state.org.name} logo={state.org.logo} size={48} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {(tpl === "university"
            ? [
                ["Event", ev.name],
                ["Date", longDate(ev.date)],
                ["Location", ev.location],
                ["Treasurer", t?.name ?? ""],
                ["Paid attendees", `${income.paidCount} of ${state.members.length}`],
                ["Approved budget", money(ev.budget)],
              ]
            : [
                ["Program", ev.name],
                ["Reporting period", state.org.term],
                ["Prepared by", t?.name ?? ""],
                ["Date of activity", longDate(ev.date)],
                ["Budgeted", money(ev.budget)],
                ["Actual", money(total)],
              ]
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-wide text-stone-500">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
          <div className="col-span-2">
            <dt className="text-[11px] uppercase tracking-wide text-stone-500">
              {tpl === "university" ? "Purpose of event" : "Program description"}
            </dt>
            <dd>{ev.purpose}</dd>
          </div>
        </dl>

        <table className="tabular mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-stone-300 text-left text-[11px] uppercase tracking-wide text-stone-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Vendor</th>
              <th className="py-2 pr-2">Description</th>
              <th className="py-2 pr-2">Paid by</th>
              <th className="py-2 pr-2">Receipt</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((r, i) => (
              <tr key={r.id} className="border-b border-stone-100 align-top">
                <td className="py-2 pr-2 text-stone-400">{i + 1}</td>
                <td className="py-2 pr-2">{r.vendor}</td>
                <td className="py-2 pr-2">{r.description}</td>
                <td className="py-2 pr-2">{memberName(state, r.submitterId)}</td>
                <td className={`py-2 pr-2 ${r.receipt ? "" : "font-medium text-red-700"}`}>
                  {r.receipt ? `Exhibit ${i + 1}` : "Missing"}
                </td>
                <td className="py-2 text-right">{money(r.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="pt-3 text-right font-medium">
                {tpl === "university" ? "Total requested" : "Total expenses"}
              </td>
              <td className="pt-3 text-right font-semibold">{money(total)}</td>
            </tr>
            {tpl === "grant" && (
              <tr>
                <td colSpan={5} className="text-right text-stone-500">
                  Participant contributions collected
                </td>
                <td className="text-right text-stone-500">{money(income.collected)}</td>
              </tr>
            )}
          </tfoot>
        </table>

        {lines.some((r) => r.receipt) && (
          <div className="mt-8 break-inside-avoid">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Receipts
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4">
              {lines.map((r, i) =>
                r.receipt ? (
                  <figure key={r.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.receipt} alt={`Receipt ${i + 1}`} className="w-full rounded border border-stone-200" />
                    <figcaption className="mt-1 text-xs text-stone-500">
                      Exhibit {i + 1} · {r.vendor} · {money(r.amount)}
                    </figcaption>
                  </figure>
                ) : null
              )}
            </div>
          </div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-8 text-xs text-stone-500">
          <div className="border-t border-stone-400 pt-1">Treasurer signature</div>
          <div className="border-t border-stone-400 pt-1">Advisor or reviewer signature</div>
        </div>
        <div className="mt-6 text-[10px] text-stone-400">Generated by Paper Trail · {longDate(new Date().toISOString())}</div>
      </div>
    </>
  );
}
