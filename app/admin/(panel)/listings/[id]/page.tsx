import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getProductById, publicStatus } from "@/lib/products";
import { ListingForm } from "../../ListingForm";
import { setSold, setVisible, deleteListing } from "../../../actions";
import { ConfirmButton } from "../../ConfirmButton";

export const metadata = { title: "Edit game" };

type Props = { params: Promise<{ id: string }> };

export default async function EditListing({ params }: Props) {
  await requireAdmin();
  const product = await getProductById(Number((await params).id));
  if (!product) notFound();

  const status = publicStatus(product);
  const sold = product.status === "sold";

  const summary = !product.visible
    ? { label: "Hidden", text: "Not showing in the shop. Only you can see it here." }
    : sold
      ? { label: "Sold", text: "Showing in the shop marked Sold. Take it down whenever you like." }
      : status === "reserved"
        ? { label: "In checkout", text: "Someone is paying for it right now. It goes back on sale if they don't finish." }
        : { label: "For sale", text: "Live in the shop and ready to buy." };

  return (
    <>
      <Link href="/admin" className="back">
        Back to listings
      </Link>
      <div className="admin-title">
        <h1>Edit game</h1>
        {product.visible && (
          <Link href={`/shop/${product.slug}`} target="_blank" className="btn btn-quiet btn-small">
            View in shop
          </Link>
        )}
      </div>

      <section className="status-panel" aria-label="Status">
        <strong>
          {sold && product.visible && <span className="red-dot" aria-hidden />}
          {summary.label}
        </strong>
        <p>{summary.text}</p>
        <div className="status-actions">
          <form action={setSold}>
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="sold" value={sold ? "0" : "1"} />
            <button className="btn btn-quiet btn-small" type="submit">
              {sold ? "Put back on sale" : "Mark as sold"}
            </button>
          </form>
          <form action={setVisible}>
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="visible" value={product.visible ? "0" : "1"} />
            <button className="btn btn-quiet btn-small" type="submit">
              {product.visible ? "Take down" : "Show in shop"}
            </button>
          </form>
        </div>
      </section>

      <ListingForm product={product} />

      <div className="danger-zone">
        <p className="hint">Deleting removes the game and its photos for good. To keep a record, take it down instead.</p>
        <form action={deleteListing}>
          <input type="hidden" name="id" value={product.id} />
          <ConfirmButton message={`Delete “${product.title}” and its photos for good?`}>Delete game</ConfirmButton>
        </form>
      </div>
    </>
  );
}
