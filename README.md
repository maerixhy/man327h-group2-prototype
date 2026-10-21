# Paper Trail

A shared money ledger for volunteer-run groups like student orgs, PTAs, youth sports teams, and small nonprofits. It sits on top of the payment apps groups already use, so the treasurer's personal Venmo stops being the group's bank.

Prototype v1.0 for MAN 327H, Team 2.

## What the prototype shows

| Screen | Path | What it does |
| --- | --- | --- |
| Landing | `/` | Pitch and entry point to the demo |
| Onboarding | `/onboarding` | Org customizes name, logo, brand color, member label, Venmo handle, and which tabs appear |
| Overview | `/dashboard` | Live balance, money owed to officers, dues and event collection, activity feed |
| Ledger | `/ledger` | Every payment in and payback out, tagged automatically, with CSV export |
| Dues | `/dues` | Who has paid, one-tap reminders, shareable payment link |
| Events | `/events`, `/events/[id]` | Per-event payment links, "82% collected, 3 unpaid" view, budget vs. spending |
| Reimbursements | `/reimbursements` | Receipt-photo queue, approve with a payback date, mark paid |
| Funding packets | `/packets` | Builds a university funding request or a grant expense report from saved receipts, flags missing receipts and unapproved lines, prints to PDF |
| Handoff | `/handoff` | Passes the full record to the next treasurer in one click |
| Member account | `/me` | What a member has paid, what they owe, and where their reimbursement stands |
| Payment link | `/pay/dues`, `/pay/[eventId]` | The no-login page members open from the group chat. Opens Venmo with the amount and a tag code prefilled |

Use the **"Demo: viewing as"** menu at the bottom of the sidebar to switch between the treasurer and a regular member.

### Demo notes

- All data lives in your browser (localStorage). Nothing is sent anywhere. Use **Settings → Reset demo** to start over.
- Venmo has no public payments API, so the prototype opens a real Venmo pay link and then asks "Did it go through?" A production version would reconcile payments automatically by matching the tag code in the payment note.
- Open a payment link in a second tab: paying there updates the treasurer's dashboard live.
- It's mobile-first and installable as a PWA ("Add to Home Screen").

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Put it on GitHub

```bash
cd paper-trail
git init
git add .
git commit -m "Paper Trail prototype v1.0"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/paper-trail.git
git push -u origin main
```

(Create an empty repo named `paper-trail` on github.com first, without a README.)

## Deploy a shareable link

1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New → Project**, pick the `paper-trail` repo, and click **Deploy**. No settings needed.
3. Vercel gives you a URL like `paper-trail-xyz.vercel.app` to put in the prototype doc and slides.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS

## Project layout

```
app/
  page.tsx               Landing
  onboarding/            Workspace setup
  pay/[id]/              Public payment link (no login)
  (app)/                 Everything inside the sidebar shell
    dashboard/ ledger/ dues/ events/ reimbursements/ packets/ handoff/ settings/ me/
components/              Shared UI (shell, org form, collection panel, reimbursement pieces)
lib/
  types.ts               Data model
  seed.ts                Demo org, members, events, payments, receipts
  store.tsx              Browser storage (swap for a database later)
  selectors.ts           Balance, collection, and obligation math
public/                  PWA manifest and icon
```

## Next steps past the prototype

- Real accounts and a database (e.g. Supabase) instead of browser storage
- Automatic payment matching from Venmo, Zelle, or a bank feed
- Funding packet templates matched to specific universities and grant funders
- Email or text delivery for reminders
