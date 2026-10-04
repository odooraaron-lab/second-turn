import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/CollectionView";
import { EraPosts } from "@/components/EraPosts";
import { listPublicProducts } from "@/lib/products";
import { site } from "@/site.config";
import { shareImage } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const find = (id: string) => site.eras.find((e) => e.id === id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const era = find((await params).id);
  if (!era) return {};
  return {
    title: era.title,
    description: era.intro,
    alternates: { canonical: `/shop/era/${era.id}` },
    openGraph: { title: `${era.title} | ${site.name}`, description: era.intro, url: `/shop/era/${era.id}`, images: [shareImage] },
  };
}

export default async function EraPage({ params }: Props) {
  const era = find((await params).id);
  if (!era) notFound();
  const products = await listPublicProducts({ era: era.id });
  return (
    <CollectionView
      title={era.id === "2000s-on" ? "Modern classics" : `${era.label} games`}
      intro={era.intro}
      path={`/shop/era/${era.id}`}
      crumbs={[
        ["Home", "/"],
        ["Shop", "/shop"],
        [era.label, `/shop/era/${era.id}`],
      ]}
      products={products}
      active={{ era: era.id }}
      lead={<EraPosts eraId={era.id} label={era.label} />}
      productsHeading={`${era.label} games for sale`}
    />
  );
}
