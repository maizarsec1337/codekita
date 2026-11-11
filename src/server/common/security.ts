import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function cookies(header?: string): Record<string, string> {
  const result: Record<string, string> = Object.create(null);
  for (const item of (header ?? "").split(";")) {
    const index = item.indexOf("=");
    if (index < 1) continue;
    const name = item.slice(0, index).trim();
    try { if (!(name in result)) result[name] = decodeURIComponent(item.slice(index + 1).trim()); } catch { /* Ignore malformed cookies. */ }
  }
  return result;
}
export function csrfToken(secret: string): string {
  const nonce = randomBytes(32).toString("hex");
  return `${nonce}.${createHmac("sha256", secret).update(nonce).digest("hex")}`;
}
export function validCsrf(cookie: string | undefined, header: unknown, secret: string): boolean {
  if (!cookie || typeof header !== "string" || cookie.length !== 129 || cookie !== header) return false;
  const [nonce, signature] = cookie.split(".");
  if (!/^[a-f0-9]{64}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(nonce).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}