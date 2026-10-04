import Link from "next/link";
import { site } from "@/site.config";

export default function NotFound() {
  return (
    <main className="lost">
      <div className="lost-card">
        <p className="lost-brand">{site.name}</p>
        <h1>Miss a turn</h1>
        <p>This page isn't here. The game may have sold and been taken down, or the link is mistyped.</p>
        <Link href="/shop" className="btn btn-buy">
          Back to the shop
        </Link>
        <Link href="/" className="text-link">
          Go to the start
        </Link>
      </div>
    </main>
  );
}
