import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { sql, ensureSchema } from "./db";

/* Player accounts: username + password (+ an email so we can tell sellers when their game sells).
   Passwords are hashed with scrypt and a random salt; the plain password is never stored.
   Sessions are a signed cookie (bg_user), separate from the admin login. */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "bg_user";
const MAX_AGE = 60 * 60 * 24 * 30;

export type User = { id: number; username: string; email: string; disabled: boolean; created_at: string };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (16+ characters)");
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) return false;
  const hash = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return expected.length === hash.length && timingSafeEqual(expected, hash);
}

export const USERNAME_RULE = /^[a-z0-9_-]{3,24}$/;

export async function createUser(usernameRaw: string, email: string, password: string) {
  const username = usernameRaw.trim().toLowerCase();
  if (!USERNAME_RULE.test(username)) return { error: "Usernames are 3 to 24 letters, numbers, - or _." };
  if (password.length < 10) return { error: "Use a password of at least 10 characters." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email, so we can tell you when a game sells." };
  await ensureSchema();
  const hash = await hashPassword(password);
  const rows = (await sql()`INSERT INTO bg_users (username, email, password_hash)
                            VALUES (${username}, ${email.trim().toLowerCase()}, ${hash})
                            ON CONFLICT (username) DO NOTHING RETURNING id`) as { id: number }[];
  if (!rows[0]) return { error: "That username is taken. Try another." };
  return { id: rows[0].id };
}

export async function checkLogin(usernameRaw: string, password: string) {
  await ensureSchema();
  const rows = (await sql()`SELECT id, password_hash, disabled FROM bg_users WHERE username = ${usernameRaw.trim().toLowerCase()}`) as {
    id: number;
    password_hash: string;
    disabled: boolean;
  }[];
  // Always run a hash, so a missing username takes as long as a wrong password
  const ok = await verifyPassword(password, rows[0]?.password_hash ?? "scrypt$00$00");
  if (!rows[0] || !ok || rows[0].disabled) return null;
  return rows[0].id;
}

export async function startUserSession(id: number) {
  const token = await new SignJWT({ role: "player", uid: id })
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

export async function endUserSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "player" || typeof payload.uid !== "number") return null;
    await ensureSchema();
    const rows = (await sql()`SELECT id, username, email, disabled, created_at FROM bg_users WHERE id = ${payload.uid}`) as User[];
    return rows[0] && !rows[0].disabled ? rows[0] : null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/account/login");
  return user;
}

export async function getUserById(id: number) {
  const rows = (await sql()`SELECT id, username, email, disabled, created_at FROM bg_users WHERE id = ${id}`) as User[];
  return rows[0] ?? null;
}
