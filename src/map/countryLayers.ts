import mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { palette } from "@/theme/palette";
import {
  LAYER_COUNTRIES_FILL,
  LAYER_COUNTRIES_FILL_NEUTRAL,
  LAYER_COUNTRIES_LINE,
  LAYER_SUBREGION_LABELS,
  SOURCE_COUNTRIES,
  SOURCE_SUBREGION_LABELS,
} from "@/map/layerIds";
import {
  buildFillColorExpression,
  buildFillOpacityExpression,
  buildLineColorExpression,
  buildLineWidthExpression,
  type HighlightState,
} from "@/map/highlightState";
import type { CountryFeatureProperties } from "@/data/geo/loadCountries";
import subregionsData from "@/data/geo/m49-subregions.json";

const INITIAL_STATE: HighlightState = {
  hoveredSubregionCode: null,
  selectedSubregionCode: null,
  filterSelectedSubregionCodes: new Set(),
};

function buildLabelFeatureCollection(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: subregionsData.subregions.map((s) => ({
      type: "Feature",
      properties: { code: s.code, name: s.name },
      geometry: { type: "Point", coordinates: s.labelPoint },
    })),
  };
}

/**
 * Adds the countries source and its three render layers (neutral/excluded
 * land, interactive land, borders) plus the subregion label layer. Call
 * once after the style has finished loading.
 */
export function addCountryLayers(
  map: mapboxgl.Map,
  countries: FeatureCollection<Geometry, CountryFeatureProperties>
): void {
  map.addSource(SOURCE_COUNTRIES, {
    type: "geojson",
    data: countries,
  });

  // Non-interactive land (Antarctica, etc. — no M49 subregion).
  map.addLayer({
    id: LAYER_COUNTRIES_FILL_NEUTRAL,
    type: "fill",
    source: SOURCE_COUNTRIES,
    filter: ["==", ["get", "subregionCode"], null],
    paint: {
      "fill-color": palette.mapLand,
      "fill-opacity": 0.6,
    },
  });

  // Interactive land — hover/selection handled via paint property updates
  // in map/interactions.ts (see highlightState.ts for the expressions).
  map.addLayer({
    id: LAYER_COUNTRIES_FILL,
    type: "fill",
    source: SOURCE_COUNTRIES,
    filter: ["!=", ["get", "subregionCode"], null],
    paint: {
      "fill-color": buildFillColorExpression(INITIAL_STATE),
      "fill-opacity": buildFillOpacityExpression(INITIAL_STATE),
      "fill-opacity-transition": { duration: 150 },
      "fill-color-transition": { duration: 150 },
    },
  });

  map.addLayer({
    id: LAYER_COUNTRIES_LINE,
    type: "line",
    source: SOURCE_COUNTRIES,
    paint: {
      "line-color": buildLineColorExpression(INITIAL_STATE),
      "line-width": buildLineWidthExpression(INITIAL_STATE),
      "line-color-transition": { duration: 150 },
    },
  });

  map.addSource(SOURCE_SUBREGION_LABELS, {
    type: "geojson",
    data: buildLabelFeatureCollection(),
  });

  map.addLayer({
    id: LAYER_SUBREGION_LABELS,
    type: "symbol",
    source: SOURCE_SUBREGION_LABELS,
    minzoom: 0,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
      "text-size": 12,
      "text-letter-spacing": 0.02,
      "text-allow-overlap": false,
      "text-optional": true,
    },
    paint: {
      "text-color": palette.textSecondary,
      "text-halo-color": palette.background,
      "text-halo-width": 1.2,
    },
  });
}
