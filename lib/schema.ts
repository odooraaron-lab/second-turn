// Google structured data for shipping and returns (merchant listings).
// Kept in one place so product pages and the store-wide markup always match the policy page.
import { site } from "@/site.config";

const NZ = { "@type": "DefinedRegion", addressCountry: "NZ" };
const days = (r: { min: number; max: number }) => ({
  "@type": "QuantitativeValue",
  minValue: r.min,
  maxValue: r.max,
  unitCode: "DAY",
});
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => `https://schema.org/${d}`);

export const policyUrl = `${site.url}/shipping-and-returns`;

/** Return policy, valid both under an Offer and under the store. */
export function returnPolicy() {
  const base = { "@type": "MerchantReturnPolicy", applicableCountry: "NZ" };
  if (!site.returns.days) {
    return { ...base, returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" };
  }
  return {
    ...base,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: site.returns.days,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
  };
}

/** Per-product shipping (each game has its own courier price). */
export function offerShipping(shippingCents: number) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: (shippingCents / 100).toFixed(2), currency: "NZD" },
    shippingDestination: NZ,
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: days(site.shipping.handlingDays),
      transitTime: days(site.shipping.transitDays),
    },
  };
}

/** Store-wide shipping service. Prices vary by game, so they're given on each product instead. */
export function shippingService() {
  return {
    "@type": "ShippingService",
    name: "Tracked courier, New Zealand",
    description: site.dispatchNote,
    fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
    handlingTime: { "@type": "ServicePeriod", businessDays: weekdays, duration: days(site.shipping.handlingDays) },
    shippingConditions: {
      "@type": "ShippingConditions",
      shippingDestination: NZ,
      transitTime: { "@type": "ServicePeriod", businessDays: weekdays, duration: days(site.shipping.transitDays) },
    },
  };
}
