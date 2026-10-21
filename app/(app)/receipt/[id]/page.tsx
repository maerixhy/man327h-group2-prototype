"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { isOfficer, memberName, tagName } from "@/lib/selectors";
import { Empty } from "@/components/ui";
import Receipt from "@/components/Receipt";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { state, me } = useStore();
  const p = state.payments.find((x) => x.id === id);

  // Members can only open their own receipts.
  if (!p || !me || (p.memberId !== me.id && !isOfficer(me))) return <Empty>We couldn&apos;t find that receipt.</Empty>;

  return (
    <>
      <Link href={isOfficer(me) && p.memberId !== me.id ? "/ledger" : "/me"} className="text-sm text-muted hover:text-ink">
        ← Back
      </Link>
      <div className="mt-8 flex justify-center">
        <Receipt
          className="border-x border-t border-rule"
          r={{
            org: state.org.name,
            item: tagName(state, p.tag),
            amount: p.amount,
            payer: memberName(state, p.memberId),
            no: p.no,
            id: p.id,
            at: p.at,
            via: p.via,
            to: state.org.venmoHandle,
            code: p.ref,
          }}
        />
      </div>
    </>
  );
}
