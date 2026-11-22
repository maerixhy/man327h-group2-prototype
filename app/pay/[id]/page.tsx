"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useStore } from "@/lib/store";
import { addPayment, homePath, isOfficer, tagName, tagPrice } from "@/lib/selectors";
import type { Member, PaymentTag } from "@/lib/types";
import { longDate, money, sameTag, tagCode, uid } from "@/lib/util";
import { Avatar, Button, ButtonLink, OrgMark, Select } from "@/components/ui";
import Receipt from "@/components/Receipt";

// "M. Chen" — short enough to fit several in a Venmo note.
const short = (name: string) => {
  const t = name.trim().split(/\s+/);
  return t.length > 1 ? `${t[0][0]}. ${t[t.length - 1]}` : t[0];
};

// The link people open from the group chat. Payments are always tied to the signed-in account.
export default function Pay() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, me, update, log, signOut } = useStore();
  const [step, setStep] = useState<"start" | "confirm" | "done">("start");
  const [qty, setQty] = useState(1);
  const [others, setOthers] = useState<string[]>([]);
  const [addingOthers, setAddingOthers] = useState(false);
  const [q, setQ] = useState("");
  const [mobile, setMobile] = useState(true);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => setMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)), []);

  const ev = state.events.find((e) => e.id === id);
  const tag: PaymentTag | null = !state.onboarded
    ? null
    : id === "dues"
      ? state.org.duesAmount > 0
        ? { kind: "dues" }
        : null
      : ev
        ? { kind: "event", eventId: ev.id }
        : null;

  const price = tag ? tagPrice(state, tag) : 0;
  const name = tag ? tagName(state, tag) : "";
  const code = tag ? tagCode(tag) : "";
  const paidFor = (m: Member) => !!tag && state.payments.some((p) => p.memberId === m.id && sameTag(p.tag, tag));
  const otherPeople = others.map((oid) => state.members.find((m) => m.id === oid)).filter(Boolean) as Member[];
  const total = price * (qty + otherPeople.length);
  // Code first, so it survives when someone edits the end of the note.
  const note = [
    `${code} ${name}`,
    qty > 1 && `x${qty}`,
    otherPeople.length > 0 && `+ ${otherPeople.map((m) => short(m.name)).join(", ")}`,
  ]
    .filter(Boolean)
    .join(" ");
  const venmoUrl = `https://venmo.com/${state.org.venmoHandle}?txn=pay&amount=${total.toFixed(2)}&note=${encodeURIComponent(note)}`;

  useEffect(() => {
    if (mobile || !tag) return;
    QRCode.toDataURL(venmoUrl, { margin: 1, width: 360 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [mobile, venmoUrl, tag]);

  if (!ready) return null;
  if (!tag) return <div className="p-10 text-center text-sm text-muted">This payment link isn&apos;t active.</div>;

  const here = `/pay/${id}`;
  const payment = me
    ? [...state.payments].reverse().find((p) => p.memberId === me.id && sameTag(p.tag, tag))
    : undefined;
  // Payments sent together with this one, for people the payer covered.
  const covered = payment
    ? state.payments.filter((p) => p.paidById === me?.id && p.at === payment.at && sameTag(p.tag, tag))
    : [];

  const matches =
    q.trim().length >= 2
      ? state.members
          .filter(
            (m) =>
              m.id !== me?.id &&
              !others.includes(m.id) &&
              !paidFor(m) &&
              m.name
                .toLowerCase()
                .split(/\s+/)
                .some((w) => w.startsWith(q.trim().toLowerCase())),
          )
          .slice(0, 5)
      : [];

  const record = () => {
    if (!me) return;
    const at = new Date().toISOString();
    const fromHandle = me.venmo || undefined;
    update((s) => {
      let next = addPayment(
        s,
        {
          memberId: me.id,
          amount: price * qty,
          tag,
          via: "venmo",
          at,
          ref: code,
          fromHandle,
          quantity: qty > 1 ? qty : undefined,
          source: "link",
        },
        uid(),
      );
      // One payment per person covered, so each shows as paid on their own account.
      for (const m of otherPeople)
        next = addPayment(
          next,
          {
            memberId: m.id,
            amount: price,
            tag,
            via: "venmo",
            at,
            ref: code,
            fromHandle,
            paidById: me.id,
            source: "link",
          },
          uid(),
        );
      return next;
    });
    log(
      `${me.name} paid ${money(total)} for ${name}${qty > 1 ? ` (x${qty})` : ""}${
        otherPeople.length ? `, covering ${otherPeople.map((m) => m.name).join(", ")}` : ""
      }`,
    );
    setStep("done");
  };

  const copy = async (what: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };

  return (
    <div className="flex min-h-dvh justify-center px-4 py-8 md:py-14">
      <div className="w-full max-w-[400px]">
        <div className="rounded-[3px] border border-rule bg-sheet">
          <div className="h-1.5 rounded-t-[3px] bg-brand" />
          <div className="p-6">
            <div className="flex items-center gap-3">
              <OrgMark name={state.org.name} logo={state.org.logo} size={36} />
              <div className="text-sm font-semibold leading-tight">{state.org.name}</div>
            </div>
            <div className="mt-6 border-t border-rule pt-4 text-sm text-muted">{name}</div>
            <div className="num text-[48px] font-medium leading-none tracking-[-0.03em]">
              {money(payment ? price : total)}
            </div>
            {!payment && (qty > 1 || otherPeople.length > 0) && (
              <div className="num mt-1 text-xs text-muted">
                {qty + otherPeople.length} × {money(price)}
              </div>
            )}
            {ev && (
              <div className="mt-2 text-xs text-muted">
                {longDate(ev.date)}
                {ev.location && ` · ${ev.location}`}
              </div>
            )}

            {!payment && (
              <div className="mt-6 space-y-4 border-t border-rule pt-5">
                {!me ? (
                  <>
                    <p className="text-sm">Sign in so this payment is recorded to your account.</p>
                    <div className="grid gap-2">
                      <ButtonLink href={`/login?next=${encodeURIComponent(here)}`}>Sign in to pay</ButtonLink>
                      <ButtonLink href={`/join?next=${encodeURIComponent(here)}`} variant="secondary">
                        Create an account
                      </ButtonLink>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 text-sm">
                      <Avatar name={me.name} src={me.avatar} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{me.name}</span>
                        {me.venmo ? (
                          <span className="num block truncate text-xs text-muted">from @{me.venmo}</span>
                        ) : (
                          <Link href="/profile" className="block text-xs text-red-ink hover:underline">
                            Add your Venmo handle →
                          </Link>
                        )}
                      </span>
                      {tag.kind === "event" && step === "start" && (
                        <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                          Tickets
                          <Select
                            value={qty}
                            onChange={(e) => setQty(Number(e.target.value))}
                            className="num w-auto px-2 py-1 text-[13px]"
                          >
                            {[1, 2, 3, 4].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </Select>
                        </label>
                      )}
                    </div>

                    {step === "start" && (
                      <div className="text-sm">
                        {otherPeople.map((m) => (
                          <div key={m.id} className="flex items-center justify-between border-b border-rule py-1.5">
                            <span>
                              + {m.name} <span className="num text-xs text-muted">{money(price)}</span>
                            </span>
                            <button
                              onClick={() => setOthers(others.filter((x) => x !== m.id))}
                              className="text-xs text-muted hover:text-ink"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {addingOthers ? (
                          <div className="mt-2">
                            <input
                              autoFocus
                              value={q}
                              onChange={(e) => setQ(e.target.value)}
                              placeholder="Type their name"
                              className="w-full rounded-[3px] border border-rule-strong bg-sheet px-2.5 py-1.5 text-sm outline-none focus:border-ink"
                            />
                            {matches.length > 0 && (
                              <ul className="mt-1 rounded-[3px] border border-rule">
                                {matches.map((m) => (
                                  <li key={m.id}>
                                    <button
                                      onClick={() => (setOthers([...others, m.id]), setQ(""))}
                                      className="block w-full border-b border-rule px-3 py-1.5 text-left last:border-0 hover:bg-ink/5"
                                    >
                                      {m.name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {q.trim().length >= 2 && matches.length === 0 && (
                              <p className="mt-1 text-xs text-muted">No one by that name who still owes for this.</p>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingOthers(true)}
                            className="mt-1 text-xs font-medium text-brand-ink hover:underline"
                          >
                            Paying for someone else too?
                          </button>
                        )}
                      </div>
                    )}

                    {step === "start" && mobile && (
                      <a
                        href={venmoUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setStep("confirm")}
                        className="block rounded-[3px] bg-brand py-3 text-center text-sm font-medium text-on-brand hover:brightness-110"
                      >
                        Pay {money(total)} with Venmo
                      </a>
                    )}

                    {/* On a computer the link can't open the Venmo app, so show a code to scan and exactly what to type. */}
                    {step === "start" && !mobile && (
                      <div className="space-y-3 border-t border-rule pt-4">
                        <div className="text-sm font-medium">Scan with your phone&apos;s camera</div>
                        {qr && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={qr}
                            alt="QR code that opens Venmo with this payment filled in"
                            className="mx-auto h-44 w-44 rounded-[3px] border border-rule bg-white p-1"
                          />
                        )}
                        <div className="text-xs text-muted">Or pay in the Venmo app by hand:</div>
                        <dl className="num space-y-1.5 text-[13px]">
                          {[
                            ["To", `@${state.org.venmoHandle}`],
                            ["Amount", total.toFixed(2)],
                            ["Note", note],
                          ].map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2">
                              <dt className="w-14 shrink-0 text-muted">{k}</dt>
                              <dd className="min-w-0 flex-1 truncate">{v}</dd>
                              <button onClick={() => copy(k, v)} className="shrink-0 text-xs text-muted hover:text-ink">
                                {copied === k ? "Copied" : "Copy"}
                              </button>
                            </div>
                          ))}
                        </dl>
                        <Button className="w-full" onClick={record}>
                          I sent {money(total)}
                        </Button>
                      </div>
                    )}

                    {step === "confirm" && (
                      <div className="space-y-3 border-l-[3px] border-ink pl-3 text-sm">
                        <p>
                          Venmo opened with the amount and the note <code className="num text-xs">{note}</code> filled
                          in. Did it go through?
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={record}>
                            Yes, I paid
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setStep("start")}>
                            Not yet
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <p className="text-center text-xs text-ink">Keep the code in the note so your payment is counted.</p>
                <p className="num text-center text-[11px] text-muted">
                  to @{state.org.venmoHandle} · paying cash? hand it to the treasurer
                </p>
              </div>
            )}
          </div>
        </div>

        {payment && me && (
          <div className="mt-6 flex flex-col items-center">
            <p className="mb-4 text-sm">
              {step === "done" ? "Got it" : "Already paid"}, {me.name.split(" ")[0]}. Here&apos;s your receipt.
            </p>
            <Receipt
              className="border-x border-t border-rule"
              r={{
                org: state.org.name,
                item: `${name}${payment.quantity ? ` x${payment.quantity}` : ""}`,
                amount: payment.amount + covered.reduce((a, p) => a + p.amount, 0),
                payer: me.name,
                from: payment.fromHandle,
                also: covered.map((p) => state.members.find((m) => m.id === p.memberId)?.name ?? ""),
                no: payment.no,
                id: payment.id,
                at: payment.at,
                via: payment.via,
                to: state.org.venmoHandle,
                code: tagCode(payment.tag),
              }}
            />
          </div>
        )}

        {me && (
          <div className="mt-6 flex justify-center gap-4 text-xs text-muted">
            <Link href={homePath(me)} className="hover:text-ink">
              {isOfficer(me) ? "Back to overview →" : "Go to my dashboard →"}
            </Link>
            <button onClick={() => (signOut(), setStep("start"))} className="hover:text-ink">
              Not {me.name.split(" ")[0]}? Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
