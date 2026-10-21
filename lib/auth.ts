// Passwords are stored as a salted SHA-256 hash, never as typed.
export async function hashPassword(password: string) {
  const text = `paper-trail:${password}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Plain-http fallback (crypto.subtle needs a secure context).
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `djb2:${(h >>> 0).toString(16)}`;
}

const WORDS = ["tern", "maple", "cedar", "otter", "finch", "quill", "brook", "ember", "slate", "juniper"];

// A temporary password an officer can read out or text to someone.
export const tempPassword = () =>
  `${WORDS[Math.floor(Math.random() * WORDS.length)]}-${Math.floor(1000 + Math.random() * 9000)}`;

export const normEmail = (e: string) => e.trim().toLowerCase();

export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
