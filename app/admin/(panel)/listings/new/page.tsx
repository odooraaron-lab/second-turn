import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ListingForm } from "@/components/listing/ListingForm";
import { saveListing } from "../../../actions";
import { gameOptions } from "@/lib/game-options";

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
        <p className="hint">Saving mints its collector card: a card number and stats that are locked from then on.</p>
      </div>
      <ListingForm save={saveListing} mode="admin" games={await gameOptions()} />
    </>
  );
}
