import type { StatementRow } from "./types";

// Minimal CSV reader: handles quoted cells, escaped quotes, and newlines inside quotes.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const COLUMNS = ["ID", "Datetime", "Type", "Status", "Note", "From", "To", "Amount (total)"] as const;

// "+ $15.00" → 15, "- $86.42" → -86.42, "$1,250.00" → 1250
export function parseAmount(raw: string) {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return NaN;
  return /-/.test(raw) ? -n : n;
}

// Reads a Venmo statement export. Venmo puts a title and balance rows above the header and a
// disclaimer below the data, so the header is found by name and rows without a transaction ID are dropped.
export function parseVenmoStatement(text: string): { rows: StatementRow[]; error?: string } {
  const table = parseCsv(text.replace(/^﻿/, ""));
  const headerAt = table.findIndex((r) => {
    const cells = r.map((c) => c.trim());
    return cells.includes("ID") && cells.includes("Datetime") && cells.includes("Amount (total)");
  });
  if (headerAt < 0)
    return { rows: [], error: "That file doesn't look like a Venmo statement. Download it from Venmo → Statements → CSV." };

  const header = table[headerAt].map((c) => c.trim());
  const col = Object.fromEntries(COLUMNS.map((name) => [name, header.indexOf(name)])) as Record<
    (typeof COLUMNS)[number],
    number
  >;
  const get = (r: string[], name: (typeof COLUMNS)[number]) => (col[name] >= 0 ? (r[col[name]] ?? "").trim() : "");

  const rows: StatementRow[] = [];
  for (const r of table.slice(headerAt + 1)) {
    const id = get(r, "ID");
    const at = new Date(get(r, "Datetime"));
    const amount = parseAmount(get(r, "Amount (total)"));
    if (!id || Number.isNaN(at.getTime()) || Number.isNaN(amount)) continue;
    rows.push({
      id,
      at: at.toISOString(),
      type: get(r, "Type"),
      status: get(r, "Status"),
      note: get(r, "Note"),
      from: get(r, "From"),
      to: get(r, "To"),
      amount,
    });
  }
  return { rows };
}
