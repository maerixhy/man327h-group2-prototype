"use client";

import { useStore } from "@/lib/store";
import { money } from "@/lib/util";
import { PageHeader } from "@/components/ui";
import CollectionPanel from "@/components/CollectionPanel";

export default function Dues() {
  const { state } = useStore();
  return (
    <>
      <PageHeader
        title={`${state.org.term} dues`}
        sub={`${money(state.org.duesAmount)} per person. Change the amount in Settings.`}
      />
      <CollectionPanel tag={{ kind: "dues" }} path="/pay/dues" />
    </>
  );
}
