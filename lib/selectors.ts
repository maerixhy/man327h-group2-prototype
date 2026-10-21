import type { Member, Payment, PaymentTag, Reimbursement, State } from "./types";
import { cap, label, sameTag } from "./util";

export const memberName = (s: State, id: string) =>
  s.members.find((m) => m.id === id)?.name ?? "Unknown";

export const treasurer = (s: State): Member | undefined =>
  s.members.find((m) => m.role === "treasurer");

export const isOfficer = (m: Member | null | undefined) => !!m && m.role !== "member";

// "Treasurer", "Events Chair", or the group's word for an officer or member.
export const roleLabel = (s: State, m: Member) => {
  const L = label(s.org.memberLabel);
  if (m.title) return m.title;
  return cap(m.role === "member" ? L.one : L.officer);
};

export const eventName = (s: State, id: string | null) =>
  id ? s.events.find((e) => e.id === id)?.name ?? "Unknown event" : "General";

export const tagName = (s: State, tag: PaymentTag) =>
  tag.kind === "dues" ? `${s.org.term} dues` : eventName(s, tag.eventId);

export const tagPrice = (s: State, tag: PaymentTag) =>
  tag.kind === "dues" ? s.org.duesAmount : s.events.find((e) => e.id === tag.eventId)?.price ?? 0;

export const tagPath = (tag: PaymentTag) => (tag.kind === "dues" ? "/pay/dues" : `/pay/${tag.eventId}`);

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

// Everything a member could pay this term, and whether they have.
export function memberObligations(s: State, memberId: string) {
  const items: { tag: PaymentTag; name: string; price: number; date?: string; past: boolean }[] = [];
  if (s.org.modules.dues) items.push({ tag: { kind: "dues" }, name: tagName(s, { kind: "dues" }), price: s.org.duesAmount, past: false });
  if (s.org.modules.events)
    s.events.forEach((e) =>
      items.push({
        tag: { kind: "event", eventId: e.id },
        name: e.name,
        price: e.price,
        date: e.date,
        past: new Date(e.date) < new Date(),
      })
    );
  return items.map((o) => ({
    ...o,
    payment: s.payments.find((p) => p.memberId === memberId && sameTag(p.tag, o.tag)),
  }));
}

// Adds a payment as the next numbered entry.
export function addPayment(s: State, p: Omit<Payment, "id" | "no">, id: string): State {
  return { ...s, seq: s.seq + 1, payments: [...s.payments, { ...p, id, no: s.seq }] };
}

export function addReimbursement(s: State, r: Omit<Reimbursement, "no">): State {
  return { ...s, seq: s.seq + 1, reimbursements: [{ ...r, no: s.seq }, ...s.reimbursements] };
}
