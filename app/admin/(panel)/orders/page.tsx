import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listOrders, addressLines, type Order } from "@/lib/orders";
import { formatNzd, formatDate } from "@/lib/format";
import { markShipped } from "../../actions";
import { CopyButton } from "../CopyButton";
import { site } from "@/site.config";

export const metadata = { title: "Orders" };

function OrderCard({ o }: { o: Order }) {
  const pickup = o.delivery === "pickup";
  const address = [o.shipping_name || o.customer_name, ...addressLines(o.shipping_address)].join("\n");
  return (
    <article className="order">
      <div className="order-top">
        <span className="title">
          {o.product_id ? <Link href={`/admin/listings/${o.product_id}`}>{o.product_title}</Link> : o.product_title}
        </span>
        <strong>{formatNzd(o.amount_total)}</strong>
      </div>
      <p className="order-paid">
        Paid {formatDate(o.created_at)}
        {pickup ? ", pick-up" : `, including ${formatNzd(o.shipping_amount)} courier`}
      </p>

      <div className="ship-to">
        {pickup ? (
          <p className="pickup-flag">
            Picking up in {site.pickup.town}. Get in touch to arrange a time.
            <br />
            {o.customer_name}
          </p>
        ) : (
          <address>{address}</address>
        )}
        <div className="contact">
          <a href={`mailto:${o.customer_email}`}>{o.customer_email}</a>
          {o.customer_phone && <a href={`tel:${o.customer_phone}`}>{o.customer_phone}</a>}
        </div>
        {!pickup && o.status !== "shipped" && (
          <div>
            <CopyButton text={address} label="Copy address" />
          </div>
        )}
      </div>

      {o.status === "shipped" ? (
        <p className="order-done">
          {pickup ? "Collected" : "Shipped"} {o.shipped_at ? formatDate(o.shipped_at) : ""}
          {o.tracking ? `, tracking ${o.tracking}` : ""}.{pickup ? "" : " The buyer was emailed."}
        </p>
      ) : pickup ? (
        <form action={markShipped}>
          <input type="hidden" name="id" value={o.id} />
          <button className="btn" type="submit">
            Mark as collected
          </button>
        </form>
      ) : (
        <form action={markShipped}>
          <input type="hidden" name="id" value={o.id} />
          <label className="visually-hidden" htmlFor={`tracking-${o.id}`}>
            Tracking number
          </label>
          <input className="input" id={`tracking-${o.id}`} name="tracking" placeholder="Tracking number (optional)" />
          <button className="btn" type="submit">
            Mark as shipped
          </button>
          <p className="hint">The buyer gets an email with the tracking number.</p>
        </form>
      )}
    </article>
  );
}

export default async function Orders() {
  await requireAdmin();
  const orders = await listOrders();
  const toShip = orders.filter((o) => o.status !== "shipped");
  const shipped = orders.filter((o) => o.status === "shipped");

  if (!orders.length) return <p className="empty">No orders yet. Sales appear here as soon as they're paid.</p>;

  return (
    <>
      <section className="orders-group">
        <h2>To send or collect ({toShip.length})</h2>
        {toShip.length ? toShip.map((o) => <OrderCard key={o.id} o={o} />) : <p className="hint">All caught up.</p>}
      </section>
      {shipped.length > 0 && (
        <section className="orders-group">
          <h2>Done ({shipped.length})</h2>
          {shipped.map((o) => (
            <OrderCard key={o.id} o={o} />
          ))}
        </section>
      )}
    </>
  );
}
