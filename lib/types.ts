export type ModuleKey = "dues" | "events" | "reimbursements" | "packets" | "handoff";

export type MemberLabel = "members" | "families" | "volunteers" | "players";

export type PacketTemplate = "university" | "grant";

// Venmo's terms bar collecting for a group on a personal account, so we recommend a business profile.
export type VenmoProfile = "business" | "personal";

export type Plan = "free" | "pro";

// A Venmo sender name that belongs to a member, e.g. a parent paying for a student.
export interface Alias {
  name: string;
  memberId: string;
}

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
  venmoProfile: VenmoProfile;
  plan: Plan;
  proBilling?: "semester" | "year";
  depositAt?: string; // when the $5 refundable deposit was placed
  aliases: Alias[];
  duesLinkSharedAt?: string; // first time an officer copied the dues link
}

// Treasurer is an officer who also holds the books. Officers see everything; members see only their own account.
export type Role = "treasurer" | "officer" | "member";

export interface Member {
  id: string;
  name: string;
  email: string;
  venmo: string; // Venmo handle, without the @
  role: Role;
  title?: string;
  avatar: string | null; // data URL
  passwordHash: string | null; // null until they set a password
  joinedAt: string;
  source: "owner" | "signup" | "added";
}

export interface OrgEvent {
  id: string;
  name: string;
  date: string; // ISO
  location: string;
  price: number; // per person
  budget: number; // hidden in v1, kept for v2
  purpose: string;
  linkSharedAt?: string; // first time an officer copied this event's link
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
  fromHandle?: string; // payer's Venmo handle at the time they paid
  quantity?: number; // tickets covered by this payment, when more than one
  paidById?: string; // member who sent the money, when paying for someone else
  sender?: string; // the "From" name on the Venmo statement
  source?: "link" | "statement" | "review" | "cash";
  venmoId?: string; // statement transaction that confirmed a link payment
}

// One incoming row from a Venmo statement CSV.
export interface StatementRow {
  id: string; // Venmo transaction ID
  at: string;
  type: string;
  status: string;
  note: string;
  from: string;
  to: string;
  amount: number;
}

export interface Suggestion {
  tag?: PaymentTag;
  memberId?: string;
  quantity: number;
  reason: string;
}

// A statement row that couldn't be matched automatically.
export interface ReviewItem {
  row: StatementRow;
  suggestion: Suggestion;
  state: "open" | "confirmed" | "ignored";
  importedAt: string;
}

export interface ImportSummary {
  at: string;
  file: string;
  linkTotal: number; // rows with a payment code in the note
  linkAuto: number;
  linkReview: number;
  directReview: number; // rows without a code, sent to review
  skipped: number; // outgoing, transfers, or already imported
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
  review: ReviewItem[];
  lastImport?: ImportSummary;
}
