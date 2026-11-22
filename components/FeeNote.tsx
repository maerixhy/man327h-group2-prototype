import type { VenmoProfile } from "@/lib/types";
import { afterVenmoFee } from "@/lib/features";
import { money } from "@/lib/util";

const whole = (n: number) => (Number.isInteger(n) ? `$${n}` : money(n));

// Shown wherever an officer sets a price, so the fee isn't a surprise when the money lands.
export default function FeeNote({
  price,
  profile,
  unit = "payment",
}: {
  price: number;
  profile: VenmoProfile;
  unit?: string;
}) {
  if (profile !== "business" || price <= 0) return null;
  return (
    <p className="mt-1 text-xs text-muted">
      Venmo keeps 1.9% + $0.10. You&apos;ll receive <span className="num text-ink">{money(afterVenmoFee(price))}</span>{" "}
      of each {whole(price)} {unit}.
    </p>
  );
}
