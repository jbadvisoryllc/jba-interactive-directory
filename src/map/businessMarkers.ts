import mapboxgl from "mapbox-gl";
import type { FeatureCollection, Point } from "geojson";
import { palette } from "@/theme/palette";
import { industryColors } from "@/data/businesses";
import type { Business } from "@/data/business-types";
import {
  LAYER_BUSINESS_CLUSTERS,
  LAYER_BUSINESS_CLUSTER_COUNT,
  LAYER_BUSINESS_POINTS,
  SOURCE_BUSINESSES,
} from "@/map/layerIds";

export interface BusinessMarkerCallbacks {
  onSelect?: (businessId: string) => void;
  onHoverChange?: (businessId: string | null) => void;
}

export interface BusinessMarkerHandle {
  /** Replaces the rendered set of markers (called whenever filters change). */
  setBusinesses: (businesses: Business[]) => void;
  /** Updates which marker is drawn as selected (larger, accent ring) without re-filtering. */
  setSelected: (businessId: string | null) => void;
  /** Flies the camera to a single business's headquarters and zooms past the cluster radius. */
  flyToBusiness: (business: Business) => void;
}

interface BusinessPointProperties {
  businessId: string;
  name: string;
  industry: string;
  color: string;
  city: string;
  countryName: string;
}

function toFeatureCollection(list: Business[]): FeatureCollection<Point, BusinessPointProperties> {
  return {
    type: "FeatureCollection",
    features: list.map((biz) => ({
      type: "Feature",
      properties: {
        businessId: biz.id,
        name: biz.name,
        industry: biz.industry,
        color: industryColors[biz.industry] ?? palette.accent,
        city: biz.headquarters.city,
        countryName: biz.headquarters.countryName,
      },
      geometry: { type: "Point", coordinates: biz.headquarters.coordinates },
    })),
  };
}

/**
 * Adds a clustered GeoJSON source of business headquarters markers (not
 * every country a business serves — see serviceCoverage in the data
 * model) plus the cluster-circle, cluster-count-label, and individual
 * point layers. Clustering is Mapbox's built-in `cluster: true` on the
 * source, which keeps dense regions (e.g. Western Europe) legible at
 * low zoom without a custom clustering library.
 */
export function addBusinessMarkerLayers(
  map: mapboxgl.Map,
  initialBusinesses: Business[],
  callbacks: BusinessMarkerCallbacks = {}
): BusinessMarkerHandle {
  map.addSource(SOURCE_BUSINESSES, {
    type: "geojson",
    data: toFeatureCollection(initialBusinesses),
    cluster: true,
    clusterRadius: 44,
    clusterMaxZoom: 6,
  });

  map.addLayer({
    id: LAYER_BUSINESS_CLUSTERS,
    type: "circle",
    source: SOURCE_BUSINESSES,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": palette.accent,
      "circle-opacity": 0.85,
      "circle-stroke-color": palette.background,
      "circle-stroke-width": 2,
      "circle-radius": ["step", ["get", "point_count"], 14, 5, 18, 10, 24],
    },
  });

  map.addLayer({
    id: LAYER_BUSINESS_CLUSTER_COUNT,
    type: "symbol",
    source: SOURCE_BUSINESSES,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
    paint: {
      "text-color": palette.navRail,
    },
  });

  map.addLayer({
    id: LAYER_BUSINESS_POINTS,
    type: "circle",
    source: SOURCE_BUSINESSES,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": ["case", ["==", ["get", "businessId"], "__none__"], 9, 6],
      "circle-stroke-color": palette.background,
      "circle-stroke-width": 1.5,
    },
  });

  function applySelection(selectedId: string | null) {
    map.setPaintProperty(LAYER_BUSINESS_POINTS, "circle-radius", [
      "case",
      ["==", ["get", "businessId"], selectedId ?? "__none__"],
      9,
      6,
    ]);
    map.setPaintProperty(LAYER_BUSINESS_POINTS, "circle-stroke-color", [
      "case",
      ["==", ["get", "businessId"], selectedId ?? "__none__"],
      palette.accent,
      palette.background,
    ]);
    map.setPaintProperty(LAYER_BUSINESS_POINTS, "circle-stroke-width", [
      "case",
      ["==", ["get", "businessId"], selectedId ?? "__none__"],
      2.5,
      1.5,
    ]);
  }

  map.on("mouseenter", LAYER_BUSINESS_POINTS, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", LAYER_BUSINESS_POINTS, () => {
    map.getCanvas().style.cursor = "";
    callbacks.onHoverChange?.(null);
  });
  map.on("mousemove", LAYER_BUSINESS_POINTS, (e: mapboxgl.MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties as BusinessPointProperties | undefined;
    callbacks.onHoverChange?.(props?.businessId ?? null);
  });

  map.on("click", LAYER_BUSINESS_POINTS, (e: mapboxgl.MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties as BusinessPointProperties | undefined;
    if (props?.businessId) callbacks.onSelect?.(props.businessId);
  });

  map.on("mouseenter", LAYER_BUSINESS_CLUSTERS, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", LAYER_BUSINESS_CLUSTERS, () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("click", LAYER_BUSINESS_CLUSTERS, (e: mapboxgl.MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    const clusterId = feature?.properties?.cluster_id;
    if (clusterId === undefined) return;
    const source = map.getSource(SOURCE_BUSINESSES) as mapboxgl.GeoJSONSource;
    const geometry = feature?.geometry;
    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err || geometry?.type !== "Point" || typeof zoom !== "number") return;
      map.easeTo({ center: geometry.coordinates as [number, number], zoom });
    });
  });

  return {
    setBusinesses: (list: Business[]) => {
      const source = map.getSource(SOURCE_BUSINESSES) as mapboxgl.GeoJSONSource | undefined;
      source?.setData(toFeatureCollection(list));
    },
    setSelected: applySelection,
    flyToBusiness: (business: Business) => {
      map.flyTo({ center: business.headquarters.coordinates, zoom: 5, duration: 900 });
    },
  };
}
