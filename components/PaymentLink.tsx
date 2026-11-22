"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { PaymentTag } from "@/lib/types";
import { tagName, tagPrice } from "@/lib/selectors";
import { money, shortDate, tagCode } from "@/lib/util";
import { Button } from "./ui";

// The shareable link officers drop into the group chat.
// For payment links, the first copy records when the link went out: statement rows paid before
// that can't have come through the link, so the matcher sends them to review.
export default function PaymentLink({ path, tag }: { path: string; tag?: PaymentTag }) {
  const { state, update } = useStore();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}${path}`;

  const markShared = () => {
    if (!tag) return;
    const at = new Date().toISOString();
    update((s) =>
      tag.kind === "dues"
        ? s.org.duesLinkSharedAt
          ? s
          : { ...s, org: { ...s.org, duesLinkSharedAt: at } }
        : {
            ...s,
            events: s.events.map((e) => (e.id === tag.eventId && !e.linkSharedAt ? { ...e, linkSharedAt: at } : e)),
          },
    );
  };

  const copy = async (text: string, done: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      markShared();
      done(true);
      setTimeout(() => done(false), 1500);
    } catch {}
  };

  const ev = tag?.kind === "event" ? state.events.find((e) => e.id === tag.eventId) : undefined;
  const message = tag
    ? `${tagName(state, tag)}${ev ? ` (${shortDate(ev.date)})` : ""} is ${money(tagPrice(state, tag))}. Pay here: ${url}\n` +
      `Keep the code ${tagCode(tag)} in the Venmo note so your payment is counted.`
    : "";

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="num min-w-0 flex-1 truncate rounded-[3px] border border-dashed border-rule-strong px-2.5 py-1.5 text-xs text-muted">
          {url}
        </code>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => copy(url, setCopied)}>
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Link
            href={path}
            target="_blank"
            className="inline-flex items-center px-2 py-1 text-[13px] font-medium text-brand-ink hover:underline"
          >
            Open ↗
          </Link>
        </div>
      </div>
      {tag && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button variant="secondary" size="sm" onClick={() => copy(message, setCopiedMsg)}>
            {copiedMsg ? "Copied" : "Copy group chat message"}
          </Button>
          <span className="text-xs text-muted">Tip: pin this and post it before you announce the event.</span>
        </div>
      )}
    </div>
  );
}
