"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import type { ReimbStatus } from "@/lib/types";
import { initials } from "@/lib/util";
import { useTheme, type Theme } from "@/lib/theme";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[3px] border border-rule bg-sheet ${className}`}>{children}</div>;
}

// Page title over a double rule, the way a ledger page is headed.
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-[3px] border-double border-ink pb-3">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ink pb-1.5">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink">{children}</h2>
      {aside && <div className="text-xs text-muted">{aside}</div>}
    </div>
  );
}

// Small label over a figure.
export function Caption({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-[11px] font-medium uppercase tracking-[0.1em] text-muted ${className}`}>{children}</div>;
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:brightness-110 border border-brand",
  secondary: "border border-rule-strong bg-sheet text-ink hover:border-ink",
  ghost: "border border-transparent text-muted hover:text-ink hover:bg-ink/5",
  danger: "border border-red-ink/50 bg-sheet text-red-ink hover:border-red-ink",
};

const sizes = { sm: "px-2.5 py-1 text-[13px]", md: "px-4 py-2 text-sm" };

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-[3px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" };

export function Button({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  return <button className={`${btnBase} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" }) {
  return <Link className={`${btnBase} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}

export function Progress({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-[5px] w-full bg-rule ${className}`}>
      <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

type Ink = "red" | "blue" | "pencil" | "ink";

const inks: Record<Ink, string> = {
  red: "text-red-ink",
  blue: "text-blue-ink",
  pencil: "text-pencil border-dashed",
  ink: "text-ink",
};

export function Stamp({
  children,
  ink = "red",
  large = false,
  tilt = -3,
  className = "",
}: {
  children: ReactNode;
  ink?: Ink;
  large?: boolean;
  tilt?: number;
  className?: string;
}) {
  return (
    <span
      className={`stamp ${large ? "stamp-lg" : ""} ${inks[ink]} ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {children}
    </span>
  );
}

const STATUS: Record<ReimbStatus, { label: string; ink: Ink }> = {
  submitted: { label: "Pending", ink: "pencil" },
  approved: { label: "Approved", ink: "blue" },
  paid: { label: "Paid", ink: "red" },
  rejected: { label: "Returned", ink: "ink" },
};

// The stamp carries the initials of whoever approved or paid it.
export function StatusStamp({ status, by }: { status: ReimbStatus; by?: string }) {
  const s = STATUS[status];
  return (
    <Stamp ink={s.ink} tilt={status === "paid" ? -4 : status === "approved" ? -2 : 0}>
      {s.label}
      {by && <span className="opacity-80">· {initials(by)}</span>}
    </Stamp>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      {hint && <span className="ml-1.5 text-xs text-muted">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "rounded-[3px] border border-rule-strong bg-sheet px-2.5 py-2 text-sm text-ink outline-none transition placeholder:text-faint focus:border-ink";

// Full width unless the caller sets its own width.
const fieldCls = (extra = "") => `${/(^|\s)(w-|max-w-)/.test(extra) ? "" : "w-full"} ${inputCls} ${extra}`;

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldCls(props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={fieldCls(props.className)} />;
}

export function Notice({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "red" | "brand" }) {
  const cls = { ink: "border-ink", red: "border-red-ink text-red-ink", brand: "border-brand text-ink" }[tone];
  return <div className={`border-l-[3px] bg-sheet px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="ruled border-y border-rule px-4 py-6 text-sm italic text-muted">{children}</div>;
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
  return logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={`${name} logo`}
      width={size}
      height={size}
      className="shrink-0 rounded-[3px] object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`num flex shrink-0 items-center justify-center rounded-[3px] font-semibold ${
        onBrand ? "bg-sheet text-brand-ink" : "bg-brand text-on-brand"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name) || "PT"}
    </div>
  );
}

export function Avatar({ name, src, size = 32 }: { name: string; src: string | null; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="num inline-flex shrink-0 items-center justify-center rounded-full border border-rule-strong bg-paper font-medium text-muted"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

const THEMES: { key: Theme; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "Auto" },
];

export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { theme, choose } = useTheme();
  return (
    <div className={`inline-flex rounded-[3px] border border-rule-strong p-0.5 ${className}`} role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t.key}
          type="button"
          role="radio"
          aria-checked={theme === t.key}
          onClick={() => choose(t.key)}
          className={`rounded-[2px] px-2 py-0.5 text-xs transition ${
            theme === t.key ? "bg-ink text-paper" : "text-muted hover:text-ink"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
