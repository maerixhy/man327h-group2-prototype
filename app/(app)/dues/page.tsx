"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Empty, PageHeader } from "@/components/ui";
import CollectionPanel from "@/components/CollectionPanel";

export default function Dues() {
  const { state } = useStore();
  return (
    <>
      <PageHeader title={`${state.org.term} dues`} />
      {state.org.duesAmount > 0 ? (
        <CollectionPanel tag={{ kind: "dues" }} path="/pay/dues" />
      ) : (
        <Empty>
          No dues amount set yet.{" "}
          <Link href="/settings" className="not-italic text-ink underline-offset-2 hover:underline">
            Set one in Settings
          </Link>{" "}
          and the payment link is ready to share.
        </Empty>
      )}
    </>
  );
}
