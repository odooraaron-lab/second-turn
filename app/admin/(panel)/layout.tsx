import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";
import { AdminTabs } from "./AdminTabs";
import { site } from "@/site.config";

export const dynamic = "force-dynamic";

export default async function Panel({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="admin-bar">
        <div className="wrap admin-bar-top">
          <Link href="/admin" className="wordmark">
            {site.name}
          </Link>
          <form action={logout}>
            <button className="link-btn" type="submit">
              Log out
            </button>
          </form>
        </div>
        <AdminTabs />
      </header>
      <div className="wrap admin-main">{children}</div>
    </>
  );
}
