import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { appConfig } from "@/config/app.config";
import { buildBaseStyle } from "@/map/mapStyle";

export interface MapInitResult {
  map: mapboxgl.Map;
  tokenConfigured: boolean;
}

/**
 * Initializes the Mapbox GL map into `container` using the app's base
 * style and config. Checkpoint 1 scope only: no country layers, markers,
 * or interaction yet — those land in Checkpoint 2 alongside
 * countries.topo.json and the business dataset.
 */
export function initMap(container: HTMLElement): MapInitResult {
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

  return { map, tokenConfigured };
}
