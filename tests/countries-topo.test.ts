import { describe, expect, it } from "vitest";
import subregionsData from "@/data/geo/m49-subregions.json";
import topo from "@/data/geo/countries.topo.json";

// Minimal TopoJSON typing for what this test touches.
interface TopoFeatureProps {
  countryName: string;
  featureName: string;
  countryIso3: string | null;
  adm0Iso3: string | null;
  subregionCode: string | null;
  subregionName: string | null;
}
interface TopoGeometry {
  type: string;
  properties: TopoFeatureProps;
}
interface TopoObject {
  type: "GeometryCollection";
  geometries: TopoGeometry[];
}
interface Topology {
  type: "Topology";
  objects: Record<string, TopoObject>;
}

const topology = topo as unknown as Topology;
const geometries = Object.values(topology.objects)[0]!.geometries;
const validSubregionCodes = new Set(subregionsData.subregions.map((s) => s.code));

describe("generated countries.topo.json", () => {
  it("is a valid TopoJSON Topology with at least one object", () => {
    expect(topology.type).toBe("Topology");
    expect(Object.keys(topology.objects).length).toBeGreaterThan(0);
  });

  it("has a substantial number of country/territory features", () => {
    // Natural Earth's admin-0 map units layer has ~250+ features.
    expect(geometries.length).toBeGreaterThan(200);
  });

  it("gives every feature a subregionCode that is either null (excluded/neutral) or one of the 22 M49 codes", () => {
    for (const g of geometries) {
      const code = g.properties.subregionCode;
      if (code !== null) {
        expect(validSubregionCodes.has(code), `unknown subregion code: ${code}`).toBe(true);
      }
    }
  });

  it("covers every one of the 22 M49 subregions with at least one feature", () => {
    const present = new Set(
      geometries.map((g) => g.properties.subregionCode).filter((c): c is string => c !== null)
    );
    for (const s of subregionsData.subregions) {
      expect(present.has(s.code), `no features found for ${s.code} ${s.name}`).toBe(true);
    }
  });

  it("excludes only the documented neutral territories (null subregionCode)", () => {
    const excludedNames = geometries
      .filter((g) => g.properties.subregionCode === null)
      .map((g) => g.properties.featureName)
      .sort();
    expect(excludedNames).toEqual(
      ["Antarctica", "Heard I. and McDonald Is.", "S. Geo. and the Is.", "Siachen Glacier"].sort()
    );
  });
});
