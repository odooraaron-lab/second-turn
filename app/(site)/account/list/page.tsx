import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/users";
import { ListingForm } from "@/components/listing/ListingForm";
import { savePlayerListing } from "../actions";
import { gameOptions } from "@/lib/game-options";

export const metadata: Metadata = { title: "List a game", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ListGame() {
  const user = await requireUser();
  return (
    <div className="wrap account-form">
      <Link href="/account" className="back">
        Back to my cards
      </Link>
      <header className="page-head">
        <h1>List a game</h1>
        <p>
          Signed in as @{user.username}. When you save, your listing is minted as a collector card with its own number. The
          stats lock for good, so check them first. We review every listing before it goes in the shop.
        </p>
      </header>
      <ListingForm save={savePlayerListing} mode="player" games={await gameOptions()} />
    </div>
  );
}
