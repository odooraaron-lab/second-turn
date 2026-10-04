import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/components/CollectionView";
import { listPublicProducts } from "@/lib/products";
import { site } from "@/site.config";
import { shareImage } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const find = (id: string) => site.categories.find((c) => c.id === id);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = find((await params).id);
  if (!cat) return {};
  return {
    title: cat.title,
    description: cat.intro,
    alternates: { canonical: `/shop/category/${cat.id}` },
    openGraph: { title: `${cat.title} | ${site.name}`, description: cat.intro, url: `/shop/category/${cat.id}`, images: [shareImage] },
  };
}

export default async function CategoryPage({ params }: Props) {
  const cat = find((await params).id);
  if (!cat) notFound();
  const products = await listPublicProducts({ category: cat.id });
  return (
    <CollectionView
      title={cat.title}
      intro={cat.intro}
      path={`/shop/category/${cat.id}`}
      crumbs={[
        ["Home", "/"],
        ["Shop", "/shop"],
        [cat.label, `/shop/category/${cat.id}`],
      ]}
      products={products}
      active={{ category: cat.id }}
    />
  );
}
