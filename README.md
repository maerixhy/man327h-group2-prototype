# Paper Trail

A shared money ledger for volunteer-run groups like student orgs, PTAs, youth sports teams, and small nonprofits. It sits on top of the payment apps groups already use, so the treasurer's personal Venmo stops being the group's bank.

Prototype for MAN 327H, Team 2.

## What the prototype shows

| Screen | Path | Who | What it does |
| --- | --- | --- | --- |
| Landing | `/` | Anyone | Pitch, set up a workspace, or sign in |
| Onboarding | `/onboarding` | New treasurer | Creates the treasurer's account, then name, logo, brand color, Venmo handle, and which tabs appear |
| Sign in | `/login` | Anyone | Email and password |
| Overview | `/dashboard` | Officers | Balance as a statement header, money owed to officers, dues and events, recent entries |
| Ledger | `/ledger` | Officers | Every numbered entry in and out, with running balance and CSV export |
| Dues / Events | `/dues`, `/events`, `/events/[id]` | Officers | Who has paid, one-tap reminders, cash logging, payment links, budget vs. spending |
| Reimbursements | `/reimbursements` | Officers | Receipt queue, approve with a payback date (stamped with the approver's initials), mark paid |
| Funding packets | `/packets` | Officers | Funding request or grant report built from receipts, with a pre-submission check and signature line |
| Members | `/members` | Officers | Everyone's name, role, and login email. Add people, change roles, create or reset logins |
| Handoff | `/handoff` | Treasurer | Passes the books to the next treasurer |
| My account | `/me` | Everyone | What you've paid (with receipts) and what's still coming up. Members see only their own records |
| Profile | `/profile` | Everyone | Photo, name, email, password, light/dark theme |
| Payment link | `/pay/dues`, `/pay/[eventId]` | Anyone | Pay with Venmo, then get a receipt. Signed-out visitors find their name or use "Not on the list? Add yourself" |

### Accounts and roles

- Officers (treasurer, president, chairs) see everything. Members only see their own payments and what they still owe: no collection ratios, no other members' names, no reimbursements.
- The person who sets up the workspace is the treasurer. The starter roster has no passwords yet. From **Members**, an officer clicks **Create login** to get a temporary password for someone.
- Sign-ins are kept per browser tab, so you can be the treasurer in one tab and a member in another. A new tab starts signed in as whoever signed in last. Use **Sign in → Use a different account** to switch.
- New people can join themselves from any payment link with **Not on the list? Add yourself**. They show up on the Members page right away.

### Notes

- All data lives in your browser (localStorage). Passwords are stored as hashes. **Settings → Delete workspace** starts over.
- Venmo has no public payments API, so the payment link opens a real Venmo pay link and then asks "Did it go through?" A production version would reconcile automatically by matching the tag code in the payment note.
- Open a payment link in a second tab: paying there updates the treasurer's overview live.
- Light and dark themes follow the system by default. Switch from the account menu, Profile, or the landing page.

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
    dashboard/ ledger/ dues/ events/ reimbursements/ packets/ members/ handoff/ settings/ me/ profile/ receipt/
  login/                 Sign in
components/              Shared UI (shell, org form, collection panel, reimbursement pieces)
lib/
  types.ts               Data model
  seed.ts                Starter org, roster, events, payments, receipts
  store.tsx              Browser storage and sign-in session (swap for a database later)
  auth.ts                Password hashing and temporary passwords
  theme.ts               Light/dark theme
  selectors.ts           Balance, collection, and obligation math
public/                  PWA manifest and icon
```

## Next steps past the prototype

- Server-side accounts and a database (e.g. Supabase) instead of browser storage
- Automatic payment matching from Venmo, Zelle, or a bank feed
- Funding packet templates matched to specific universities and grant funders
- Email or text delivery for reminders
