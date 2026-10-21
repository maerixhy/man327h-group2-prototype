"use client";

import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import CollectionPanel from "@/components/CollectionPanel";

export default function Dues() {
  const { state } = useStore();
  return (
    <>
      <PageHeader title={`${state.org.term} dues`} />
      <CollectionPanel tag={{ kind: "dues" }} path="/pay/dues" />
    </>
  );
}
