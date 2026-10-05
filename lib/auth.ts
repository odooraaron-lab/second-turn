import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { createHash, timingSafeEqual } from "node:crypto";

const COOKIE = "bg_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (16+ characters)");
  return new TextEncoder().encode(s);
}

const digest = (v: string) => createHash("sha256").update(v).digest();

export function checkCredentials(username: string, password: string) {
  const u = process.env.ADMIN_USERNAME ?? "";
  const p = process.env.ADMIN_PASSWORD ?? "";
  if (!u || !p) return false;
  const userOk = timingSafeEqual(digest(username), digest(u));
  const passOk = timingSafeEqual(digest(password), digest(p));
  return userOk && passOk;
}

export async function startSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin"; // player sessions are signed with the same secret, so check the role
  } catch {
    return false;
  }
}

/** Call at the top of every admin page, server action and admin API route. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
