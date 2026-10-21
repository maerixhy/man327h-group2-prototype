export type ModuleKey = "dues" | "events" | "reimbursements" | "packets" | "handoff";

export type MemberLabel = "members" | "families" | "volunteers" | "players";

export type PacketTemplate = "university" | "grant";

export interface Org {
  name: string;
  logo: string | null; // data URL
  color: string; // hex
  memberLabel: MemberLabel;
  venmoHandle: string;
  duesAmount: number;
  term: string;
  openingBalance: number;
  packetTemplate: PacketTemplate;
  modules: Record<ModuleKey, boolean>;
}

// Treasurer is an officer who also holds the books. Officers see everything; members see only their own account.
export type Role = "treasurer" | "officer" | "member";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  title?: string;
  avatar: string | null; // data URL
  passwordHash: string | null; // null until they set a password
  joinedAt: string;
  source: "roster" | "link" | "added";
}

export interface OrgEvent {
  id: string;
  name: string;
  date: string; // ISO
  location: string;
  price: number; // per person
  budget: number;
  purpose: string;
}

export type PaymentTag = { kind: "dues" } | { kind: "event"; eventId: string };

export interface Payment {
  id: string;
  no: number; // entry number on the ledger
  memberId: string;
  amount: number;
  tag: PaymentTag;
  via: "venmo" | "cash" | "zelle";
  at: string;
  ref: string; // the tag code carried in the Venmo note
  recordedBy?: string; // member id, for cash an officer logged
}

export type ReimbStatus = "submitted" | "approved" | "paid" | "rejected";

export interface Reimbursement {
  id: string;
  no: number;
  submitterId: string;
  eventId: string | null;
  vendor: string;
  description: string;
  amount: number;
  receipt: string | null; // data URL
  status: ReimbStatus;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paidBy?: string;
  paidNo?: number; // the payout's own ledger entry number
  expectedBy?: string;
  rejectReason?: string;
}

export interface Reminder {
  id: string;
  memberId: string;
  tag: PaymentTag;
  at: string;
}

export interface LogEntry {
  id: string;
  at: string;
  text: string;
  by?: string; // member id
}

export interface State {
  version: number;
  onboarded: boolean;
  org: Org;
  members: Member[];
  events: OrgEvent[];
  payments: Payment[];
  reimbursements: Reimbursement[];
  reminders: Reminder[];
  log: LogEntry[];
  seq: number; // next ledger entry number
}
