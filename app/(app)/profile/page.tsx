"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { roleLabel } from "@/lib/selectors";
import { hashPassword, normEmail, validEmail } from "@/lib/auth";
import { fileToDataUrl, longDate } from "@/lib/util";
import { Avatar, Button, Card, Field, Input, Notice, PageHeader, ThemeSwitch } from "@/components/ui";

export default function Profile() {
  const { state, me, update } = useStore();
  const [form, setForm] = useState({ name: me?.name ?? "", email: me?.email ?? "", avatar: me?.avatar ?? null });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState<{ tone: "brand" | "red"; text: string; where: "profile" | "password" } | null>(null);

  if (!me) return null;

  const saveProfile = () => {
    const email = normEmail(form.email);
    if (!form.name.trim()) return setMsg({ tone: "red", text: "Your name can't be blank.", where: "profile" });
    if (!validEmail(email)) return setMsg({ tone: "red", text: "That email doesn't look right.", where: "profile" });
    if (state.members.some((m) => m.id !== me.id && normEmail(m.email) === email))
      return setMsg({ tone: "red", text: "Someone else already uses that email.", where: "profile" });
    update((s) => ({
      ...s,
      members: s.members.map((m) => (m.id === me.id ? { ...m, name: form.name.trim(), email, avatar: form.avatar } : m)),
    }));
    setMsg({ tone: "brand", text: "Profile saved.", where: "profile" });
  };

  const savePassword = async () => {
    if (me.passwordHash && (await hashPassword(pw.current)) !== me.passwordHash)
      return setMsg({ tone: "red", text: "Your current password isn't right.", where: "password" });
    if (pw.next.length < 8) return setMsg({ tone: "red", text: "Use at least 8 characters.", where: "password" });
    if (pw.next !== pw.confirm) return setMsg({ tone: "red", text: "The new passwords don't match.", where: "password" });
    const passwordHash = await hashPassword(pw.next);
    update((s) => ({ ...s, members: s.members.map((m) => (m.id === me.id ? { ...m, passwordHash } : m)) }));
    setPw({ current: "", next: "", confirm: "" });
    setMsg({ tone: "brand", text: "Password updated.", where: "password" });
  };

  return (
    <>
      <PageHeader title="Profile" />

      <div className="grid max-w-3xl gap-6">
        <Card className="p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={form.name || me.name} src={form.avatar} size={72} />
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">{roleLabel(state, me)}</span>
                <span className="text-muted"> · {state.org.name}</span>
              </div>
              <div className="num text-xs text-muted">Joined {longDate(me.joinedAt)}</div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-[3px] border border-rule-strong px-2.5 py-1 text-[13px] hover:border-ink">
                  Upload photo
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setForm({ ...form, avatar: await fileToDataUrl(f, 256) });
                    }}
                  />
                </label>
                {form.avatar && (
                  <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, avatar: null })}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} autoComplete="name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email" hint="you sign in with this">
              <Input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          {msg?.where === "profile" && (
            <div className="mt-4">
              <Notice tone={msg.tone}>{msg.text}</Notice>
            </div>
          )}
          <Button className="mt-5" onClick={saveProfile}>
            Save profile
          </Button>
        </Card>

        <Card className="p-5 md:p-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Password</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {me.passwordHash && (
              <Field label="Current">
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                />
              </Field>
            )}
            <Field label="New">
              <Input
                type="password"
                autoComplete="new-password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
              />
            </Field>
            <Field label="Confirm new">
              <Input
                type="password"
                autoComplete="new-password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
            </Field>
          </div>
          {msg?.where === "password" && (
            <div className="mt-4">
              <Notice tone={msg.tone}>{msg.text}</Notice>
            </div>
          )}
          <Button className="mt-5" variant="secondary" onClick={savePassword} disabled={!pw.next}>
            Update password
          </Button>
        </Card>

        <Card className="flex flex-wrap items-center justify-between gap-3 p-5 md:p-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Appearance</h2>
          <ThemeSwitch />
        </Card>
      </div>
    </>
  );
}
