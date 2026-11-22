import type { ModuleKey } from "./types";

// v1 ships three things: event payment links, the shared balance, and funding packets (Pro).
// Everything else stays in the code, hidden, until v2.
export const V1_MODULES: ModuleKey[] = ["dues", "events", "packets"];

export const isV1Module = (k: ModuleKey) => V1_MODULES.includes(k);

// Routes for cut features. The pages still exist; officers who land on one go back to the overview.
export const V2_ROUTES = ["/reimbursements", "/handoff"];

export const COMING_IN_V2 = [
  { name: "Reimbursement queue", desc: "Officers submit receipts and see when they'll be paid back." },
  { name: "Treasurer handoff", desc: "Pass the full record to the next treasurer in one click." },
  { name: "One-tap reminders", desc: "Nudge everyone who hasn't paid for an event." },
  { name: "Event budgets", desc: "Track spending against each event's budget." },
];

// Hidden v1 features, kept so v2 can turn them back on.
export const SHOW_REMINDERS = false;
export const SHOW_BUDGETS = false;

// Venmo business profiles keep 1.9% + $0.10 of each payment received.
export const venmoFee = (amount: number) => Math.round((amount * 0.019 + 0.1) * 100) / 100;
export const afterVenmoFee = (amount: number) => Math.max(0, amount - venmoFee(amount));

export const PRO_PRICE = { semester: 30, year: 50 };
