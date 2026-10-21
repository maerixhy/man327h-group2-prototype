import type { Member, Payment, Reimbursement, State } from "./types";
import { daysFromNow, tagCode } from "./util";
import { fakeReceipt } from "./receipt";

const names = [
  "Alex Rivera", "Jordan Lee", "Priya Nair", "Sam Okafor", "Maya Chen", "Diego Flores",
  "Hannah Park", "Chris Wu", "Leah Patel", "Noor Haddad", "Ethan Brooks", "Grace Kim",
  "Marcus Bell", "Ava Thompson", "Rohan Das", "Tessa Nguyen", "Ben Alvarez", "Zoe Martin",
];

export function seedState(): State {
  const members: Member[] = names.map((name, i) => ({
    id: `m${i + 1}`,
    name,
    email: `${name.toLowerCase().replace(" ", ".")}@sunriseut.org`,
    role: i === 0 ? "treasurer" : i < 3 ? "officer" : "member",
    title: i === 0 ? "Treasurer" : i === 1 ? "Events Chair" : i === 2 ? "President" : undefined,
    avatar: null,
    passwordHash: null,
    joinedAt: daysFromNow(-60),
    source: "roster",
  }));

  const events = [
    {
      id: "formal",
      name: "Fall Formal",
      date: daysFromNow(24),
      location: "Texas Union Ballroom",
      price: 35,
      budget: 900,
      purpose: "Annual end-of-semester formal for all members, open to guests.",
    },
    {
      id: "culture",
      name: "Culture Night",
      date: daysFromNow(31),
      location: "Student Activity Center",
      price: 10,
      budget: 500,
      purpose: "Free public showcase of performances and food, open to the campus community.",
    },
    {
      id: "games",
      name: "Game Night",
      date: daysFromNow(-11),
      location: "PCL Group Room 3.102",
      price: 5,
      budget: 120,
      purpose: "Member social with board games and snacks.",
    },
  ];

  const payments: Payment[] = [];
  let n = 0;
  const pay = (memberIdx: number[], amount: number, tag: Payment["tag"], daysAgoStart: number) => {
    memberIdx.forEach((i, k) => {
      const cash = k % 7 === 6;
      payments.push({
        id: `p${++n}`,
        no: 0,
        memberId: `m${i}`,
        amount,
        tag,
        via: cash ? "cash" : "venmo",
        at: daysFromNow(-(daysAgoStart - k * 0.6)),
        ref: tagCode(tag),
        recordedBy: cash ? "m1" : undefined,
      });
    });
  };
  pay([1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 15, 17], 40, { kind: "dues" }, 40);
  pay([1, 2, 3, 4, 5, 6, 7, 9, 11, 12, 14, 15, 16, 18], 5, { kind: "event", eventId: "games" }, 18);
  pay([1, 2, 3, 5, 6, 8, 10, 11, 13, 16, 17], 35, { kind: "event", eventId: "formal" }, 9);
  pay([2, 3, 7, 12], 10, { kind: "event", eventId: "culture" }, 4);

  const reimbursements: Reimbursement[] = [
    {
      id: "r1",
      no: 0,
      submitterId: "m2",
      eventId: "formal",
      vendor: "Texas Union Events",
      description: "Ballroom deposit for Fall Formal",
      amount: 400,
      receipt: fakeReceipt("Texas Union Events", [["Ballroom deposit", 400]]),
      status: "approved",
      submittedAt: daysFromNow(-6),
      approvedAt: daysFromNow(-2),
      approvedBy: "m1",
      expectedBy: daysFromNow(3),
    },
    {
      id: "r2",
      no: 0,
      submitterId: "m5",
      eventId: "games",
      vendor: "H-E-B",
      description: "Snacks and drinks for Game Night",
      amount: 86.42,
      receipt: fakeReceipt("H-E-B", [
        ["Chips variety pk", 18.97],
        ["Sparkling water x3", 14.85],
        ["Cookies x4", 19.96],
        ["Fruit tray", 24.99],
        ["Plates + napkins", 7.65],
      ]),
      status: "paid",
      submittedAt: daysFromNow(-10),
      approvedAt: daysFromNow(-9),
      approvedBy: "m1",
      paidAt: daysFromNow(-8),
      paidBy: "m1",
      expectedBy: daysFromNow(-8),
    },
    {
      id: "r3",
      no: 0,
      submitterId: "m3",
      eventId: "games",
      vendor: "Target",
      description: "Two card games",
      amount: 38.97,
      receipt: null,
      status: "submitted",
      submittedAt: daysFromNow(-1),
    },
    {
      id: "r4",
      no: 0,
      submitterId: "m2",
      eventId: "culture",
      vendor: "Party City",
      description: "Table decorations and banners",
      amount: 54.3,
      receipt: fakeReceipt("Party City", [
        ["Table runners x6", 23.94],
        ["Banner kit", 17.99],
        ["Tape + string lights", 12.37],
      ]),
      status: "submitted",
      submittedAt: daysFromNow(-0.3),
    },
  ];

  // Number every entry in the order it happened, starting where last term's book left off.
  const FIRST = 214;
  const entries: { at: string; set: (n: number) => void }[] = [
    ...payments.map((p) => ({ at: p.at, set: (n: number) => (p.no = n) })),
    ...reimbursements.map((r) => ({ at: r.submittedAt, set: (n: number) => (r.no = n) })),
    ...reimbursements
      .filter((r) => r.paidAt)
      .map((r) => ({ at: r.paidAt!, set: (n: number) => (r.paidNo = n) })),
  ];
  entries.sort((a, b) => a.at.localeCompare(b.at)).forEach((x, i) => x.set(FIRST + i));

  return {
    version: 2,
    onboarded: false,
    org: {
      name: "Sunrise Cultural Association",
      logo: null,
      color: "#1f6f5c",
      memberLabel: "members",
      venmoHandle: "sunrise-ut",
      duesAmount: 40,
      term: "Fall 2026",
      openingBalance: 1250,
      packetTemplate: "university",
      modules: { dues: true, events: true, reimbursements: true, packets: true, handoff: true },
    },
    members,
    events,
    payments,
    reimbursements,
    reminders: [],
    log: [
      { id: "l1", at: daysFromNow(-8), text: "Paid back Maya Chen $86.42 for Game Night snacks", by: "m1" },
      { id: "l2", at: daysFromNow(-2), text: "Approved Jordan Lee's $400.00 Fall Formal deposit", by: "m1" },
    ],
    seq: FIRST + entries.length,
  };
}
