"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { balance, owed, treasurer } from "@/lib/selectors";
import { downloadFile, money, relDays } from "@/lib/util";
import { Button, Card, PageHeader, Select } from "@/components/ui";

export default function Handoff() {
  const { state, update, log } = useStore();
  const current = treasurer(state);
  const candidates = state.members.filter((m) => m.role !== "treasurer");
  const [next, setNext] = useState(candidates[0]?.id ?? "");
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const o = owed(state);

  const receipts = state.reimbursements.filter((r) => r.receipt).length;
  const open = state.reimbursements.filter((r) => r.status === "submitted" || r.status === "approved");
  const history = state.log.filter((l) => l.text.startsWith("Handoff"));

  const inherits = [
    { n: state.payments.length, t: "tagged payments", d: "every dues and event payment, with who paid and when" },
    { n: receipts, t: "receipts", d: "attached to the expense they belong to" },
    { n: open.length, t: "open reimbursements", d: `${money(o.approved + o.submitted)} still owed to officers, with due dates` },
    { n: state.events.length, t: "events", d: "with budgets, payment links, and who's unpaid" },
  ];

  const doHandoff = () => {
    const to = state.members.find((m) => m.id === next);
    if (!to || !current) return;
    update((s) => ({
      ...s,
      viewAs: to.id,
      members: s.members.map((m) =>
        m.id === to.id
          ? { ...m, role: "treasurer", title: "Treasurer" }
          : m.id === current.id
          ? { ...m, role: "officer", title: "Former treasurer" }
          : m
      ),
    }));
    log(`Handoff: ${current.name} passed the books to ${to.name}`);
    setDone(to.name);
    setConfirm(false);
  };

  return (
    <>
      <PageHeader
        title="Handoff"
        sub="The ledger is the handoff. The next treasurer gets the whole record, not a spreadsheet and a group chat."
      />

      {done && (
        <Card className="mb-6 border-brand-line bg-brand-soft p-5">
          <div className="font-display text-xl text-brand">{done} is now treasurer.</div>
          <p className="mt-1 text-sm text-stone-600">
            You&apos;re now viewing as {done}. Everything below came with them, and the previous treasurer
            stays on as an officer so questions don&apos;t go to their personal texts.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5 md:p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-stone-500">What transfers</div>
          <div className="font-display tabular mt-1 text-3xl">{money(balance(state))}</div>
          <div className="text-sm text-stone-500">current balance, reconciled</div>
          <ul className="mt-5 divide-y divide-stone-100">
            {inherits.map((i) => (
              <li key={i.t} className="flex gap-4 py-3">
                <span className="tabular w-10 shrink-0 text-right text-xl font-semibold text-brand">{i.n}</span>
                <span>
                  <span className="block text-sm font-medium">{i.t}</span>
                  <span className="block text-sm text-stone-500">{i.d}</span>
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() =>
              downloadFile(
                `${state.org.name} full record ${state.org.term}.json`,
                JSON.stringify(state, null, 2),
                "application/json"
              )
            }
          >
            Download full record
          </Button>
        </Card>

        <Card className="space-y-4 p-5 md:p-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-stone-500">Current treasurer</div>
            <div className="mt-1 font-medium">{current?.name ?? "None"}</div>
          </div>
          <label className="block text-sm font-medium">
            Pass the books to
            <Select value={next} onChange={(e) => setNext(e.target.value)} className="mt-1.5">
              {candidates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
            <div className="font-medium text-ink">Outside Paper Trail, don&apos;t forget</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Update the Venmo handle in Settings if the account changes</li>
              <li>Add the new treasurer as a signer on the bank account</li>
              <li>Tell your funding office or advisor who the new contact is</li>
            </ul>
          </div>
          {!confirm ? (
            <Button className="w-full" onClick={() => setConfirm(true)} disabled={!next}>
              Start handoff
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                Make {state.members.find((m) => m.id === next)?.name} treasurer? You can hand it back anytime.
              </p>
              <div className="flex gap-2">
                <Button onClick={doHandoff}>Confirm handoff</Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {history.length > 0 && (
            <div className="border-t border-stone-100 pt-3">
              <div className="text-xs font-medium uppercase tracking-wide text-stone-500">History</div>
              <ul className="mt-2 space-y-1 text-sm text-stone-600">
                {history.map((h) => (
                  <li key={h.id}>
                    {h.text.replace("Handoff: ", "")} · {relDays(h.at)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
