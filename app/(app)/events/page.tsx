"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { collection, eventSpend } from "@/lib/selectors";
import { money, relDays, shortDate, uid } from "@/lib/util";
import { Button, Card, Field, Input, PageHeader, Progress } from "@/components/ui";

export default function Events() {
  const { state, update, log } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", location: "", price: 10, budget: 200, purpose: "" });

  const events = [...state.events].sort((a, b) => b.date.localeCompare(a.date));

  const create = () => {
    if (!form.name || !form.date) return;
    const id = uid().slice(0, 6);
    update((s) => ({
      ...s,
      events: [...s.events, { id, ...form, date: new Date(form.date + "T19:00").toISOString() }],
    }));
    log(`Created event ${form.name}`);
    setForm({ name: "", date: "", location: "", price: 10, budget: 200, purpose: "" });
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Events"
        sub="Each event gets its own payment link, so money arrives already tagged to it."
        action={<Button onClick={() => setOpen((v) => !v)}>{open ? "Cancel" : "New event"}</Button>}
      />

      {open && (
        <Card className="mb-6 grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Event name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price per person">
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </Field>
            <Field label="Budget">
              <Input
                type="number"
                min={0}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Purpose" hint="used in funding packets">
              <Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button onClick={create} disabled={!form.name || !form.date}>
              Create event and payment link
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {events.map((e) => {
          const c = collection(state, { kind: "event", eventId: e.id });
          const sp = eventSpend(state, e.id);
          const past = new Date(e.date) < new Date();
          return (
            <Link key={e.id} href={`/events/${e.id}`}>
              <Card className="h-full p-5 transition hover:border-brand-line">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-xl">{e.name}</div>
                    <div className="mt-0.5 text-xs text-stone-500">
                      {shortDate(e.date)} · {past ? "happened " : ""}
                      {relDays(e.date)} · {money(e.price)}/person
                    </div>
                  </div>
                  <div className="tabular text-right">
                    <div className="text-2xl font-semibold text-brand">{Math.round(c.pct * 100)}%</div>
                    <div className="text-xs text-stone-500">collected</div>
                  </div>
                </div>
                <Progress value={c.pct} className="mt-4" />
                <div className="tabular mt-3 flex justify-between text-xs text-stone-500">
                  <span>{c.unpaid.length} unpaid</span>
                  <span>
                    Spent {money(sp.committed)} / {money(e.budget)}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
