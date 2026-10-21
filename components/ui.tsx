"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import type { ReimbStatus } from "@/lib/types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-stone-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl tracking-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 text-sm text-stone-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  const v = {
    primary: "bg-brand text-on-brand hover:brightness-110",
    secondary: "border border-stone-300 bg-white text-ink hover:bg-stone-50",
    ghost: "text-stone-600 hover:bg-stone-100",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  }[variant];
  const s = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm";
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${v} ${s} ${className}`}
      {...rest}
    />
  );
}

export function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-stone-100 ${className}`}>
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</div>
      <div className="tabular mt-1 text-2xl font-semibold text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-stone-500">{sub}</div>}
    </Card>
  );
}

const STATUS: Record<ReimbStatus, { label: string; cls: string }> = {
  submitted: { label: "Waiting for approval", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  approved: { label: "Approved, payout scheduled", cls: "bg-sky-50 text-sky-800 ring-sky-200" },
  paid: { label: "Paid back", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  rejected: { label: "Sent back", cls: "bg-red-50 text-red-800 ring-red-200" },
};

export function StatusBadge({ status }: { status: ReimbStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function Pill({ children, tone = "stone" }: { children: ReactNode; tone?: "stone" | "brand" | "amber" }) {
  const cls = {
    stone: "bg-stone-100 text-stone-700",
    brand: "bg-brand-soft text-brand",
    amber: "bg-amber-50 text-amber-800",
  }[tone];
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="ml-1 text-xs text-stone-500">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-line";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
      {children}
    </div>
  );
}

export function OrgMark({
  name,
  logo,
  size = 36,
  onBrand = false,
}: {
  name: string;
  logo: string | null;
  size?: number;
  onBrand?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={`${name} logo`}
      width={size}
      height={size}
      className="shrink-0 rounded-xl object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-semibold ${
        onBrand ? "bg-white text-brand" : "bg-brand text-on-brand"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || "PT"}
    </div>
  );
}
