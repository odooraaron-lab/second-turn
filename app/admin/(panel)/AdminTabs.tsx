"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTabs() {
  const path = usePathname();
  const onOrders = path.startsWith("/admin/orders");
  const onSetup = path.startsWith("/admin/setup");
  return (
    <nav className="admin-tabs wrap" aria-label="Admin">
      <Link href="/admin" aria-current={!onOrders && !onSetup ? "page" : undefined}>
        Listings
      </Link>
      <Link href="/admin/orders" aria-current={onOrders ? "page" : undefined}>
        Orders
      </Link>
      <Link href="/admin/setup" aria-current={onSetup ? "page" : undefined}>
        Setup
      </Link>
    </nav>
  );
}
