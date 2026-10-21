"use client";

import { useState, type CSSProperties } from "react";
import type { MemberLabel, ModuleKey, Org, PacketTemplate } from "@/lib/types";
import { cap, fileToDataUrl, label, money, onColor } from "@/lib/util";
import { Button, Card, Field, Input, OrgMark, Progress, Select } from "./ui";

const SWATCHES = ["#1f6f5c", "#bf5700", "#7c3aed", "#1d4ed8", "#be123c", "#0f172a", "#a16207", "#0e7490"];

const MODULES: { key: ModuleKey; name: string; desc: string }[] = [
  { key: "dues", name: "Dues", desc: "Collect term dues with a tagged payment link." },
  { key: "events", name: "Event payments", desc: "Per-event links, budgets, and one-tap reminders." },
  { key: "reimbursements", name: "Reimbursements", desc: "Receipt photo in, one queue, predictable payback dates." },
  { key: "packets", name: "Funding packets", desc: "Build funding requests or grant reports from your receipts." },
  { key: "handoff", name: "Handoff", desc: "Pass the full record to the next treasurer in one click." },
];

export default function OrgForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: Org;
  submitLabel: string;
  onSubmit: (org: Org) => void;
}) {
  const [org, setOrg] = useState<Org>(initial);
  const set = <K extends keyof Org>(k: K, v: Org[K]) => setOrg((o) => ({ ...o, [k]: v }));
  const preview = { "--brand": org.color, "--on-brand": onColor(org.color) } as CSSProperties;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card className="space-y-5 p-5 md:p-6">
          <h2 className="font-display text-xl">Your group</h2>
          <Field label="Group name">
            <Input value={org.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Term">
              <Input value={org.term} onChange={(e) => set("term", e.target.value)} />
            </Field>
            <Field label="What do you call your people?">
              <Select
                value={org.memberLabel}
                onChange={(e) => set("memberLabel", e.target.value as MemberLabel)}
              >
                <option value="members">Members (student orgs, clubs)</option>
                <option value="families">Families (PTAs, schools)</option>
                <option value="players">Players (teams, leagues)</option>
                <option value="volunteers">Volunteers (nonprofits)</option>
              </Select>
            </Field>
          </div>
          <Field label="Logo" hint="optional">
            <div className="flex items-center gap-3">
              <OrgMark name={org.name} logo={org.logo} size={44} />
              <input
                type="file"
                accept="image/*"
                className="text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm"
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
                  className={`h-9 w-9 rounded-full ring-offset-2 transition ${
                    org.color === c ? "ring-2 ring-stone-800" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={org.color}
                onChange={(e) => set("color", e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-lg border border-stone-300 bg-white"
                aria-label="Custom color"
              />
            </div>
          </Field>
        </Card>

        <Card className="space-y-5 p-5 md:p-6">
          <h2 className="font-display text-xl">Money basics</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Venmo handle" hint="where payments go">
              <Input
                value={org.venmoHandle}
                onChange={(e) => set("venmoHandle", e.target.value.replace(/^@/, ""))}
              />
            </Field>
            <Field label="Dues per term">
              <Input
                type="number"
                min={0}
                value={org.duesAmount}
                onChange={(e) => set("duesAmount", Number(e.target.value))}
              />
            </Field>
            <Field label="Starting balance">
              <Input
                type="number"
                value={org.openingBalance}
                onChange={(e) => set("openingBalance", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Funding report format">
            <Select
              value={org.packetTemplate}
              onChange={(e) => set("packetTemplate", e.target.value as PacketTemplate)}
            >
              <option value="university">University student org funding request</option>
              <option value="grant">Funder or grant expense report (nonprofits)</option>
            </Select>
          </Field>
        </Card>

        <Card className="p-5 md:p-6">
          <h2 className="font-display text-xl">Tabs to show</h2>
          <p className="mt-1 text-sm text-stone-500">Turn off anything your group doesn&apos;t need.</p>
          <div className="mt-4 divide-y divide-stone-100">
            {MODULES.map((m) => (
              <label key={m.key} className="flex cursor-pointer items-start gap-3 py-3">
                <input
                  type="checkbox"
                  checked={org.modules[m.key]}
                  onChange={(e) => set("modules", { ...org.modules, [m.key]: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-[var(--brand)]"
                  style={preview}
                />
                <span>
                  <span className="block text-sm font-medium">{m.name}</span>
                  <span className="block text-sm text-stone-500">{m.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Button onClick={() => onSubmit(org)} className="w-full sm:w-auto" style={preview}>
          {submitLabel}
        </Button>
      </div>

      {/* Live preview of what members see when they open a payment link */}
      <div className="lg:sticky lg:top-8 lg:self-start" style={preview}>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          What your {label(org.memberLabel).many} see
        </div>
        <Card className="overflow-hidden">
          <div className="bg-brand px-5 py-5 text-on-brand">
            <div className="flex items-center gap-3">
              <OrgMark name={org.name} logo={org.logo} size={40} onBrand />
              <div className="text-sm font-semibold">{org.name || "Your group"}</div>
            </div>
            <div className="mt-5 text-xs opacity-80">{org.term} dues</div>
            <div className="tabular font-display text-4xl">{money(org.duesAmount)}</div>
          </div>
          <div className="space-y-3 p-5">
            <div className="text-sm text-stone-600">
              {cap(label(org.memberLabel).many)} paid so far
            </div>
            <Progress value={0.72} />
            <div className="rounded-xl bg-brand py-2.5 text-center text-sm font-medium text-on-brand">
              Pay with Venmo
            </div>
            <div className="text-center text-xs text-stone-400">to @{org.venmoHandle || "your-handle"}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
