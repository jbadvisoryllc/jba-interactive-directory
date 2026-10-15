import { describe, expect, it } from "vitest";
import { allHeadquartersCountries, allServices, filterBusinesses, paginate, sortBusinesses } from "@/filters/businessFilters";
import { createInitialState } from "@/state/store";
import { businesses } from "@/data/businesses";

describe("filterBusinesses", () => {
  it("returns every business when no filters are set", () => {
    const result = filterBusinesses(businesses, createInitialState());
    expect(result.length).toBe(businesses.length);
  });

  it("filters by headquarters region, not service coverage", () => {
    // biz-013 (Meridian Freight Systems) is headquartered in Western
    // Europe (155) but its serviceCoverage also lists Northern Europe
    // (154) and Southern Europe (039) — filtering by 154 must exclude it,
    // proving the filter is headquarters-based per the brief.
    const state = { ...createInitialState(), selectedRegions: new Set(["154"]) };
    const result = filterBusinesses(businesses, state);
    expect(result.every((b) => b.headquarters.subregionCode === "154")).toBe(true);
    expect(result.find((b) => b.id === "biz-013")).toBeUndefined();
  });

  it("filters by headquarters country", () => {
    const state = { ...createInitialState(), selectedCountries: new Set(["USA"]) };
    const result = filterBusinesses(businesses, state);
    expect(result.every((b) => b.headquarters.countryIso3 === "USA")).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters by industry", () => {
    const state = { ...createInitialState(), selectedIndustries: new Set(["Marine Services" as const]) };
    const result = filterBusinesses(businesses, state);
    expect(result.every((b) => b.industry === "Marine Services")).toBe(true);
  });

  it("filters by service", () => {
    const state = { ...createInitialState(), selectedServices: new Set(["Customs brokerage"]) };
    const result = filterBusinesses(businesses, state);
    expect(result.every((b) => b.services.includes("Customs brokerage"))).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("combines filters and search with AND semantics", () => {
    const state = {
      ...createInitialState(),
      selectedIndustries: new Set(["Technology" as const]),
      searchQuery: "cloud",
    };
    const result = filterBusinesses(businesses, state);
    expect(result.length).toBeGreaterThan(0);
    for (const biz of result) {
      expect(biz.industry).toBe("Technology");
      const haystack = `${biz.name} ${biz.headquarters.countryName} ${biz.headquarters.city} ${biz.industry} ${biz.services.join(" ")}`.toLowerCase();
      expect(haystack).toContain("cloud");
    }
  });

  it("search matches company name, city, country, industry, and service", () => {
    const byName = filterBusinesses(businesses, { ...createInitialState(), searchQuery: "Okapi" });
    expect(byName.length).toBe(1);

    const byCity = filterBusinesses(businesses, { ...createInitialState(), searchQuery: "Nairobi" });
    expect(byCity.length).toBeGreaterThan(0);

    const byIndustry = filterBusinesses(businesses, { ...createInitialState(), searchQuery: "marine services" });
    expect(byIndustry.length).toBeGreaterThan(0);
  });

  it("returns an empty array when nothing matches", () => {
    const result = filterBusinesses(businesses, { ...createInitialState(), searchQuery: "zzzznomatch" });
    expect(result).toEqual([]);
  });
});

describe("sortBusinesses", () => {
  it("sorts by name ascending and descending", () => {
    const asc = sortBusinesses(businesses, "name-asc");
    const desc = sortBusinesses(businesses, "name-desc");
    expect(asc[0]?.name.localeCompare(asc[1]?.name ?? "")).toBeLessThanOrEqual(0);
    expect(desc[0]?.name.localeCompare(desc[1]?.name ?? "")).toBeGreaterThanOrEqual(0);
  });

  it("does not mutate the input array", () => {
    const copy = [...businesses];
    sortBusinesses(businesses, "name-asc");
    expect(businesses).toEqual(copy);
  });
});

describe("paginate", () => {
  it("slices into pages of the requested size", () => {
    const page1 = paginate(businesses, 1, 6);
    expect(page1.items.length).toBe(6);
    expect(page1.total).toBe(businesses.length);
    expect(page1.totalPages).toBe(Math.ceil(businesses.length / 6));
  });

  it("clamps an out-of-range page to the last valid page", () => {
    const result = paginate(businesses, 999, 6);
    expect(result.page).toBe(result.totalPages);
  });
});

describe("filter option helpers", () => {
  it("lists unique services alphabetically", () => {
    const services = allServices(businesses);
    const sorted = [...services].sort((a, b) => a.localeCompare(b));
    expect(services).toEqual(sorted);
    expect(new Set(services).size).toBe(services.length);
  });

  it("lists unique headquarters countries alphabetically by name", () => {
    const countries = allHeadquartersCountries(businesses);
    const names = countries.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(new Set(countries.map((c) => c.iso3)).size).toBe(countries.length);
  });
});
