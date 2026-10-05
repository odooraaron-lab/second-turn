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
              legalName: site.business.tradingName,
              url: site.url,
              logo: `${site.url}/icon-512.png`,
              description: site.description,
              areaServed: { "@type": "Country", name: "New Zealand" },
              ...(site.pickup.enabled
                ? { address: { "@type": "PostalAddress", addressLocality: site.pickup.town, addressCountry: "NZ" } }
                : {}),
              ...(site.contactEmail || site.business.phone
                ? {
                    contactPoint: {
                      "@type": "ContactPoint",
                      contactType: "customer service",
                      areaServed: "NZ",
                      availableLanguage: "en",
                      url: `${site.url}/contact`,
                      ...(site.contactEmail ? { email: site.contactEmail } : {}),
                      ...(site.business.phone ? { telephone: site.business.phone } : {}),
                    },
                  }
                : {}),
              ...(site.contactEmail ? { email: site.contactEmail } : {}),
              ...(site.business.phone ? { telephone: site.business.phone } : {}),
              ...(site.business.gstRegistered && site.business.gstNumber ? { taxID: site.business.gstNumber } : {}),
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
