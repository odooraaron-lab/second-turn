import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/users";
import { LoginForm } from "../AuthForms";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function Login() {
  if (await currentUser()) redirect("/account");
  return (
    <div className="wrap account-page">
      <LoginForm />
    </div>
  );
}
