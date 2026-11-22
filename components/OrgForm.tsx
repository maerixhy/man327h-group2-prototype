"use client";

import { useState, type CSSProperties } from "react";
import type { MemberLabel, ModuleKey, Org, PacketTemplate } from "@/lib/types";
import { fileToDataUrl, money, normHandle, onColor } from "@/lib/util";
import { Button, Card, Field, Input, Notice, OrgMark, Select } from "./ui";
import { isV1Module } from "@/lib/features";
import FeeNote from "./FeeNote";

const SWATCHES = ["#1f6f5c", "#bf5700", "#6d3fc0", "#1d4ed8", "#a3123a", "#1b1a17", "#8a5a00", "#0e7490"];

const MODULES: { key: ModuleKey; name: string; desc: string }[] = [
  { key: "dues", name: "Dues", desc: "Collect term dues with a tagged payment link." },
  { key: "events", name: "Event payments", desc: "A payment link per event, with a code in every Venmo note." },
  { key: "reimbursements", name: "Reimbursements", desc: "Officers submit receipts and see when they're paid back." },
  { key: "packets", name: "Funding packets", desc: "Build funding requests from your receipts. Pro plan." },
  { key: "handoff", name: "Handoff", desc: "Pass the full record to the next treasurer in one click." },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 md:p-6">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  );
}

export default function OrgForm({
  initial,
  submitLabel,
  onSubmit,
  error,
}: {
  initial: Org;
  submitLabel: string;
  onSubmit: (org: Org) => void;
  error?: string | null;
}) {
  const [org, setOrg] = useState<Org>(initial);
  const set = <K extends keyof Org>(k: K, v: Org[K]) => setOrg((o) => ({ ...o, [k]: v }));
  const preview = { "--brand": org.color, "--on-brand": onColor(org.color) } as CSSProperties;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Section title="Your group">
          <Field label="Group name">
            <Input
              value={org.name}
              placeholder="Sunrise Cultural Association"
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Term">
              <Input value={org.term} placeholder="Fall 2026" onChange={(e) => set("term", e.target.value)} />
            </Field>
            <Field label="What do you call your people?">
              <Select value={org.memberLabel} onChange={(e) => set("memberLabel", e.target.value as MemberLabel)}>
                <option value="members">Members and officers (student orgs)</option>
                <option value="players">Players and team managers (youth sports)</option>
                <option value="families">Families and board</option>
                <option value="volunteers">Volunteers and coordinators</option>
              </Select>
            </Field>
          </div>
          <Field label="Logo" hint="optional">
            <div className="flex items-center gap-3">
              <OrgMark name={org.name} logo={org.logo} size={44} />
              <input
                type="file"
                accept="image/*"
                className="min-w-0 text-sm text-muted file:mr-3 file:rounded-[3px] file:border file:border-rule-strong file:bg-sheet file:px-3 file:py-1.5 file:text-sm file:text-ink"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) set("logo", await fileToDataUrl(f, 256, "image/png"));
                }}
              />
              {org.logo && (
                <Button variant="ghost" size="sm" onClick={() => set("logo", null)}>
                  Remove
                </Button>
              )}
            </div>
          </Field>
          <Field label="Brand color">
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Use ${c}`}
                  onClick={() => set("color", c)}
                  className={`h-8 w-8 rounded-[3px] ring-offset-2 ring-offset-sheet transition ${
                    org.color === c ? "ring-2 ring-ink" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={org.color}
                onChange={(e) => set("color", e.target.value)}
                className="h-8 w-11 cursor-pointer rounded-[3px] border border-rule-strong bg-sheet"
                aria-label="Custom color"
              />
            </div>
          </Field>
        </Section>

        <Section title="Money basics">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Group Venmo" hint="where payments go">
              <Input
                value={org.venmoHandle}
                placeholder="@your-group"
                onChange={(e) => set("venmoHandle", normHandle(e.target.value))}
              />
            </Field>
            <Field label="Dues per term">
              <Input
                type="number"
                min={0}
                className="num"
                placeholder="0.00"
                value={org.duesAmount || ""}
                onChange={(e) => set("duesAmount", Number(e.target.value) || 0)}
              />
              <FeeNote price={org.duesAmount} profile={org.venmoProfile} />
            </Field>
            <Field label="Starting balance">
              <Input
                type="number"
                className="num"
                placeholder="0.00"
                value={org.openingBalance || ""}
                onChange={(e) => set("openingBalance", Number(e.target.value) || 0)}
              />
            </Field>
          </div>
          <fieldset>
            <legend className="text-[13px] font-medium">
              Is {org.venmoHandle ? <span className="num">@{org.venmoHandle}</span> : "the group Venmo"} a business or
              personal profile?
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(
                [
                  [
                    "business",
                    "Business profile (recommended)",
                    "Keeps the group within Venmo's terms. Venmo keeps 1.9% + $0.10 per payment received.",
                  ],
                  [
                    "personal",
                    "Personal profile",
                    "No fees, but Venmo's terms don't allow collecting money for a group on a personal account.",
                  ],
                ] as const
              ).map(([value, title, desc]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer gap-2.5 rounded-[3px] border p-3 ${
                    org.venmoProfile === value ? "border-ink" : "border-rule"
                  }`}
                >
                  <input
                    type="radio"
                    name="venmoProfile"
                    checked={org.venmoProfile === value}
                    onChange={() => set("venmoProfile", value)}
                    className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
                    style={preview}
                  />
                  <span>
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="block text-xs text-muted">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Funding report format">
            <Select
              value={org.packetTemplate}
              onChange={(e) => set("packetTemplate", e.target.value as PacketTemplate)}
            >
              <option value="university">University student org funding request</option>
              <option value="grant">Grant or sponsor expense report</option>
            </Select>
          </Field>
        </Section>

        <Section title="Tabs to show">
          <div className="-my-2 divide-y divide-rule">
            {MODULES.filter((m) => isV1Module(m.key)).map((m) => (
              <label key={m.key} className="flex cursor-pointer items-start gap-3 py-2.5">
                <input
                  type="checkbox"
                  checked={org.modules[m.key]}
                  onChange={(e) => set("modules", { ...org.modules, [m.key]: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
                  style={preview}
                />
                <span>
                  <span className="block text-sm font-medium">{m.name}</span>
                  <span className="block text-[13px] text-muted">{m.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>

        {error && <Notice tone="red">{error}</Notice>}
        <Button onClick={() => onSubmit(org)} className="w-full sm:w-auto" style={preview}>
          {submitLabel}
        </Button>
      </div>

      {/* Live preview of the payment link people open from the group chat */}
      <div className="lg:sticky lg:top-8 lg:self-start" style={preview}>
        <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">Payment link preview</div>
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-brand" />
          <div className="p-5">
            <div className="flex items-center gap-3">
              <OrgMark name={org.name} logo={org.logo} size={36} />
              <div className="text-sm font-semibold">{org.name || "Your group"}</div>
            </div>
            <div className="mt-5 border-t border-rule pt-3 text-sm text-muted">{org.term || "Term"} dues</div>
            <div className="num text-4xl font-medium tracking-tight">{money(org.duesAmount)}</div>
            <div className="mt-5 rounded-[3px] bg-brand py-2.5 text-center text-sm font-medium text-on-brand">
              Pay with Venmo
            </div>
            <div className="num mt-2 text-center text-xs text-muted">to @{org.venmoHandle || "your-handle"}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
