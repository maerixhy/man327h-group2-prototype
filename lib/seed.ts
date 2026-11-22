import type { State } from "./types";

// A brand-new workspace: no people, events, or money yet. The treasurer fills in the rest.
export function seedState(): State {
  return {
    version: 3,
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
      modules: { dues: true, events: true, reimbursements: true, packets: true, handoff: true },
    },
    members: [],
    events: [],
    payments: [],
    reimbursements: [],
    reminders: [],
    log: [],
    seq: 1,
  };
}
