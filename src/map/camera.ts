import mapboxgl from "mapbox-gl";
import { appConfig } from "@/config/app.config";
import subregionsData from "@/data/geo/m49-subregions.json";

const subregionByCode = new Map(subregionsData.subregions.map((s) => [s.code, s]));

/**
 * Flies to a subregion's bounds. Antimeridian-crossing regions
 * (crossesAntimeridian: true in m49-subregions.json — Eastern Europe/
 * Russia, Australia and New Zealand, Melanesia, Polynesia) use hand-set
 * bounds rather than a computed bbox, so this never needs to decide
 * which "side" of the date line to fit — the bounds are already correct.
 */
export function flyToSubregion(map: mapboxgl.Map, subregionCode: string): void {
  const subregion = subregionByCode.get(subregionCode);
  if (!subregion) return;

  const [west, south, east, north] = subregion.bounds as [number, number, number, number];
  map.fitBounds(
    [
      [west, south],
      [east, north],
    ],
    {
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      duration: 900,
      maxZoom: appConfig.map.maxZoom,
    }
  );
}

export function flyToGlobalView(map: mapboxgl.Map): void {
  map.flyTo({
    center: appConfig.map.initialCenter,
    zoom: appConfig.map.initialZoom,
    duration: 900,
  });
}
