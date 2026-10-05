"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createUser, checkLogin, startUserSession, endUserSession, requireUser } from "@/lib/users";
import { saveListingCore, deleteBlobs } from "@/lib/listings";
import { sql } from "@/lib/db";
import type { SaveState } from "@/components/listing/ListingForm";

export type AuthState = { error: string };

export async function signup(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (String(form.get("website") ?? "")) return { error: "Something went wrong. Please try again." }; // bots fill hidden fields
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("password2") ?? "")) return { error: "The two passwords don't match." };
  if (form.get("agree") !== "on") return { error: "Please agree to the terms to make an account." };
  const result = await createUser(String(form.get("username") ?? ""), String(form.get("email") ?? ""), password);
  if ("error" in result) return { error: result.error ?? "Couldn't create the account." };
  await startUserSession(result.id);
  redirect("/account?welcome=1");
}

export async function login(_prev: AuthState, form: FormData): Promise<AuthState> {
  const id = await checkLogin(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
  if (!id) {
    await new Promise((r) => setTimeout(r, 700)); // slows down password guessing
    return { error: "That username or password isn't right." };
  }
  await startUserSession(id);
  redirect(String(form.get("next") ?? "").startsWith("/account") ? String(form.get("next")) : "/account");
}

export async function logout() {
  await endUserSession();
  redirect("/");
}

export async function savePlayerListing(_prev: SaveState, form: FormData): Promise<SaveState> {
  const user = await requireUser();
  const result = await saveListingCore(form, { by: "player", sellerId: user.id });
  if ("error" in result) return result;
  revalidatePath("/account");
  redirect(`/account?minted=${result.cardNo ?? ""}`);
}

/** A player can withdraw a listing while it's waiting for review. */
export async function withdrawListing(form: FormData) {
  const user = await requireUser();
  const id = Number(form.get("id"));
  const rows = (await sql()`DELETE FROM bg_products WHERE id = ${id} AND seller_id = ${user.id} AND review = 'pending'
                            RETURNING images`) as { images: string[] }[];
  if (rows[0]) await deleteBlobs(rows[0].images);
  revalidatePath("/account");
  redirect("/account");
}
