import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { CollectionView } from "@/components/CollectionView";
import { listPublicProducts } from "@/lib/products";
import { site } from "@/site.config";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ c?: string; price?: string }> };

export const metadata: Metadata = {
  title: "Buy Second Hand Board Games Online NZ",
  description: `Second hand and vintage board games, card games, jigsaws and spare parts at fixed Buy Now prices. Every piece counted. Courier NZ-wide or pick up in Whangārei.`,
  alternates: { canonical: "/shop" },
};

export default async function Shop({ searchParams }: Props) {
  const { c, price } = await searchParams;
  // Category links like /shop?c=puzzles live at their own address.
  if (c && site.categories.some((x) => x.id === c)) permanentRedirect(`/shop/category/${c}`);

  const band = site.priceBands.find((b) => b.id === price);
  const products = await listPublicProducts({ price: band?.id });

  return (
    <CollectionView
      title={band ? `Games ${band.label.charAt(0).toLowerCase()}${band.label.slice(1)}` : "Every game for sale"}
      intro={
        band
          ? "Prices are in NZ dollars, before courier."
          : "Second hand board games, card games, jigsaws and spare parts, every one counted and photographed. Fixed Buy Now prices, tracked courier anywhere in New Zealand."
      }
      path="/shop"
      crumbs={[
        ["Home", "/"],
        ["Shop", "/shop"],
      ]}
      products={products}
      active={{ price: band?.id }}
    />
  );
}
