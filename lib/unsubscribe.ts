// Signed one-click unsubscribe links for marketing emails (no account or login needed).
import { createHmac, timingSafeEqual } from "node:crypto";
import { site } from "@/site.config";

const sign = (email: string) =>
  createHmac("sha256", process.env.SESSION_SECRET ?? "")
    .update(`unsubscribe:${email.trim().toLowerCase()}`)
    .digest("base64url")
    .slice(0, 32);

export const unsubscribeUrl = (email: string) =>
  `${site.url}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${sign(email)}`;

export function verifyUnsubscribe(email: string, token: string) {
  const expected = Buffer.from(sign(email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
