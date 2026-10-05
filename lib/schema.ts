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

export const policyUrl = `${site.url}/returns-policy`;
export const shippingPolicyUrl = `${site.url}/shipping-policy`;

/** Return policy, valid both under an Offer and under the store. */
export function returnPolicy() {
  const base = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "NZ",
    returnPolicyCountry: "NZ",
    merchantReturnLink: policyUrl,
  };
  if (!site.returns.days) {
    return { ...base, returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" };
  }
  return {
    ...base,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: site.returns.days,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    refundType: "https://schema.org/FullRefund",
    itemCondition: ["https://schema.org/UsedCondition", "https://schema.org/NewCondition"],
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

/** Store-wide shipping services. Prices vary by game, so they're given on each product instead. */
export function shippingService() {
  const courier = {
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
  if (!site.pickup.enabled) return courier;
  const pickup = {
    "@type": "ShippingService",
    name: `Free pick-up in ${site.pickup.town}`,
    description: site.pickup.note,
    fulfillmentType: "https://schema.org/FulfillmentTypeCollectionPoint",
    shippingConditions: {
      "@type": "ShippingConditions",
      shippingDestination: NZ,
      shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "NZD" },
    },
  };
  return [courier, pickup];
}
