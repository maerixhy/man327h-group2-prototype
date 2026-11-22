"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { memberName, tagName } from "@/lib/selectors";
import { parseVenmoStatement } from "@/lib/statement";
import { importStatement, normName, quantityFor, recordRow, suggestionLabel, targets } from "@/lib/matching";
import { SAMPLE_FILE, sampleNeeds, withSample } from "@/lib/sample";
import type { PaymentTag, ReviewItem } from "@/lib/types";
import { label, longDate, money, relDays, sameTag, shortDate, time, uid } from "@/lib/util";
import { Button, Empty, Notice, PageHeader, SectionTitle, Select } from "@/components/ui";

const tagKey = (t: PaymentTag) => (t.kind === "dues" ? "dues" : `event:${t.eventId}`);
const fromKey = (k: string): PaymentTag => (k === "dues" ? { kind: "dues" } : { kind: "event", eventId: k.slice(6) });

export default function MatchPayments() {
  const { state, update } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);

  const run = (text: string, file: string, prepare?: (s: typeof state) => typeof state) => {
    const { rows, error } = parseVenmoStatement(text);
    if (error) return setError(error);
    setError(null);
    update((s) => {
      const { state: next, summary } = importStatement(prepare ? prepare(s) : s, rows, file);
      return {
        ...next,
        log: [
          {
            id: uid(),
            at: summary.at,
            text: `Imported ${file}: ${summary.linkAuto} matched, ${summary.linkReview + summary.directReview} to review`,
          },
          ...next.log,
        ],
      };
    });
  };

  const upload = async (file: File) => {
    setBusy(true);
    try {
      run(await file.text(), file.name);
    } finally {
      setBusy(false);
    }
  };

  const trySample = async () => {
    const need = sampleNeeds(state);
    if (
      (need.event || need.people.length) &&
      !window.confirm(
        `The sample statement is for a $15 Fall Formal. Add ${[
          need.event && "the Fall Formal event",
          need.people.length && `${need.people.length} people`,
        ]
          .filter(Boolean)
          .join(" and ")} to this workspace so the payments have somewhere to go?`
      )
    )
      return;
    setBusy(true);
    try {
      const text = await (await fetch(SAMPLE_FILE)).text();
      run(text, "sample-venmo-statement.csv", withSample);
    } finally {
      setBusy(false);
    }
  };

  const open = state.review.filter((r) => r.state === "open");
  const ignored = state.review.filter((r) => r.state === "ignored");
  const matched = state.payments
    .filter((p) => p.source === "statement" || p.source === "review")
    .sort((a, b) => b.at.localeCompare(a.at));
  const sum = state.lastImport;

  return (
    <>
      <PageHeader
        title="Match payments"
        action={
          <div className="flex flex-wrap gap-2">
            <label
              className={`inline-flex cursor-pointer items-center rounded-[3px] border border-brand bg-brand px-2.5 py-1 text-[13px] font-medium text-on-brand hover:brightness-110 ${
                busy ? "pointer-events-none opacity-40" : ""
              }`}
            >
              Upload Venmo statement
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <Button size="sm" variant="secondary" onClick={trySample} disabled={busy}>
              Try with sample statement
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6">
          <Notice tone="red">{error}</Notice>
        </div>
      )}

      {sum && sum.linkTotal + sum.directReview === 0 ? (
        <section className="mb-10 border-b border-rule pb-6">
          <div className="text-[22px] font-medium leading-snug tracking-[-0.01em]">Nothing new in {sum.file}.</div>
          <div className="mt-2 text-sm text-muted">
            All {sum.skipped} rows were already imported, money out, or transfers.
          </div>
        </section>
      ) : sum ? (
        <section className="mb-10 border-b border-rule pb-6">
          <div className="text-[22px] font-medium leading-snug tracking-[-0.01em]">
            <span className="num">{sum.linkAuto}</span> of <span className="num">{sum.linkTotal}</span> link payments
            matched automatically, <span className="num">{sum.linkReview}</span> need review.
          </div>
          <div className="mt-2 text-sm text-muted">
            {sum.directReview > 0 && `${sum.directReview} payments without a code went to review with a suggestion. `}
            {sum.skipped > 0 && `${sum.skipped} skipped (money out, transfers, or already imported). `}
          </div>
          <div className="num mt-2 text-[11px] text-faint">
            {sum.file} · {longDate(sum.at)}, {time(sum.at)}
          </div>
        </section>
      ) : (
        <div className="mb-10">
          <Empty>
            Download your statement from Venmo (Me → Statements → Download CSV) and upload it here. Payments with a
            code in the note are matched for you; the rest wait below with a suggestion.
          </Empty>
        </div>
      )}

      <section>
        <SectionTitle aside={<span className="num">{open.length}</span>}>Needs review</SectionTitle>
        {open.length === 0 && <p className="py-4 text-sm italic text-muted">Nothing waiting. Every payment has a home.</p>}
        {open.map((item) => (
          <ReviewRow key={item.row.id} item={item} />
        ))}
        {ignored.length > 0 && (
          <div className="mt-3 text-xs text-muted">
            <button onClick={() => setShowIgnored((v) => !v)} className="hover:text-ink">
              {ignored.length} ignored {showIgnored ? "▴" : "▾"}
            </button>
            {showIgnored && (
              <ul className="mt-2">
                {ignored.map((item) => (
                  <li key={item.row.id} className="flex items-center justify-between gap-3 border-b border-rule py-1.5">
                    <span className="truncate">
                      {item.row.from} · <span className="num">{money(item.row.amount)}</span> · “{item.row.note}”
                    </span>
                    <button
                      className="shrink-0 hover:text-ink"
                      onClick={() =>
                        update((s) => ({
                          ...s,
                          review: s.review.map((r) => (r.row.id === item.row.id ? { ...r, state: "open" } : r)),
                        }))
                      }
                    >
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {matched.length > 0 && (
        <section className="mt-10">
          <SectionTitle aside={<span className="num">{matched.length}</span>}>Matched from statements</SectionTitle>
          <ul>
            {matched.slice(0, 60).map((p) => {
              const who = memberName(state, p.memberId);
              return (
                <li key={p.id} className="flex items-center gap-3 border-b border-rule py-2 text-sm">
                  <span className="num w-14 shrink-0 text-[11px] text-muted">{shortDate(p.at)}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {p.sender && normName(p.sender) !== normName(who) ? (
                      <>
                        <span className="text-muted">{p.sender} →</span> {who}
                      </>
                    ) : (
                      who
                    )}
                    <span className="text-muted"> · {tagName(state, p.tag)}</span>
                    {p.quantity && <span className="num text-muted"> x{p.quantity}</span>}
                  </span>
                  {p.source === "review" && <span className="text-[11px] text-muted">reviewed</span>}
                  <span className="num w-16 shrink-0 text-right text-[13px]">{p.amount.toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

function ReviewRow({ item }: { item: ReviewItem }) {
  const { state, update, log } = useStore();
  const L = label(state.org.memberLabel);
  const list = targets(state);
  const sug = item.suggestion;
  const [editing, setEditing] = useState(false);
  const [tag, setTag] = useState(sug.tag ? tagKey(sug.tag) : (list[0] ? tagKey(list[0].tag) : ""));
  const [memberId, setMemberId] = useState(sug.memberId ?? "");
  const [qty, setQty] = useState(sug.quantity || 1);
  const [remember, setRemember] = useState(true);
  const { row } = item;

  const picked = state.members.find((m) => m.id === memberId);
  const nameDiffers = !!picked && normName(picked.name) !== normName(row.from);

  const settle = (next: "confirmed" | "ignored") =>
    update((s) => ({ ...s, review: s.review.map((r) => (r.row.id === row.id ? { ...r, state: next } : r)) }));

  const record = (t: PaymentTag, mId: string, q: number, alias: boolean) => {
    const who = state.members.find((m) => m.id === mId);
    update((s) => {
      let next = recordRow(s, row, t, mId, q, "review");
      next = { ...next, review: next.review.map((r) => (r.row.id === row.id ? { ...r, state: "confirmed" } : r)) };
      if (alias && who) {
        const aliases = next.org.aliases.filter((a) => normName(a.name) !== normName(row.from));
        next = { ...next, org: { ...next.org, aliases: [...aliases, { name: row.from, memberId: mId }] } };
      }
      return next;
    });
    log(`Matched ${row.from}'s ${money(row.amount)} to ${who?.name ?? "a member"} for ${tagName(state, t)}`);
  };

  const already =
    sug.tag && sug.memberId && state.payments.some((p) => p.memberId === sug.memberId && sameTag(p.tag, sug.tag!));

  return (
    <article className="border-b border-rule py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-medium">{row.from}</span>
            <span className="num text-[13px]">{money(row.amount)}</span>
            <span className="num text-[11px] text-muted">
              {shortDate(row.at)}, {time(row.at)} · {relDays(row.at)}
            </span>
          </div>
          <div className="num mt-1 text-[13px]">
            <span className="text-faint">note </span>“{row.note || " "}”
          </div>
          <div className="mt-2 text-sm">
            {suggestionLabel(state, sug) ? (
              <>
                <span className="text-muted">Suggested: </span>
                <span className="font-medium">{suggestionLabel(state, sug)}</span>
              </>
            ) : (
              <span className="text-muted">No suggestion</span>
            )}
          </div>
          <div className="text-[13px] text-muted">{sug.reason}.</div>
          {already && (
            <div className="text-[13px] text-red-ink">
              {memberName(state, sug.memberId!)} already has a payment for this. Check before confirming.
            </div>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 gap-1.5">
            <Button
              size="sm"
              disabled={!sug.tag || !sug.memberId}
              onClick={() => record(sug.tag!, sug.memberId!, sug.quantity, false)}
            >
              Confirm
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Reassign
            </Button>
            <Button size="sm" variant="ghost" onClick={() => settle("ignored")}>
              Ignore
            </Button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-3 rounded-[3px] border border-rule bg-sheet p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_80px]">
            <label className="block text-[13px] font-medium">
              For
              <Select
                className="mt-1"
                value={tag}
                onChange={(e) => {
                  setTag(e.target.value);
                  const t = list.find((x) => tagKey(x.tag) === e.target.value);
                  if (t) setQty(quantityFor(row.amount, t.price) || 1);
                }}
              >
                {list.map((t) => (
                  <option key={tagKey(t.tag)} value={tagKey(t.tag)}>
                    {t.name} · {money(t.price)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-[13px] font-medium">
              {L.one.replace(/^./, (c) => c.toUpperCase())}
              <Select className="mt-1" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="">Choose a {L.one}</option>
                {[...state.members]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </Select>
            </label>
            <label className="block text-[13px] font-medium">
              Qty
              <Select className="num mt-1" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          {nameDiffers && (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              Remember this name: “{row.from}” pays for {picked!.name}
            </label>
          )}
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              disabled={!tag || !memberId}
              onClick={() => record(fromKey(tag), memberId, qty, nameDiffers && remember)}
            >
              Record payment
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
