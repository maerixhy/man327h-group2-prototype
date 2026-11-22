import type { ImportSummary, Member, PaymentTag, ReviewItem, State, StatementRow, Suggestion } from "./types";
import { addPayment, tagName } from "./selectors";
import { label, money, tagCode, uid } from "./util";

type Target = { tag: PaymentTag; code: string; name: string; price: number; date?: string; sharedAt?: string };

// Everything a payment can be for: dues (when set) and every event.
export function targets(s: State): Target[] {
  const list: Target[] = [];
  if (s.org.modules.dues && s.org.duesAmount > 0) {
    const tag: PaymentTag = { kind: "dues" };
    list.push({ tag, code: tagCode(tag), name: tagName(s, tag), price: s.org.duesAmount, sharedAt: s.org.duesLinkSharedAt });
  }
  for (const e of s.events) {
    const tag: PaymentTag = { kind: "event", eventId: e.id };
    list.push({ tag, code: tagCode(tag), name: e.name, price: e.price, date: e.date, sharedAt: e.linkSharedAt });
  }
  return list;
}

export const normName = (n: string) =>
  n
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const close = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 4 && lev(a, b) <= 1);

// "Sam" for Samuel, "Dan" for Daniel, "M" for Maya, or a one-letter typo.
const firstMatches = (sent: string, roster: string) =>
  close(sent, roster) ||
  (sent.length === 1 && roster.startsWith(sent)) ||
  (Math.min(sent.length, roster.length) >= 3 && (roster.startsWith(sent) || sent.startsWith(roster)));

export type MemberMatch = { member?: Member; closest?: Member; ambiguous?: Member[]; how?: string };

// Matches the "From" name on a statement to someone on the roster.
export function matchMember(s: State, from: string): MemberMatch {
  const sent = normName(from);
  if (!sent) return {};
  const alias = s.org.aliases.find((a) => normName(a.name) === sent);
  const aliased = alias && s.members.find((m) => m.id === alias.memberId);
  if (aliased) return { member: aliased, how: "saved name" };
  const exact = s.members.find((m) => normName(m.name) === sent);
  if (exact) return { member: exact, how: "name" };

  const t = sent.split(" ");
  const [first, last] = [t[0], t[t.length - 1]];
  const sameLast = s.members.filter((m) => {
    const mt = normName(m.name).split(" ");
    return t.length > 1 && close(last, mt[mt.length - 1]);
  });
  const hits = sameLast.filter((m) => firstMatches(first, normName(m.name).split(" ")[0]));
  if (hits.length === 1) return { member: hits[0], how: "close name" };
  if (hits.length > 1) return { ambiguous: hits };
  return { closest: sameLast[0] };
}

// The code that rides in the note, e.g. PT-EV-FORMAL. Longest code wins so one can't shadow another.
export function findTarget(note: string, list: Target[]) {
  const up = note.toUpperCase();
  return [...list].sort((a, b) => b.code.length - a.code.length).find((t) => up.includes(t.code));
}

// Whole number of tickets this amount covers at this price, or 0 if it isn't a clean multiple.
export function quantityFor(amount: number, price: number) {
  if (price <= 0) return 0;
  const q = Math.round((amount / price) * 100) / 100;
  return Number.isInteger(q) && q >= 1 && q <= 20 ? q : 0;
}

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Clues in a vague note: the event's name ("formal") or its weekday ("for sat").
function noteHint(note: string, t: Target) {
  const n = normName(note);
  const words = normName(t.name).split(" ").filter((w) => w.length >= 4);
  if (words.some((w) => n.includes(w))) return `note mentions “${t.name}”`;
  if (t.date) {
    const day = DAYS[new Date(t.date).getDay()];
    if (n.split(" ").some((w) => w.startsWith(day) && w.length <= 8)) return `note says “${day}” and ${t.name} is on a ${new Date(t.date).toLocaleDateString("en-US", { weekday: "long" })}`;
  }
  return "";
}

type Outcome =
  | { kind: "skip" }
  | { kind: "auto"; tag: PaymentTag; memberId: string; quantity: number; linked: true }
  | { kind: "review"; suggestion: Suggestion; linked: boolean };

