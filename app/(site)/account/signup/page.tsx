import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/users";
import { SignupForm } from "../AuthForms";

export const metadata: Metadata = {
  title: "Make an account to sell your board games",
  description: "Make a free account to list your second hand board games. Each listing is minted as a collector card.",
};

export default async function Signup() {
  if (await currentUser()) redirect("/account");
  return (
    <div className="wrap account-page">
      <SignupForm />
    </div>
  );
}
