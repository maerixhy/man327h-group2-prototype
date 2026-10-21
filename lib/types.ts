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

export type Role = "treasurer" | "officer" | "member";

export interface Member {
  id: string;
  name: string;
  role: Role;
  title?: string;
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
  memberId: string;
  amount: number;
  tag: PaymentTag;
  via: "venmo" | "cash" | "zelle";
  at: string;
  ref: string; // the tag code carried in the Venmo note
}

export type ReimbStatus = "submitted" | "approved" | "paid" | "rejected";

export interface Reimbursement {
  id: string;
  submitterId: string;
  eventId: string | null;
  vendor: string;
  description: string;
  amount: number;
  receipt: string | null; // data URL
  status: ReimbStatus;
  submittedAt: string;
  approvedAt?: string;
  paidAt?: string;
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
  viewAs: string; // member id, used to switch between treasurer and member views in the demo
}
