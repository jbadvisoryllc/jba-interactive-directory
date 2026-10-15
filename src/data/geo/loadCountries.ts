import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import rawTopology from "@/data/geo/countries.topo.json";

export interface CountryFeatureProperties {
  countryName: string;
  featureName: string;
  countryIso3: string | null;
  adm0Iso3: string | null;
  /** M49 subregion code, or null for neutral/non-interactive land (Antarctica, etc.) */
  subregionCode: string | null;
  subregionName: string | null;
}

/**
 * Decodes the generated TopoJSON (scripts/build-geo.mjs output) into a
 * GeoJSON FeatureCollection for Mapbox's `geojson` source, which does not
 * read TopoJSON directly. TopoJSON is what's committed to the repo because
 * its arc-sharing keeps the file small; this conversion happens once at
 * app start.
 */
export function loadCountryFeatures(): FeatureCollection<Geometry, CountryFeatureProperties> {
  const topology = rawTopology as unknown as Topology;
  const objectKey = Object.keys(topology.objects)[0];
  if (!objectKey) {
    throw new Error("countries.topo.json has no objects — run `npm run build:geo`.");
  }
  const geometryCollection = topology.objects[objectKey] as GeometryCollection<CountryFeatureProperties>;
  const collection = feature(topology, geometryCollection) as unknown as FeatureCollection<
    Geometry,
    CountryFeatureProperties
  >;

  // Mapbox GL's feature-state API addresses features by `id`, not by
  // arbitrary properties, so each feature needs a stable numeric id for
  // hover/selection state to work. featureName is unique per Natural Earth
  // map unit, which is a stable enough basis to derive one.
  collection.features.forEach((f: Feature<Geometry, CountryFeatureProperties>, index: number) => {
    f.id = index;
  });

  return collection;
}
