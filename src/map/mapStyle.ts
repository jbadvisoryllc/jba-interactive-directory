import type { StyleSpecification } from "mapbox-gl";
import { palette } from "@/theme/palette";

/**
 * Base Mapbox GL style, built in code from the approved palette rather
 * than a Mapbox Studio style, for exact color control with no external
 * style to maintain.
 *
 * Only the ocean background and glyph source are declared here. Country
 * polygons, borders, and labels are added at runtime once the decoded
 * TopoJSON is available (see map/countryLayers.ts) — Mapbox GL styles
 * can't embed a GeoJSON source large enough to matter inline without
 * bloating every map load, so it's added via map.addSource after init.
 */
export function buildBaseStyle(): StyleSpecification {
  return {
    version: 8,
    name: "JB Advisory — Global Business Network",
    // Mapbox's hosted font service. Needed for any symbol layer with
    // text-field (regional labels). No Mapbox Studio style required —
    // this works with just the access token.
    glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": palette.mapOcean,
        },
      },
    ],
  };
}
