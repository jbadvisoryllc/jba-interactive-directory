import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { appConfig } from "@/config/app.config";
import { buildBaseStyle } from "@/map/mapStyle";
import { loadCountryFeatures } from "@/data/geo/loadCountries";
import { addCountryLayers } from "@/map/countryLayers";
import { wireRegionInteractions, type RegionInteractionCallbacks, type RegionInteractionHandle } from "@/map/interactions";
import { GlobalViewControl } from "@/map/GlobalViewControl";
import { addBusinessMarkerLayers, type BusinessMarkerCallbacks, type BusinessMarkerHandle } from "@/map/businessMarkers";
import type { Business } from "@/data/business-types";

export interface MapReadyHandle {
  markers: BusinessMarkerHandle;
  regions: RegionInteractionHandle;
}

export interface MapInitResult {
  map: mapboxgl.Map;
  tokenConfigured: boolean;
  /** Resolves once the style + country/business layers are added (map "load" has fired). */
  ready: Promise<MapReadyHandle>;
}

export interface MapInitOptions {
  interactionCallbacks?: RegionInteractionCallbacks;
  businesses?: Business[];
  businessCallbacks?: BusinessMarkerCallbacks;
}

/**
 * Initializes the Mapbox GL map into `container`: base style, the
 * country/subregion layers (once the style finishes loading and the
 * TopoJSON is decoded), hover/selection interaction, and the zoom +
 * "return to global view" controls.
 */
export function initMap(container: HTMLElement, options: MapInitOptions = {}): MapInitResult {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const tokenConfigured = Boolean(token && token.trim().length > 0);

  if (tokenConfigured) {
    mapboxgl.accessToken = token as string;
  }

  const map = new mapboxgl.Map({
    container,
    style: buildBaseStyle(),
    center: appConfig.map.initialCenter,
    zoom: appConfig.map.initialZoom,
    minZoom: appConfig.map.minZoom,
    maxZoom: appConfig.map.maxZoom,
    projection: appConfig.map.projection,
    attributionControl: true,
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

  map.on("error", (e) => {
    // eslint-disable-next-line no-console
    console.error("[jba:map-error]", e.error);
  });

  let resolveReady: (handle: MapReadyHandle) => void;
  const ready = new Promise<MapReadyHandle>((resolve) => {
    resolveReady = resolve;
  });

  map.on("load", () => {
    const countries = loadCountryFeatures();
    addCountryLayers(map, countries);
    const interactions = wireRegionInteractions(map, options.interactionCallbacks);
    map.addControl(new GlobalViewControl(() => interactions.clearSelection()), "top-right");
    const markerHandle = addBusinessMarkerLayers(map, options.businesses ?? [], options.businessCallbacks);
    resolveReady({ markers: markerHandle, regions: interactions });
  });

  return { map, tokenConfigured, ready };
}