// The matching rules, in order: code in the note, whole multiple of the price, paid after the
// link went out, and a sender we can put a name to. Anything that fails a rule goes to review.
export function classify(s: State, row: StatementRow, list = targets(s)): Outcome {
  if (row.amount <= 0 || !/payment|charge/i.test(row.type) || (row.status && !/complete|issued/i.test(row.status)))
    return { kind: "skip" };
  if (s.payments.some((p) => p.ref === row.id) || s.review.some((r) => r.row.id === row.id)) return { kind: "skip" };

  const L = label(s.org.memberLabel);
  const who = matchMember(s, row.from);
  const memberId = who.member?.id ?? (who.ambiguous ? undefined : who.closest?.id);
  const whoReason = who.member
    ? ""
    : who.ambiguous
      ? `“${row.from}” could be ${who.ambiguous.map((m) => m.name).join(" or ")}`
      : who.closest
        ? `“${row.from}” isn't on the roster; closest is ${who.closest.name}`
        : `“${row.from}” isn't on the roster`;

  const t = findTarget(row.note, list);
  if (t) {
    const qty = quantityFor(row.amount, t.price);
    const early = !t.sharedAt || row.at < t.sharedAt;
    if (qty && !early && who.member) return { kind: "auto", tag: t.tag, memberId: who.member.id, quantity: qty, linked: true };
    const reasons = [
      !qty &&
        `${money(row.amount)} isn't a multiple of the ${money(t.price)} price${row.amount < t.price ? ", maybe split with a friend" : ""}`,
      early && (t.sharedAt ? "paid before the link was shared" : `the ${t.name} link hasn't been shared yet`),
      whoReason,
    ].filter(Boolean);
    return {
      kind: "review",
      linked: true,
      suggestion: { tag: t.tag, memberId, quantity: qty || 1, reason: `Code for ${t.name}, but ${reasons.join("; ")}` },
    };
  }

  // No code: suggest by amount, then by clues in the note.
  const byAmount = list.filter((x) => quantityFor(row.amount, x.price));
  const hinted = list.map((x) => ({ x, hint: noteHint(row.note, x) })).filter((h) => h.hint);
  const pick = hinted.find((h) => byAmount.includes(h.x)) ?? (byAmount.length === 1 ? { x: byAmount[0], hint: "" } : hinted[0]);
  if (!pick)
    return {
      kind: "review",
      linked: false,
      suggestion: {
        memberId,
        quantity: 1,
        reason: `No code in the note and ${money(row.amount)} doesn't match any price${whoReason ? `; ${whoReason}` : ""}`,
      },
    };
  const qty = quantityFor(row.amount, pick.x.price);
  const reasons = [
    qty ? `amount matches ${pick.x.name}` : `${money(row.amount)} isn't a multiple of the ${money(pick.x.price)} price`,
    "no code in note",
    pick.hint,
    pick.x.sharedAt && row.at < pick.x.sharedAt && "paid before the link was shared",
    whoReason || (who.member && `sender is ${who.member.name}`),
  ].filter(Boolean);
  const reason = reasons.join(", ");
  return {
    kind: "review",
    linked: false,
    suggestion: { tag: pick.x.tag, memberId, quantity: qty || 1, reason: reason.charAt(0).toUpperCase() + reason.slice(1) },
  };
}

// Records one statement row as a payment. ref is the Venmo transaction ID, so re-imports skip it.
export function recordRow(
  s: State,
  row: StatementRow,
  tag: PaymentTag,
  memberId: string,
  quantity: number,
  source: "statement" | "review"
): State {
  return addPayment(
    s,
    {
      memberId,
      amount: row.amount,
      tag,
      via: "venmo",
      at: row.at,
      ref: row.id,
      sender: row.from,
      quantity: quantity > 1 ? quantity : undefined,
      source,
    },
    uid()
  );
}

// Runs every row through the rules, records what matched, and queues the rest for review.
export function importStatement(s: State, rows: StatementRow[], file: string): { state: State; summary: ImportSummary } {
  const list = targets(s);
  const now = new Date().toISOString();
  const summary: ImportSummary = { at: now, file, linkTotal: 0, linkAuto: 0, linkReview: 0, directReview: 0, skipped: 0 };
  const queued: ReviewItem[] = [];
  let next = s;
  for (const row of [...rows].sort((a, b) => a.at.localeCompare(b.at))) {
    // Check against what's already recorded, including earlier rows from this same file.
    const out = classify({ ...next, review: [...next.review, ...queued] }, row, list);
    if (out.kind === "skip") summary.skipped++;
    else if (out.kind === "auto") {
      next = recordRow(next, row, out.tag, out.memberId, out.quantity, "statement");
      summary.linkTotal++;
      summary.linkAuto++;
    } else {
      queued.push({ row, suggestion: out.suggestion, state: "open", importedAt: now });
      if (out.linked) {
        summary.linkTotal++;
        summary.linkReview++;
      } else summary.directReview++;
    }
  }
  return { state: { ...next, review: [...next.review, ...queued], lastImport: summary }, summary };
}

export const suggestionLabel = (s: State, sug: Suggestion) =>
  [
    sug.tag ? tagName(s, sug.tag) : null,
    sug.memberId ? s.members.find((m) => m.id === sug.memberId)?.name : null,
    sug.tag && sug.quantity > 1 ? `x${sug.quantity}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
