/**
 * TypeScript mirror of the approved palette in theme/tokens.css.
 *
 * CSS custom properties can't be read from Mapbox GL style paint
 * expressions (the style spec takes literal values), so the hex values
 * live here for map code, and in tokens.css for application UI. Keep the
 * two in sync — this file exists purely to avoid repeating magic hex
 * strings across map/*.ts files.
 */
export const palette = {
  navRail: "#1e0032",
  panel: "#291d36",
  background: "#17151d",
  mapOcean: "#252633",
  mapLand: "#444251",
  textPrimary: "#f4f1f7",
  textSecondary: "#b9b0c4",
  border: "#493b55",
  accent: "#48c7bf",
  accentHover: "#5cd6ce",
} as const;
