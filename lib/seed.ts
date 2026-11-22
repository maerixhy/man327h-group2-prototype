import type { State } from "./types";

// A brand-new workspace: no people, events, or money yet. The treasurer fills in the rest.
export function seedState(): State {
  return {
    version: 4,
    onboarded: false,
    org: {
      name: "",
      logo: null,
      color: "#1f6f5c",
      memberLabel: "members",
      venmoHandle: "",
      duesAmount: 0,
      term: "",
      openingBalance: 0,
      packetTemplate: "university",
      // Reimbursements and handoff are v2 features, kept off for now.
      modules: { dues: true, events: true, reimbursements: false, packets: true, handoff: false },
      venmoProfile: "business",
      plan: "free",
      aliases: [],
    },
    members: [],
    events: [],
    payments: [],
    reimbursements: [],
    reminders: [],
    log: [],
    seq: 1,
    review: [],
  };
}
