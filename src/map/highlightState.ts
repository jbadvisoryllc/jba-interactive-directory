import type { Expression } from "mapbox-gl";
import { palette } from "@/theme/palette";

/**
 * Builds the fill-color / line-color / line-width paint expressions for
 * the current hover/selection state. Highlighting is done by M49
 * subregion code (not per-country), so hovering or selecting one country
 * highlights its whole region — matching "highlight regions on hover" in
 * the brief, rather than a single-country highlight.
 *
 * Design principle: no rainbow coloring. Every subregion shares the same
 * neutral land color; turquoise is reserved for hover/selection only.
 */
export interface HighlightState {
  hoveredSubregionCode: string | null;
  selectedSubregionCode: string | null;
  /**
   * Regions selected in the Checkpoint 3 filter panel (independent of
   * hover/click-to-navigate selection above). Rendered as a lighter,
   * sustained accent tint so filtering a region reads clearly on the map
   * without being confused for — or overriding — the camera-fly
   * click-selection, which stays a single region and still takes
   * visual priority when the two overlap.
   */
  filterSelectedSubregionCodes: Set<string>;
}

const SELECTED_OPACITY = 0.78;
const HOVER_OPACITY = 0.5;
const FILTER_SELECTED_OPACITY = 0.38;

function isIn(code: string | null, set: Set<string>): boolean {
  return code !== null && set.has(code);
}

export function buildFillColorExpression(state: HighlightState): Expression {
  return [
    "case",
    ["==", ["get", "subregionCode"], state.selectedSubregionCode ?? "__none__"],
    palette.accent,
    ["==", ["get", "subregionCode"], state.hoveredSubregionCode ?? "__none__"],
    palette.accent,
    ["in", ["get", "subregionCode"], ["literal", [...state.filterSelectedSubregionCodes]]],
    palette.accent,
    palette.mapLand,
  ];
}

export function buildFillOpacityExpression(state: HighlightState): Expression {
  return [
    "case",
    ["==", ["get", "subregionCode"], state.selectedSubregionCode ?? "__none__"],
    SELECTED_OPACITY,
    ["==", ["get", "subregionCode"], state.hoveredSubregionCode ?? "__none__"],
    HOVER_OPACITY,
    ["in", ["get", "subregionCode"], ["literal", [...state.filterSelectedSubregionCodes]]],
    FILTER_SELECTED_OPACITY,
    1,
  ];
}

export function buildLineColorExpression(state: HighlightState): Expression {
  return [
    "case",
    ["==", ["get", "subregionCode"], state.selectedSubregionCode ?? "__none__"],
    palette.accent,
    ["==", ["get", "subregionCode"], state.hoveredSubregionCode ?? "__none__"],
    palette.accentHover,
    ["in", ["get", "subregionCode"], ["literal", [...state.filterSelectedSubregionCodes]]],
    palette.accent,
    palette.border,
  ];
}

export function buildLineWidthExpression(state: HighlightState): Expression {
  return [
    "case",
    ["==", ["get", "subregionCode"], state.selectedSubregionCode ?? "__none__"],
    1.5,
    ["==", ["get", "subregionCode"], state.hoveredSubregionCode ?? "__none__"],
    1.1,
    ["in", ["get", "subregionCode"], ["literal", [...state.filterSelectedSubregionCodes]]],
    1.1,
    0.5,
  ];
}

// isIn is exported for potential reuse by callers inspecting state directly (e.g. tests).
export { isIn };
