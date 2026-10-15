/**
 * Central app configuration.
 *
 * Kept deliberately separate from components, map logic, and data so this
 * entire directory app can be reconfigured for a different brand/industry
 * by editing this file (and theme/tokens.css) rather than touching UI code.
 */

export const appConfig = {
  brand: {
    name: "JB Advisory",
    tagline: "Transforming business through technology.",
    productName: "Global Business Network",
  },

  nav: {
    items: [
      { id: "map", label: "Map", icon: "globe", disabled: false },
      { id: "directory", label: "Directory", icon: "list", disabled: false },
      { id: "insights", label: "Insights", icon: "bar-chart", disabled: true },
      { id: "settings", label: "Settings", icon: "gear", disabled: false },
    ],
  } as const,

  map: {
    // Mapbox style is built in code (src/map/mapStyle.ts) rather than a
    // Mapbox Studio style, for exact palette control and zero external
    // style maintenance.
    projection: "naturalEarth" as const,
    initialCenter: [10, 20] as [number, number],
    initialZoom: 1.3,
    minZoom: 0.9,
    maxZoom: 12,
    globalViewBounds: undefined as [number, number, number, number] | undefined,
  },

  directory: {
    pageSize: 6,
    defaultSort: "relevance" as const,
  },

  dataDisclosure:
    "All businesses shown are fictional demonstration data created for this prototype and do not represent real companies.",
} as const;

export type AppConfig = typeof appConfig;
