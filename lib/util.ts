import type { MemberLabel, PaymentTag } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

export const addDays = (iso: string, d: number) => {
  const t = new Date(iso);
  t.setDate(t.getDate() + d);
  return t.toISOString();
};

export const shortDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

export const longDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

export const relDays = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  const d = Math.round(ms / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
};

export const time = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";

// "No. 0231", the way entries are numbered in an account book.
export const entryNo = (n: number) => `No. ${String(n).padStart(4, "0")}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const LABELS: Record<MemberLabel, { one: string; many: string; officer: string }> = {
  members: { one: "member", many: "members", officer: "officer" },
  families: { one: "family", many: "families", officer: "board member" },
  volunteers: { one: "volunteer", many: "volunteers", officer: "coordinator" },
  players: { one: "player", many: "players", officer: "team manager" },
};

export const label = (l: MemberLabel) => LABELS[l];

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// The short code that rides along in the payment note so every payment arrives already tagged.
export const tagCode = (tag: PaymentTag) =>
  tag.kind === "dues" ? "PT-DUES" : `PT-EV-${tag.eventId.toUpperCase().slice(0, 6)}`;

export const sameTag = (a: PaymentTag, b: PaymentTag) =>
  a.kind === b.kind && (a.kind === "dues" || (b.kind === "event" && a.eventId === b.eventId));

export function downloadFile(name: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Shrinks a photo before storing it, so receipts and logos fit in browser storage.
export function fileToDataUrl(file: File, max = 900, type = "image/jpeg"): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL(type, 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Readable text color on top of a brand color.
export function onColor(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#1c1917" : "#ffffff";
}
