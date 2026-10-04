import { site } from "@/site.config";

/** BreadcrumbList structured data from [name, path] pairs. */
export const breadcrumbs = (items: [string, string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: `${site.url}${path}`,
  })),
});

/** The branded share image (app/opengraph-image.png), for pages without a photo of their own. */
export const shareImage = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: `${site.name}, second-hand board games from New Zealand`,
};
