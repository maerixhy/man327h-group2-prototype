import { entryNo, longDate, money, time } from "@/lib/util";
import { Stamp } from "./ui";

export type ReceiptData = {
  org: string;
  item: string;
  amount: number;
  payer: string;
  no: number;
  id: string;
  at: string;
  via: string;
  code: string;
  to?: string;
};

// Transaction number: entry number plus a short check code, so two receipts never look alike.
export const txnNo = (no: number, id: string) =>
  `${String(no).padStart(4, "0")}-${id.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase().padStart(4, "0")}`;

// The narrow slip people screenshot and send to the group chat.
export default function Receipt({ r, className = "" }: { r: ReceiptData; className?: string }) {
  const rows: [string, string][] = [
    ["Paid by", r.payer],
    ["Method", r.via === "cash" ? "Cash" : r.via === "zelle" ? "Zelle" : "Venmo"],
    ...(r.to && r.via === "venmo" ? ([["To", `@${r.to}`]] as [string, string][]) : []),
    ["Tag", r.code],
    ["Date", longDate(r.at)],
    ["Time", time(r.at)],
  ];
  return (
    <div className={`torn w-full max-w-[300px] bg-sheet px-6 pt-6 pb-9 text-ink ${className}`}>
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">{r.org}</div>
        <div className="num mt-0.5 text-[11px] text-muted">{entryNo(r.no)}</div>
      </div>
      <div className="mt-4 border-t border-dashed border-rule-strong pt-4">
        <div className="text-sm">{r.item}</div>
        <div className="num mt-1 text-[34px] font-medium leading-none tracking-tight">{money(r.amount)}</div>
      </div>
      <dl className="num mt-4 space-y-1 border-t border-dashed border-rule-strong pt-3 text-[12px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted">{k}</dt>
            <dd className="truncate text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="relative mt-4 border-t border-dashed border-rule-strong pt-3">
        <div className="num flex justify-between text-[12px]">
          <span className="text-muted">Txn</span>
          <span>{txnNo(r.no, r.id)}</span>
        </div>
        <div className="mt-5 flex justify-center">
          <Stamp large tilt={-7}>
            Paid
          </Stamp>
        </div>
        <p className="mt-5 text-center text-[11px] leading-snug text-muted">
          Recorded on the group ledger. Keep this for your records.
        </p>
      </div>
    </div>
  );
}
