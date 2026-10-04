import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/site.config";
import { returnPolicy, shippingService, policyUrl } from "@/lib/schema";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const sameAs = [site.instagram, site.facebook].filter(Boolean);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${site.url}/#website`,
              url: site.url,
              name: site.name,
              description: site.description,
              inLanguage: "en-NZ",
            },
            {
              "@type": "OnlineStore",
              "@id": `${site.url}/#store`,
              name: site.name,
              url: site.url,
              logo: `${site.url}/icon-512.png`,
              description: site.description,
              areaServed: { "@type": "Country", name: "New Zealand" },
              ...(site.pickup.enabled
                ? { address: { "@type": "PostalAddress", addressLocality: site.pickup.town, addressCountry: "NZ" } }
                : {}),
              ...(site.contactEmail
                ? { contactPoint: { "@type": "ContactPoint", contactType: "Customer Service", email: site.contactEmail } }
                : {}),
              ...(sameAs.length ? { sameAs } : {}),
              hasMerchantReturnPolicy: { ...returnPolicy(), merchantReturnLink: policyUrl },
              hasShippingService: shippingService(),
            },
          ],
        }}
      />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
