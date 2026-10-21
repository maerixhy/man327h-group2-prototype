"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { collection, eventSpend } from "@/lib/selectors";
import { money, relDays, shortDate, uid } from "@/lib/util";
import { Button, Card, Empty, Field, Input, PageHeader } from "@/components/ui";

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
        action={
          <Button size="sm" variant={open ? "secondary" : "primary"} onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "New event"}
          </Button>
        }
      />

      {open && (
        <Card className="mb-8 grid gap-4 p-5 sm:grid-cols-2">
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
                className="num"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </Field>
            <Field label="Budget">
              <Input
                type="number"
                min={0}
                className="num"
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

      {events.length === 0 ? (
        <Empty>No events yet. Add one and it gets its own payment link and budget line.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-[10.5px] uppercase tracking-wider text-muted">
                <th className="py-2 font-medium">Event</th>
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 text-right font-medium">Price</th>
                <th className="py-2 text-right font-medium">Collected</th>
                <th className="py-2 text-right font-medium">Unpaid</th>
                <th className="py-2 text-right font-medium">Spent / budget</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const c = collection(state, { kind: "event", eventId: e.id });
                const sp = eventSpend(state, e.id);
                const past = new Date(e.date) < new Date();
                return (
                  <tr key={e.id} className={`border-b border-rule ${past ? "text-muted" : ""}`}>
                    <td className="py-3">
                      <Link href={`/events/${e.id}`} className="font-medium text-ink hover:underline">
                        {e.name}
                      </Link>
                      <div className="text-xs text-muted">{e.location}</div>
                    </td>
                    <td className="num py-3 text-[13px]">
                      {shortDate(e.date)}
                      <div className="font-sans text-xs text-faint">{relDays(e.date)}</div>
                    </td>
                    <td className="num py-3 text-right text-[13px]">{money(e.price)}</td>
                    <td className="num py-3 text-right text-[13px]">
                      {money(c.collected)}
                      <div className="text-[11px] text-faint">{Math.round(c.pct * 100)}%</div>
                    </td>
                    <td className="num py-3 text-right text-[13px]">{c.unpaid.length}</td>
                    <td className="num py-3 text-right text-[13px]">
                      <span className={sp.committed > e.budget ? "text-red-ink" : ""}>{money(sp.committed)}</span>
                      <span className="text-muted"> / {money(e.budget)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
