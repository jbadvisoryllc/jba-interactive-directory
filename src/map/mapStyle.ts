import type { StyleSpecification } from "mapbox-gl";
import { palette } from "@/theme/palette";

/**
 * A minimal Mapbox GL style built entirely in code from the approved
 * palette (see theme/tokens.css) rather than a Mapbox Studio style.
 *
 * Checkpoint 1 scope: ocean background + a background-only land fill so the
 * deployed smoke-test page proves the token, the projection, and the color
 * system end to end. Country polygons, subregion fill/hover/selected states,
 * and labels are added in Checkpoint 2 once countries.topo.json exists
 * (scripts/build-geo.mjs).
 */
export function buildBaseStyle(): StyleSpecification {
  return {
    version: 8,
    name: "JB Advisory — Global Business Network",
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
