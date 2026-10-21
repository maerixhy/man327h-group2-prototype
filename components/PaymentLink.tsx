"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "./ui";

// The shareable link officers drop into the group chat.
export default function PaymentLink({ path }: { path: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}${path}`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="min-w-0 flex-1 truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
        {url}
      </code>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Link
          href={path}
          target="_blank"
          className="inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-soft"
        >
          Open as member ↗
        </Link>
      </div>
    </div>
  );
}
