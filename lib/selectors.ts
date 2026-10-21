import type { Member, PaymentTag, State } from "./types";
import { sameTag } from "./util";

export const memberName = (s: State, id: string) =>
  s.members.find((m) => m.id === id)?.name ?? "Unknown";

export const viewer = (s: State): Member =>
  s.members.find((m) => m.id === s.viewAs) ?? s.members[0];

export const treasurer = (s: State): Member | undefined =>
  s.members.find((m) => m.role === "treasurer");

export const isAdmin = (s: State) => viewer(s).role !== "member";

export const eventName = (s: State, id: string | null) =>
  id ? s.events.find((e) => e.id === id)?.name ?? "Unknown event" : "General";

export const tagName = (s: State, tag: PaymentTag) =>
  tag.kind === "dues" ? `${s.org.term} dues` : eventName(s, tag.eventId);

export const tagPrice = (s: State, tag: PaymentTag) =>
  tag.kind === "dues" ? s.org.duesAmount : s.events.find((e) => e.id === tag.eventId)?.price ?? 0;

// Collection stats for one payment tag: dues or a single event.
export function collection(s: State, tag: PaymentTag) {
  const pays = s.payments.filter((p) => sameTag(p.tag, tag));
  const paidIds = new Set(pays.map((p) => p.memberId));
  const price = tagPrice(s, tag);
  const target = price * s.members.length;
  const collected = pays.reduce((a, p) => a + p.amount, 0);
  const unpaid = s.members.filter((m) => !paidIds.has(m.id));
  return {
    payments: pays,
    paidCount: paidIds.size,
    unpaid,
    collected,
    target,
    pct: target ? Math.min(1, collected / target) : 0,
  };
}

export function eventSpend(s: State, eventId: string) {
  const r = s.reimbursements.filter((x) => x.eventId === eventId && x.status !== "rejected");
  return {
    committed: r.filter((x) => x.status !== "submitted").reduce((a, x) => a + x.amount, 0),
    pending: r.filter((x) => x.status === "submitted").reduce((a, x) => a + x.amount, 0),
  };
}

export function balance(s: State) {
  const inflow = s.payments.reduce((a, p) => a + p.amount, 0);
  const outflow = s.reimbursements
    .filter((r) => r.status === "paid")
    .reduce((a, r) => a + r.amount, 0);
  return s.org.openingBalance + inflow - outflow;
}

export function owed(s: State) {
  const approved = s.reimbursements.filter((r) => r.status === "approved");
  const submitted = s.reimbursements.filter((r) => r.status === "submitted");
  return {
    approved: approved.reduce((a, r) => a + r.amount, 0),
    submitted: submitted.reduce((a, r) => a + r.amount, 0),
    approvedCount: approved.length,
    submittedCount: submitted.length,
  };
}

export function memberTotals(s: State, memberId: string) {
  const pays = s.payments.filter((p) => p.memberId === memberId);
  return { payments: pays, total: pays.reduce((a, p) => a + p.amount, 0) };
}

// Everything a member is expected to pay this term, and whether they have.
export function memberObligations(s: State, memberId: string) {
  const tags: PaymentTag[] = [];
  if (s.org.modules.dues) tags.push({ kind: "dues" });
  if (s.org.modules.events) s.events.forEach((e) => tags.push({ kind: "event", eventId: e.id }));
  return tags.map((tag) => ({
    tag,
    name: tagName(s, tag),
    price: tagPrice(s, tag),
    paid: s.payments.some((p) => p.memberId === memberId && sameTag(p.tag, tag)),
  }));
}
