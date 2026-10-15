import type { Business } from "@/data/business-types";
import raw from "@/data/businesses.json";
import countrySubregion from "@/data/geo/country-subregion.json";
import subregionsData from "@/data/geo/m49-subregions.json";

const subregionCodes = new Set(subregionsData.subregions.map((s) => s.code));
const countryToSubregion = countrySubregion.mapping as Record<string, string>;

/**
 * Loads + validates the fictional business dataset at module init. A
 * failed validation throws immediately (surfaced in the console during
 * dev/build) rather than silently rendering a business with a broken
 * region assignment — the same "fail loud, fail early" approach used by
 * scripts/build-geo.mjs for the boundary data.
 */
function loadBusinesses(): Business[] {
  const businesses = raw.businesses as unknown as Business[];
  for (const biz of businesses) {
    const hq = biz.headquarters;
    const expectedSubregion = countryToSubregion[hq.countryIso3];
    if (!expectedSubregion) {
      throw new Error(`[businesses] ${biz.id}: headquarters country ${hq.countryIso3} has no M49 subregion mapping`);
    }
    if (expectedSubregion !== hq.subregionCode) {
      throw new Error(
        `[businesses] ${biz.id}: headquarters.subregionCode "${hq.subregionCode}" does not match the mapped subregion "${expectedSubregion}" for ${hq.countryIso3}`
      );
    }
    for (const coverage of biz.serviceCoverage) {
      if (coverage.type === "region" && !subregionCodes.has(coverage.code)) {
        throw new Error(`[businesses] ${biz.id}: serviceCoverage references unknown region code "${coverage.code}"`);
      }
      if (coverage.type === "country" && !countryToSubregion[coverage.code]) {
        throw new Error(`[businesses] ${biz.id}: serviceCoverage references unknown country code "${coverage.code}"`);
      }
    }
  }
  return businesses;
}

export const businesses: Business[] = loadBusinesses();

export const industryColors: Record<string, string> = raw.industryColors;

/** Count of businesses headquartered in each M49 subregion, for sidebar counts. */
export function countByHeadquartersSubregion(list: Business[] = businesses): Map<string, number> {
  const counts = new Map<string, number>();
  for (const biz of list) {
    const code = biz.headquarters.subregionCode;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return counts;
}
