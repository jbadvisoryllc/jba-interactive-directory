import { describe, expect, it } from "vitest";
import subregions from "@/data/geo/m49-subregions.json";
import countryMap from "@/data/geo/country-subregion.json";

describe("M49 subregion data", () => {
  it("defines exactly 22 subregions", () => {
    expect(subregions.subregions).toHaveLength(22);
  });

  it("gives every subregion a unique code", () => {
    const codes = subregions.subregions.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("maps every country to a known subregion code", () => {
    const validCodes = new Set(subregions.subregions.map((s) => s.code));
    const entries = Object.entries(countryMap.mapping);
    expect(entries.length).toBeGreaterThan(0);
    for (const [country, code] of entries) {
      expect(validCodes.has(code), `${country} -> unknown subregion ${code}`).toBe(true);
    }
  });
});
