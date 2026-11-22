"use client";

import { Fragment, useState } from "react";
import { useStore } from "@/lib/store";
import { collection, roleLabel } from "@/lib/selectors";
import type { Member } from "@/lib/types";
import { hashPassword, normEmail, tempPassword, validEmail } from "@/lib/auth";
import { cap, label, normHandle, shortDate, uid } from "@/lib/util";
import { Avatar, Button, Card, Empty, Field, Input, Notice, PageHeader, SectionTitle, Select } from "@/components/ui";
import PaymentLink from "@/components/PaymentLink";

export default function Members() {
  const { state, me, update, log } = useStore();
  const L = label(state.org.memberLabel);
  // Only the treasurer (the workspace owner) changes roles or logins. Other officers can see the list.
  const owner = me?.role === "treasurer";
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", venmo: "", role: "member" as "member" | "officer" });
  const [error, setError] = useState<string | null>(null);
  const [temp, setTemp] = useState<{ id: string; pw: string } | null>(null);

  const dues = state.org.modules.dues && state.org.duesAmount > 0;
  const paidDues = new Set(collection(state, { kind: "dues" }).payments.map((p) => p.memberId));
  const order = { treasurer: 0, officer: 1, member: 2 };
  const people = [...state.members]
    .sort((a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name))
    .filter((m) => !q || `${m.name} ${m.email} ${m.venmo}`.toLowerCase().includes(q.toLowerCase()));
  const officers = state.members.filter((m) => m.role !== "member").length;

  const patch = (id: string, p: Partial<Member>) =>
    update((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...p } : m)) }));

  const issueTemp = async (m: Member) => {
    const pw = tempPassword();
    patch(m.id, { passwordHash: await hashPassword(pw) });
    log(`Reset the password for ${m.name}`);
    setTemp({ id: m.id, pw });
  };

  const add = async () => {
    const email = normEmail(form.email);
    if (!form.name.trim()) return setError("Add a name.");
    if (!validEmail(email)) return setError("That email doesn't look right.");
    if (state.members.some((m) => normEmail(m.email) === email)) return setError("Someone already uses that email.");
    const pw = tempPassword();
    const m: Member = {
      id: uid(),
      name: form.name.trim(),
      email,
      venmo: form.venmo,
      role: form.role,
      avatar: null,
      passwordHash: await hashPassword(pw),
      joinedAt: new Date().toISOString(),
      source: "added",
    };
    update((s) => ({ ...s, members: [...s.members, m] }));
    log(`Added ${m.name} as ${m.role === "officer" ? `an ${L.officer}` : `a ${L.one}`}`);
    setTemp({ id: m.id, pw });
    setForm({ name: "", email: "", venmo: "", role: "member" });
    setError(null);
    setAdding(false);
  };

  const cols = 5 + (dues ? 1 : 0) + (owner ? 1 : 0);

  return (
    <>
      <PageHeader
        title={cap(L.many)}
        action={
          owner && (
            <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)}>
              {adding ? "Cancel" : "Add someone yourself"}
            </Button>
          )
        }
      />

      <section className="mb-8">
        <SectionTitle>Sign-up link</SectionTitle>
        <div className="mt-3">
          <PaymentLink path="/join" />
        </div>
        <p className="mt-2 text-xs text-muted">
          Share this in the group chat. Everyone joins as a {L.one}
          {owner ? `; you can make someone an ${L.officer} below.` : "."}
        </p>
      </section>

      {adding && (
        <Card className="mb-8 p-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Login email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Venmo" hint="optional">
              <Input
                placeholder="@handle"
                value={form.venmo}
                onChange={(e) => setForm({ ...form, venmo: normHandle(e.target.value) })}
              />
            </Field>
            <Field label="Role">
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as "member" | "officer" })}
              >
                <option value="member">{cap(L.one)}</option>
                <option value="officer">{cap(L.officer)}</option>
              </Select>
            </Field>
          </div>
          {error && (
            <div className="mt-4">
              <Notice tone="red">{error}</Notice>
            </div>
          )}
          <Button className="mt-4" onClick={add}>
            Add and create login
          </Button>
        </Card>
      )}

      {state.members.length <= 1 ? (
        <Empty>Nobody else has joined yet. Send the sign-up link above and people will show up here.</Empty>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Input
              type="search"
              placeholder="Filter"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs py-1.5"
            />
            <div className="num text-[13px] text-muted">
              {state.members.length} people · {officers} {officers === 1 ? L.officer : `${L.officer}s`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-ink text-left text-[10.5px] uppercase tracking-wider text-muted">
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium">Login email</th>
                  <th className="py-2 font-medium">Venmo</th>
                  <th className="py-2 font-medium">Joined</th>
                  {dues && <th className="py-2 font-medium">Dues</th>}
                  {owner && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {people.map((m) => {
                  const locked = !owner || m.role === "treasurer" || m.id === me?.id;
                  return (
                    <Fragment key={m.id}>
                      <tr className={`align-middle ${temp?.id === m.id ? "" : "border-b border-rule"}`}>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={m.name} src={m.avatar} size={28} />
                            <span className="truncate font-medium">
                              {m.name}
                              {m.id === me?.id && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          {locked ? (
                            <span>{roleLabel(state, m)}</span>
                          ) : (
                            <Select
                              aria-label={`Role for ${m.name}`}
                              value={m.role}
                              onChange={(e) => {
                                const role = e.target.value as "member" | "officer";
                                patch(m.id, { role, title: role === "member" ? undefined : m.title });
                                log(`Made ${m.name} ${role === "officer" ? `an ${L.officer}` : `a ${L.one}`}`);
                              }}
                              className="w-auto border-transparent bg-transparent px-1 py-1 hover:border-rule-strong"
                            >
                              <option value="member">{cap(L.one)}</option>
                              <option value="officer">{m.title ?? cap(L.officer)}</option>
                            </Select>
                          )}
                        </td>
                        <td className="num py-2.5 pr-3 text-[12.5px] text-muted">{m.email}</td>
                        <td className="num py-2.5 pr-3 text-[12.5px]">
                          {m.venmo ? `@${m.venmo}` : <span className="text-faint">—</span>}
                        </td>
                        <td className="num py-2.5 pr-3 text-[12.5px] whitespace-nowrap text-muted">
                          {shortDate(m.joinedAt)}
                        </td>
                        {dues && (
                          <td className="py-2.5 pr-3 text-[13px]">
                            {paidDues.has(m.id) ? <span>Paid</span> : <span className="text-red-ink">Unpaid</span>}
                          </td>
                        )}
                        {owner && (
                          <td className="py-2.5 text-right whitespace-nowrap">
                            {m.id !== me?.id && (
                              <Button size="sm" variant="ghost" onClick={() => issueTemp(m)}>
                                Reset password
                              </Button>
                            )}
                            {!locked && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (!window.confirm(`Remove ${m.name}? Their payments stay on the ledger.`)) return;
                                  update((s) => ({ ...s, members: s.members.filter((x) => x.id !== m.id) }));
                                  log(`Removed ${m.name}`);
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                      {temp?.id === m.id && (
                        <tr className="border-b border-rule">
                          <td colSpan={cols} className="pb-3">
                            <Notice tone="brand">
                              Temporary password for {m.name.split(" ")[0]}:{" "}
                              <code className="num font-semibold">{temp.pw}</code>. Send it to them privately. They
                              can change it in Profile after signing in.
                            </Notice>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
