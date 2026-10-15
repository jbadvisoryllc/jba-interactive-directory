import mapboxgl from "mapbox-gl";
import { LAYER_COUNTRIES_FILL, LAYER_COUNTRIES_LINE } from "@/map/layerIds";
import {
  buildFillColorExpression,
  buildFillOpacityExpression,
  buildLineColorExpression,
  buildLineWidthExpression,
  type HighlightState,
} from "@/map/highlightState";
import { flyToSubregion } from "@/map/camera";
import type { CountryFeatureProperties } from "@/data/geo/loadCountries";

export interface RegionInteractionCallbacks {
  onHoverChange?: (subregionCode: string | null, subregionName: string | null) => void;
  onSelect?: (subregionCode: string, subregionName: string) => void;
}

export interface RegionInteractionHandle {
  /** Clears the current selection highlight without moving the camera. */
  clearSelection: () => void;
}

/**
 * Wires hover and click behavior on the interactive countries layer.
 * Hovering or clicking a country highlights its whole M49 subregion
 * (not just that one country) by regenerating the fill/line paint
 * expressions in highlightState.ts whenever the hovered/selected code
 * changes — see that file for why a per-subregion case expression is
 * used instead of Mapbox feature-state.
 */
export function wireRegionInteractions(
  map: mapboxgl.Map,
  callbacks: RegionInteractionCallbacks = {}
): RegionInteractionHandle {
  const state: HighlightState = { hoveredSubregionCode: null, selectedSubregionCode: null };

  function applyState() {
    map.setPaintProperty(LAYER_COUNTRIES_FILL, "fill-color", buildFillColorExpression(state));
    map.setPaintProperty(LAYER_COUNTRIES_FILL, "fill-opacity", buildFillOpacityExpression(state));
    map.setPaintProperty(LAYER_COUNTRIES_LINE, "line-color", buildLineColorExpression(state));
    map.setPaintProperty(LAYER_COUNTRIES_LINE, "line-width", buildLineWidthExpression(state));
  }

  map.on("mousemove", LAYER_COUNTRIES_FILL, (e: mapboxgl.MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties as CountryFeatureProperties | undefined;
    const code = props?.subregionCode ?? null;
    if (code !== state.hoveredSubregionCode) {
      state.hoveredSubregionCode = code;
      applyState();
      callbacks.onHoverChange?.(code, props?.subregionName ?? null);
    }
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", LAYER_COUNTRIES_FILL, () => {
    if (state.hoveredSubregionCode !== null) {
      state.hoveredSubregionCode = null;
      applyState();
      callbacks.onHoverChange?.(null, null);
    }
    map.getCanvas().style.cursor = "";
  });

  map.on("click", LAYER_COUNTRIES_FILL, (e: mapboxgl.MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties as CountryFeatureProperties | undefined;
    if (!props?.subregionCode) return;
    state.selectedSubregionCode = props.subregionCode;
    applyState();
    flyToSubregion(map, props.subregionCode);
    callbacks.onSelect?.(props.subregionCode, props.subregionName ?? "");
  });

  return {
    clearSelection: () => {
      state.selectedSubregionCode = null;
      applyState();
    },
  };
}
