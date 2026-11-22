import type { Member, ModuleKey, State } from "./types";
import { seedState } from "./seed";
import { isV1Module } from "./features";

export const VERSION = 4;

// Brings any saved state up to the current shape, so browsers with older data keep working.
// Every field gets a default, which also covers data from before versions were tracked.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrate(raw: any): State {
  const base = seedState();
  if (!raw || typeof raw !== "object") return base;
  const org = { ...base.org, ...(raw.org ?? {}) };
  const modules = { ...base.org.modules, ...(org.modules ?? {}) } as Record<ModuleKey, boolean>;
  // Cut features stay off until v2.
  for (const k of Object.keys(modules) as ModuleKey[]) if (!isV1Module(k)) modules[k] = false;

  return {
    ...base,
    ...raw,
    version: VERSION,
    org: {
      ...org,
      modules,
      // Groups saved before the question existed never said they had a business profile.
      venmoProfile: raw.org?.venmoProfile === "business" ? "business" : "personal",
      plan: org.plan === "pro" ? "pro" : "free",
      aliases: Array.isArray(org.aliases) ? org.aliases : [],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: (raw.members ?? []).map((m: any): Member => ({
      ...m,
      email: m.email ?? "",
      venmo: m.venmo ?? "",
      avatar: m.avatar ?? null,
      passwordHash: m.passwordHash ?? null,
      joinedAt: m.joinedAt ?? new Date().toISOString(),
      source: m.source === "owner" || m.source === "signup" ? m.source : "added",
    })),
    events: raw.events ?? [],
    payments: raw.payments ?? [],
    reimbursements: raw.reimbursements ?? [],
    reminders: raw.reminders ?? [],
    log: raw.log ?? [],
    review: raw.review ?? [],
    seq: typeof raw.seq === "number" ? raw.seq : (raw.payments?.length ?? 0) + (raw.reimbursements?.length ?? 0) + 1,
  };
}
