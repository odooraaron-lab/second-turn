import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ListingForm } from "../../ListingForm";

export const metadata = { title: "List a game" };

export default async function NewListing() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin" className="back">
        Back to listings
      </Link>
      <div className="admin-title">
        <h1>List a game</h1>
      </div>
      <ListingForm />
    </>
  );
}
