import type { Member, OrgEvent, State } from "./types";
import { uid } from "./util";

// public/sample-venmo-statement.csv is a Fall Formal ($15 tickets) statement that reproduces every
// failure seen in testing. Trying it adds that event and the people on it, if they aren't here already.
export const SAMPLE_FILE = "/sample-venmo-statement.csv";

export const SAMPLE_EVENT: OrgEvent = {
  id: "formal",
  name: "Fall Formal",
  date: "2026-12-05T19:00:00",
  location: "Texas Union Ballroom",
  price: 15,
  budget: 0,
  purpose: "End-of-semester formal for members and guests.",
  linkSharedAt: "2026-11-10T08:00:00",
};

export const SAMPLE_ROSTER = [
  "Maya Chen", "Jordan Lee", "Priya Nair", "Samuel Okafor", "Diego Flores", "Hannah Park", "Chris Wu",
  "Christina Wu", "Leah Patel", "Noor Haddad", "Ethan Brooks", "Grace Kim", "Marcus Bell", "Ava Thompson",
  "Rohan Das", "Tessa Nguyen", "Ben Alvarez", "Zoe Martin", "Daniel Nguyen", "Olivia Reyes", "Kevin Tran",
  "Sofia Garcia", "Isaac Moore", "Jasmine Lin", "Omar Siddiqui", "Emily Zhang", "Lucas Rivera", "Hana Sato",
  "Ryan Cho", "Mia Johnson", "Aiden Kim", "Nina Popov", "Victor Huang", "Elena Rossi", "Lily Evans",
  "Felix Wright", "Paige Turner", "Mateo Cruz", "Owen Patel", "Zara Ali",
];

export function sampleNeeds(s: State) {
  const names = new Set(s.members.map((m) => m.name.toLowerCase()));
  return {
    event: !s.events.some((e) => e.id === SAMPLE_EVENT.id),
    people: SAMPLE_ROSTER.filter((n) => !names.has(n.toLowerCase())),
  };
}

export function withSample(s: State): State {
  const need = sampleNeeds(s);
  const now = new Date().toISOString();
  const people: Member[] = need.people.map((name) => ({
    id: uid(),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.edu`,
    venmo: "",
    role: "member",
    avatar: null,
    passwordHash: null,
    joinedAt: now,
    source: "added",
  }));
  const event = {
    ...SAMPLE_EVENT,
    date: new Date(SAMPLE_EVENT.date).toISOString(),
    linkSharedAt: new Date(SAMPLE_EVENT.linkSharedAt!).toISOString(),
  };
  return {
    ...s,
    events: need.event ? [...s.events, event] : s.events,
    members: [...s.members, ...people],
  };
}
