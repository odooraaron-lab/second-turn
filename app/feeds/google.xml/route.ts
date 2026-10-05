import { listPublicProducts, publicStatus } from "@/lib/products";
import { site, categoryLabel, eraLabel, conditionOf, completenessOf } from "@/site.config";

export const dynamic = "force-dynamic";

/* Product feed for Google Merchant Center (free listings in Google Shopping and the Shopping tab),
   also accepted by Facebook and Instagram catalogues. Add this URL as a scheduled feed:
     https://YOUR-SITE/feeds/google.xml
   Only games that can be bought right now are included. */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
const absolute = (src: string) => (src.startsWith("http") ? src : `${site.url}${src}`);

export async function GET() {
  const products = (await listPublicProducts().catch(() => [])).filter(
    (p) => publicStatus(p) === "available" && p.images.length
  );

  const items = products
    .map((p) => {
      const condition = conditionOf(p.condition);
      const complete = completenessOf(p.completeness);
      const title = `${p.title}${p.year ? ` (${p.year})` : ""}${p.category === "parts" ? " spare part" : " board game"}, second hand`;
      const description = [
        p.description,
        complete?.label,
        condition ? `${condition.label} condition. ${condition.note}` : "",
        [p.publisher, p.year, p.players].filter(Boolean).join(", "),
        `Couriered NZ-wide${site.pickup.enabled ? ` or pick up in ${site.pickup.town}` : ""}.`,
      ]
        .filter(Boolean)
        .join(" ")
        .slice(0, 4900);
      return `    <item>
      <g:id>BG-${p.id}</g:id>
      <g:title>${esc(title.slice(0, 150))}</g:title>
      <g:description>${esc(description)}</g:description>
      <g:link>${site.url}/shop/${p.slug}</g:link>
      <g:image_link>${esc(absolute(p.images[0]))}</g:image_link>
${p.images
  .slice(1, 10)
  .map((src) => `      <g:additional_image_link>${esc(absolute(src))}</g:additional_image_link>`)
  .join("\n")}
      <g:availability>in_stock</g:availability>
      <g:price>${(p.price_cents / 100).toFixed(2)} NZD</g:price>
      <g:condition>${condition?.schema === "NewCondition" ? "new" : "used"}</g:condition>
      <g:google_product_category>1246</g:google_product_category>
      <g:product_type>${esc(["Board games", categoryLabel(p.category), eraLabel(p.era)].filter(Boolean).join(" > "))}</g:product_type>
      ${p.publisher ? `<g:brand>${esc(p.publisher)}</g:brand>` : ""}
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>NZ</g:country>
        <g:service>Tracked courier</g:service>
        <g:price>${(p.shipping_cents / 100).toFixed(2)} NZD</g:price>
      </g:shipping>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(site.name)}: second hand board games NZ</title>
    <link>${site.url}</link>
    <description>${esc(site.description)}</description>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=900" },
  });
}
