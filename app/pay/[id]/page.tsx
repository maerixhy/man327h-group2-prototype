"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { addPayment, homePath, isOfficer, tagName, tagPrice } from "@/lib/selectors";
import type { PaymentTag } from "@/lib/types";
import { longDate, money, sameTag, tagCode, uid } from "@/lib/util";
import { Avatar, Button, ButtonLink, OrgMark } from "@/components/ui";
import Receipt from "@/components/Receipt";

// The link people open from the group chat. Payments are always tied to the signed-in account.
export default function Pay() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, me, update, log, signOut } = useStore();
  const [step, setStep] = useState<"start" | "confirm" | "done">("start");

  if (!ready) return null;

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

  if (!tag)
    return <div className="p-10 text-center text-sm text-muted">This payment link isn&apos;t active.</div>;

  const price = tagPrice(state, tag);
  const name = tagName(state, tag);
  const code = tagCode(tag);
  const here = `/pay/${id}`;
  const payment = me
    ? [...state.payments].reverse().find((p) => p.memberId === me.id && sameTag(p.tag, tag))
    : undefined;

  const venmoUrl = `https://venmo.com/${state.org.venmoHandle}?txn=pay&amount=${price.toFixed(2)}&note=${encodeURIComponent(
    `${name} ${code}`
  )}`;

  const record = () => {
    if (!me) return;
    update((s) =>
      addPayment(
        s,
        {
          memberId: me.id,
          amount: price,
          tag,
          via: "venmo",
          at: new Date().toISOString(),
          ref: code,
          fromHandle: me.venmo || undefined,
        },
        uid()
      )
    );
    log(`${me.name} paid ${money(price)} for ${name}`);
    setStep("done");
  };

  return (
    <div className="flex min-h-dvh justify-center px-4 py-8 md:py-14">
      <div className="w-full max-w-[380px]">
        <div className="rounded-[3px] border border-rule bg-sheet">
          <div className="h-1.5 rounded-t-[3px] bg-brand" />
          <div className="p-6">
            <div className="flex items-center gap-3">
              <OrgMark name={state.org.name} logo={state.org.logo} size={36} />
              <div className="text-sm font-semibold leading-tight">{state.org.name}</div>
            </div>
            <div className="mt-6 border-t border-rule pt-4 text-sm text-muted">{name}</div>
            <div className="num text-[48px] font-medium leading-none tracking-[-0.03em]">{money(price)}</div>
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
                    </div>

                    {step === "start" && (
                      <a
                        href={venmoUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setStep("confirm")}
                        className="block rounded-[3px] bg-brand py-3 text-center text-sm font-medium text-on-brand hover:brightness-110"
                      >
                        Pay {money(price)} with Venmo
                      </a>
                    )}

                    {step === "confirm" && (
                      <div className="space-y-3 border-l-[3px] border-ink pl-3 text-sm">
                        <p>
                          Venmo opened with the amount and the note <code className="num text-xs">{code}</code> filled
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
                item: name,
                amount: payment.amount,
                payer: me.name,
                from: payment.fromHandle,
                no: payment.no,
                id: payment.id,
                at: payment.at,
                via: payment.via,
                to: state.org.venmoHandle,
                code: payment.ref,
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
