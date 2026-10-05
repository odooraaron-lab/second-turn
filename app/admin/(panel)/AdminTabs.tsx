"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTabs() {
  const path = usePathname();
  const onOrders = path.startsWith("/admin/orders");
  const onSetup = path.startsWith("/admin/setup");
  const onCards = path.startsWith("/admin/cards");
  return (
    <nav className="admin-tabs wrap" aria-label="Admin">
      <Link href="/admin" aria-current={!onOrders && !onSetup && !onCards ? "page" : undefined}>
        Listings
      </Link>
      <Link href="/admin/orders" aria-current={onOrders ? "page" : undefined}>
        Orders
      </Link>
      <Link href="/admin/cards" aria-current={onCards ? "page" : undefined}>
        Cards
      </Link>
      <Link href="/admin/setup" aria-current={onSetup ? "page" : undefined}>
        Setup
      </Link>
    </nav>
  );
}
