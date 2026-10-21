// Generates a simple receipt image for the starter data.
export function fakeReceipt(vendor: string, lines: [string, number][]) {
  const total = lines.reduce((a, [, n]) => a + n, 0);
  const rows = lines
    .map(
      ([name, n], i) =>
        `<text x="20" y="${110 + i * 22}" font-size="13">${name}</text><text x="220" y="${
          110 + i * 22
        }" font-size="13" text-anchor="end">${n.toFixed(2)}</text>`
    )
    .join("");
  const h = 170 + lines.length * 22;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="${h}" viewBox="0 0 240 ${h}" font-family="monospace" fill="#222"><rect width="240" height="${h}" fill="#fdfcf7"/><text x="120" y="40" font-size="16" text-anchor="middle" font-weight="bold">${vendor.toUpperCase()}</text><text x="120" y="60" font-size="11" text-anchor="middle">AUSTIN, TX</text><line x1="20" y1="80" x2="220" y2="80" stroke="#999" stroke-dasharray="4 3"/>${rows}<line x1="20" y1="${
    120 + lines.length * 22
  }" x2="220" y2="${120 + lines.length * 22}" stroke="#999" stroke-dasharray="4 3"/><text x="20" y="${
    145 + lines.length * 22
  }" font-size="14" font-weight="bold">TOTAL</text><text x="220" y="${
    145 + lines.length * 22
  }" font-size="14" font-weight="bold" text-anchor="end">${total.toFixed(2)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
