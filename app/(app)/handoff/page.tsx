"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { balance, owed, treasurer } from "@/lib/selectors";
import { downloadFile, money, relDays } from "@/lib/util";
import { Button, Caption, Card, Notice, PageHeader, SectionTitle, Select } from "@/components/ui";

export default function Handoff() {
  const { state, me, update, log } = useStore();
  const current = treasurer(state);
  const candidates = state.members.filter((m) => m.role !== "treasurer");
  const [next, setNext] = useState(candidates[0]?.id ?? "");
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<{ name: string; hasLogin: boolean } | null>(null);
  const o = owed(state);
  const canHandOff = me?.role === "treasurer";

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
      members: s.members.map((m) =>
        m.id === to.id
          ? { ...m, role: "treasurer", title: "Treasurer" }
          : m.id === current.id
            ? { ...m, role: "officer", title: "Former treasurer" }
            : m
      ),
    }));
    log(`Handoff: ${current.name} passed the books to ${to.name}`);
    setDone({ name: to.name, hasLogin: !!to.passwordHash });
    setConfirm(false);
  };

  return (
    <>
      <PageHeader title="Handoff" />

      {done && (
        <div className="mb-6">
          <Notice tone="brand">
            <span className="font-medium">{done.name} is now treasurer.</span> You stay on as an officer, so questions
            don&apos;t end up in your personal texts.
            {!done.hasLogin && " They don't have a login yet. Create one from the member list."}
          </Notice>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <Caption>What transfers</Caption>
          <div className="num mt-1 text-[40px] font-medium leading-none tracking-[-0.03em]">{money(balance(state))}</div>
          <div className="mt-1 text-sm text-muted">balance, reconciled to the last entry</div>
          <ul className="mt-6 border-t border-ink">
            {inherits.map((i) => (
              <li key={i.t} className="flex items-baseline gap-4 border-b border-rule py-3">
                <span className="num w-10 shrink-0 text-right text-lg font-medium">{i.n}</span>
                <span>
                  <span className="block text-sm font-medium">{i.t}</span>
                  <span className="block text-[13px] text-muted">{i.d}</span>
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() =>
              downloadFile(
                `${state.org.name} full record ${state.org.term}.json`,
                JSON.stringify(
                  { ...state, members: state.members.map(({ passwordHash: _omit, ...m }) => m) },
                  null,
                  2
                ),
                "application/json"
              )
            }
          >
            Download full record
          </Button>
        </section>

        <Card className="space-y-4 p-5 md:p-6">
          <div>
            <Caption>Current treasurer</Caption>
            <div className="mt-1 font-medium">{current?.name ?? "None"}</div>
          </div>
          {canHandOff ? (
            <>
              <label className="block text-[13px] font-medium">
                Pass the books to
                <Select value={next} onChange={(e) => setNext(e.target.value)} className="mt-1">
                  {candidates.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="border-y border-rule py-3 text-[13px] text-muted">
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
                    Make {state.members.find((m) => m.id === next)?.name} treasurer? They can hand it back anytime.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={doHandoff}>Confirm handoff</Button>
                    <Button variant="ghost" onClick={() => setConfirm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">Only the treasurer can pass the books on.</p>
          )}
          {history.length > 0 && (
            <div>
              <SectionTitle>History</SectionTitle>
              <ul className="mt-2 space-y-1 text-[13px] text-muted">
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
