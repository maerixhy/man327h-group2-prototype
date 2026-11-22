# Paper Trail

Event payment links and Venmo statement matching for student orgs, and youth sports teams second. Members pay through a link that puts a code in the Venmo note; the treasurer uploads the Venmo statement and Paper Trail matches each payment to the right event and person. That's the ~18 minutes a week of matching by hand that it removes.

Prototype for MAN 327H, Team 2.

## What testing changed

- Payments through our event link matched the right event 89% of the time, from the code in the Venmo note. Direct payments matched only 54%. So v1 centers on the link and on matching the statement.
- 5 of 10 treasurers would pay for the funding packet generator, so it's the Pro feature. Reimbursements and handoff (2 votes each) and reminders (1) moved to v2.
- Venmo's terms bar business transactions on personal accounts, so setup recommends a Venmo business profile and shows its fee (1.9% + $0.10 per payment received).

## v1 features

| Feature | Plan | Where |
| --- | --- | --- |
| Event payment links | Free | `/events`, `/events/[id]`, `/pay/[id]`, `/dues`, `/pay/dues` |
| Venmo statement matching | Free | `/match` |
| Shared balance | Free | `/dashboard` (Overview), `/ledger`, `/me` (My account) |
| Funding packets | Pro | `/packets` |

**Plans.** Free: payment links, shared balance, ledger, statement matching. Pro ($30/semester or $50/year): funding packets. Anyone can build and preview a packet; printing, PDF, and CSV are Pro. The upgrade dialog's "Hold your spot with a $5 refundable deposit" is simulated: it marks the group as Pro and logs it. **Settings → Plan** switches between Free and Pro for demos.

**Coming in v2** (code kept, hidden, listed in Settings): reimbursement queue, treasurer handoff, one-tap reminders, event budgets. In v1, funding packets read expenses added with the **Add expense** form on an event or the Packets page (vendor, amount, purpose, receipt).

### Payment links

- The Venmo note puts the code first (`PT-EV-FORMAL Fall Formal`), and the page says "Keep the code in the note so your payment is counted."
- Event links have a 1–4 ticket picker (`x2` goes in the note) and "Paying for someone else too?", which records one payment per member covered.
- On a computer, where the link can't open the Venmo app, the page shows a QR code plus the @handle, amount, and exact note to type.
- Officers get **Copy group chat message** with the event, price, link, and a reminder to keep the code. Tip: pin it and post it before announcing the event. The first copy records when the link was shared.

### Statement matching (`/match`)

Upload a Venmo statement CSV (Venmo → Me → Statements → Download CSV). Columns are found by header name, so Venmo's title, balance, and disclaimer rows are ignored. Each incoming payment goes through these rules in order:

1. **Code in the note** → that event or dues.
2. **Amount is a whole multiple of the price** → quantity = amount ÷ price.
3. **Paid before the link was first shared** → review, not auto-match.
4. **"From" name → member**, using fuzzy first/last name matching ("Sam" for Samuel, "C Wu" flagged as ambiguous) plus saved aliases.

Rows that pass every rule are recorded automatically, with the Venmo transaction ID as the reference so re-importing a file never duplicates. If someone already tapped "Yes, I paid" on the link, the statement row confirms that payment instead of adding a second one. Everything else goes to **Needs review** with the raw note, amount, date, sender, a suggested match, and the reason. Officers can **Confirm**, **Reassign** (event, member, quantity, and "Remember this name" for a parent's account), or **Ignore**.

**Try with sample statement** loads `public/sample-venmo-statement.csv`, a $15 Fall Formal statement that reproduces every failure seen in testing: deleted codes, a parent's account, 2 tickets for $30 with an edited note, a split with a friend, a payment before the link was posted, vague notes like "for sat", and money going out. It adds the Fall Formal event and the people on the statement if they aren't in the workspace yet, then shows: "31 of 35 link payments matched automatically, 4 need review."

### Accounts

- A new workspace starts empty. Whoever sets it up is the treasurer. Everyone else signs up at `/join`; the treasurer can make people officers on the Members page.
- Officers see everything. Members see only their own payments and what's coming up.
- Sign-ins are kept per browser tab, so one tab can be the treasurer and another a member.

## 2-minute demo

1. **Set up a workspace** on the landing page. Pick "Business profile" for the Venmo question and set dues to $40 to see the fee note.
2. **Match payments → Try with sample statement.** Read the summary, then work the review queue: Reassign Linda Park to Hannah Park with "Remember this name", Confirm Mateo Cruz ("for sat"), and Ignore the 🍕 payment.
3. **Events → Fall Formal.** Copy the group chat message, add an expense with a receipt photo, then click **Open ↗** on the payment link to see the ticket picker and, on a laptop, the QR code.
4. **Funding packets.** Preview the packet, click **Print or save as PDF**, and hold a Pro spot in the upgrade dialog. Then print.
5. **Overview and Ledger.** The balance and every numbered entry, including the ones matched from the statement.

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. All data lives in your browser (localStorage); saved data from older versions is migrated on load. **Settings → Delete workspace** starts over.

Deploys to Netlify from `main` (see `netlify.toml`).

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · `qrcode`

## Project layout

```
app/
  page.tsx               Landing
  onboarding/ login/ join/
  pay/[id]/              Payment link
  (app)/                 Everything inside the sidebar shell
    dashboard/ ledger/ match/ dues/ events/ packets/ members/ settings/ me/ profile/ receipt/
    reimbursements/ handoff/   v2, hidden
components/              Shared UI (shell, org form, payment link, expenses, upgrade dialog, receipt)
lib/
  types.ts               Data model
  migrate.ts             Upgrades saved state to the current version
  statement.ts           Venmo CSV parser
  matching.ts            Matching rules and review suggestions
  sample.ts              Sample statement's event and roster
  features.ts            v1 scope, v2 list, Venmo fee, Pro prices
  store.tsx              Browser storage and sign-in session
  seed.ts                Empty starting workspace
public/
  sample-venmo-statement.csv
```

## Next steps past the prototype

- Server-side accounts and a database, so the sign-up link works across devices
- Real deposits and billing for Pro
- Pulling Venmo business statements automatically instead of uploading a CSV
- The v2 features above
