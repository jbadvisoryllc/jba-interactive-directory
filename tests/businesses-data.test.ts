import { describe, expect, it } from "vitest";
import { businesses, countByHeadquartersSubregion, industryColors } from "@/data/businesses";
import { INDUSTRIES } from "@/data/business-types";
import subregionsData from "@/data/geo/m49-subregions.json";
import countrySubregion from "@/data/geo/country-subregion.json";

describe("fictional business dataset", () => {
  it("loads without throwing validation errors (see src/data/businesses.ts)", () => {
    expect(businesses.length).toBeGreaterThanOrEqual(35);
  });

  it("has a unique id for every business", () => {
    const ids = new Set(businesses.map((b) => b.id));
    expect(ids.size).toBe(businesses.length);
  });

  it("only uses the seven approved industries", () => {
    for (const biz of businesses) {
      expect(INDUSTRIES).toContain(biz.industry);
    }
  });

  it("gives every business a non-empty name, description, and at least one service", () => {
    for (const biz of businesses) {
      expect(biz.name.trim().length).toBeGreaterThan(0);
      expect(biz.description.trim().length).toBeGreaterThan(0);
      expect(biz.services.length).toBeGreaterThan(0);
    }
  });

  it("gives every business a headquarters subregion matching its country's M49 mapping", () => {
    const mapping = countrySubregion.mapping as Record<string, string>;
    for (const biz of businesses) {
      expect(mapping[biz.headquarters.countryIso3]).toBe(biz.headquarters.subregionCode);
    }
  });

  it("gives every business headquarters coordinates in valid lng/lat ranges", () => {
    for (const biz of businesses) {
      const [lng, lat] = biz.headquarters.coordinates;
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    }
  });

  it("keeps serviceCoverage independent of headquarters and referencing valid codes", () => {
    const subregionCodes = new Set(subregionsData.subregions.map((s) => s.code));
    const countryCodes = new Set(Object.keys(countrySubregion.mapping));
    for (const biz of businesses) {
      expect(biz.serviceCoverage.length).toBeGreaterThan(0);
      for (const coverage of biz.serviceCoverage) {
        if (coverage.type === "region") {
          expect(subregionCodes.has(coverage.code)).toBe(true);
        } else {
          expect(countryCodes.has(coverage.code)).toBe(true);
        }
      }
    }
  });

  it("has an industry color for every industry used", () => {
    for (const industry of INDUSTRIES) {
      expect(industryColors[industry]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("spreads headquarters across a meaningful number of M49 subregions", () => {
    const counts = countByHeadquartersSubregion();
    expect(counts.size).toBeGreaterThanOrEqual(15);
  });

  it("represents every approved industry at least once", () => {
    const present = new Set(businesses.map((b) => b.industry));
    for (const industry of INDUSTRIES) {
      expect(present.has(industry)).toBe(true);
    }
  });
});
